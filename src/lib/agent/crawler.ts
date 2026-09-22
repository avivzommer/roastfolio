/**
 * Portfolio crawler — uses headless Chromium via Playwright.
 *
 * The reviewer agent needs to *see* a portfolio the way a human does, not
 * the way `curl` does. Most modern portfolios (Framer, Webflow, custom Next
 * sites) render almost nothing in raw HTML — text appears only after JS runs.
 *
 * This module opens the URL in a real browser, waits for the page to settle,
 * captures the rendered text and a full-page screenshot, then finds links
 * that look like case studies and does the same for each (cap at 5).
 *
 * When screenshotDir is provided, each PNG is also written to disk so the UI
 * can render it via <img>.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "playwright";

// 45s tolerates Framer / Vercel / SPA cold-loads over Railway's shared CPU.
// Any host that legitimately can't reach domcontentloaded in 45s isn't
// something we can meaningfully evaluate anyway.
const GOTO_TIMEOUT_MS = 45_000;
const MAX_CASE_STUDIES = 5;
const MAX_TEXT_CHARS = 8_000;
const VIEWPORT_WIDTH = 1440;
const VIEWPORT_HEIGHT = 900;
/** Cap full-page screenshot height. Some homepages scroll forever.
 *  Lower means smaller PNG → fewer image tokens to Claude → faster LLM round-trip
 *  and lower OOM risk on the small Railway container. 4500px is enough to cover
 *  a typical hero + below-the-fold content. */
const SCREENSHOT_HEIGHT_CAP = 4_500;

export interface CrawlOptions {
  /** If set, screenshots are written here as PNG files. */
  screenshotDir?: string;
  /** Public URL prefix (e.g. /screenshots/abc). Combined with filename. */
  publicPathPrefix?: string;
}

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
  /** Base64 PNG, for sending to LLM. */
  screenshotBase64: string;
  /** Public URL path (e.g. /screenshots/abc/homepage.png) when saved. */
  screenshotPath?: string;
}

export interface CrawledPortfolio {
  homepageUrl: string;
  homepage: CrawledPage;
  caseStudies: CrawledPage[];
  errors: string[];
}

export async function crawlPortfolio(
  url: string,
  options: CrawlOptions = {},
): Promise<CrawledPortfolio> {
  const errors: string[] = [];
  let browser: Browser | undefined;

  try {
    // Flags required to run headless Chromium reliably inside Docker/Railway.
    // Without --disable-dev-shm-usage, the browser tab crashes on memory-heavy
    // pages because Chromium's default /dev/shm is too small in containers.
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
    const context = await browser.newContext({
      viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0 Safari/537.36 PortfolioReviewBot/1.0",
    });
    const page = await context.newPage();
    console.log(`[crawl] browser ready; homepage=${url}`);

    const homepage = await capturePage(page, url, "homepage", options);
    console.log(`[crawl] homepage captured; textLen=${homepage.text.length}`);
    const caseStudyUrls = await findCaseStudyUrls(page, url, homepage.url);
    console.log(`[crawl] found ${caseStudyUrls.length} case-study url(s)`);

    const caseStudies: CrawledPage[] = [];
    for (let i = 0; i < Math.min(caseStudyUrls.length, MAX_CASE_STUDIES); i++) {
      const csUrl = caseStudyUrls[i];
      console.log(`[crawl] case-study ${i + 1}/${Math.min(caseStudyUrls.length, MAX_CASE_STUDIES)}: ${csUrl}`);
      try {
        const label = `cs-${i + 1}`;
        // Hard outer timeout — if Chromium wedges silently and Playwright's
        // own timeouts don't fire, we still bail out and move on.
        const PER_URL_WALLCLOCK_MS = 120_000;
        const cs = await Promise.race([
          capturePage(page, csUrl, label, options),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`wallclock timeout after ${PER_URL_WALLCLOCK_MS}ms`)),
              PER_URL_WALLCLOCK_MS,
            ),
          ),
        ]);
        caseStudies.push(cs);
      } catch (err) {
        errors.push(
          `Could not capture ${csUrl}: ${String(err).slice(0, 140)}`,
        );
      }
    }

    // Fallback for state-routed SPAs (e.g., a portfolio where each case study
    // is opened by clicking a <div class="cursor-pointer"> card and the URL
    // never changes). Only runs when no link-based case studies were captured.
    if (caseStudies.length === 0) {
      const cardCount = await countClickableCards(page);
      for (let i = 0; i < Math.min(cardCount, MAX_CASE_STUDIES); i++) {
        try {
          // Reset to homepage between cards — clicking a card swaps the visible
          // content, and we need a clean slate to find the next card by index.
          await page.goto(homepage.url, {
            waitUntil: "domcontentloaded",
            timeout: GOTO_TIMEOUT_MS,
          });
          await page.waitForTimeout(1_500);

          await clickNthCard(page, i);
          await page.waitForTimeout(1_800);

          const label = `cs-${i + 1}`;
          const cs = await capturePage(
            page,
            page.url(),
            label,
            options,
            { skipNavigate: true },
          );
          caseStudies.push(cs);
        } catch (err) {
          errors.push(
            `Could not capture card #${i + 1}: ${String(err).slice(0, 140)}`,
          );
        }
      }
    }

    return {
      homepageUrl: url,
      homepage,
      caseStudies,
      errors,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function capturePage(
  page: Page,
  url: string,
  label: string,
  options: CrawlOptions,
  flags: { skipNavigate?: boolean } = {},
): Promise<CrawledPage> {
  if (!flags.skipNavigate) {
    console.log(`[crawl:${label}] goto ${url}`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: GOTO_TIMEOUT_MS,
    });
    console.log(`[crawl:${label}] goto done`);
  }

  // Give SPA frameworks a moment to hydrate.
  await page.waitForTimeout(1_200);
  console.log(`[crawl:${label}] scrolling`);

  // Some Framer/SPA case-study pages wedge CDP on the first page.evaluate
  // after goto — the browser is alive but never responds. Wrap every
  // evaluate in a short race so a wedged call bails out fast and we move on
  // with whatever we have.
  const withTimeout = <T>(p: Promise<T>, ms: number, fallback: T): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);

  // Try to trigger any lazy-loaded content by scrolling to the bottom.
  await withTimeout(
    page
      .evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      })
      .catch(() => {}),
    5_000,
    undefined,
  );
  await page.waitForTimeout(600);
  await withTimeout(
    page
      .evaluate(() => {
        window.scrollTo(0, 0);
      })
      .catch(() => {}),
    5_000,
    undefined,
  );
  await page.waitForTimeout(200);

  console.log(`[crawl:${label}] extracting title + text`);
  const title = await withTimeout(page.title().catch(() => ""), 5_000, "");

  const text = await withTimeout(
    page
      .evaluate((maxChars) => {
        const body = document.body.cloneNode(true) as HTMLElement;
        body.querySelectorAll("script, style, noscript, svg").forEach((el) =>
          el.remove(),
        );
        const raw = (body as HTMLElement).innerText ?? "";
        return raw.replace(/\s+/g, " ").trim().slice(0, maxChars);
      }, MAX_TEXT_CHARS)
      .catch(() => ""),
    15_000,
    "",
  );

  console.log(`[crawl:${label}] taking screenshot`);
  // Cap height for very long pages — both for Anthropic image limits and UI.
  const fullHeight = await withTimeout(
    page
      .evaluate(() => document.documentElement.scrollHeight)
      .catch(() => VIEWPORT_HEIGHT),
    5_000,
    VIEWPORT_HEIGHT,
  );
  const cappedHeight = Math.min(
    Math.max(fullHeight, VIEWPORT_HEIGHT),
    SCREENSHOT_HEIGHT_CAP,
  );

  const screenshotBuffer = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: VIEWPORT_WIDTH, height: cappedHeight },
    // Default Playwright timeout is 30s. Encoding a 1440×8000 PNG on Railway's
    // shared CPU can exceed that; bump to 90s.
    timeout: 90_000,
  });
  console.log(`[crawl:${label}] screenshot ok (${cappedHeight}px)`);

  let screenshotPath: string | undefined;
  if (options.screenshotDir) {
    await mkdir(options.screenshotDir, { recursive: true });
    const filename = `${label}.png`;
    await writeFile(join(options.screenshotDir, filename), screenshotBuffer);
    if (options.publicPathPrefix) {
      screenshotPath = `${options.publicPathPrefix}/${filename}`;
    }
  }

  return {
    url: page.url(),
    title: title || url,
    text,
    screenshotBase64: screenshotBuffer.toString("base64"),
    screenshotPath,
  };
}

// ---------------------------------------------------------------------------
// Link discovery — multi-signal scoring (path + text + card pattern + DOM).
// ---------------------------------------------------------------------------

/**
 * Pure scoring function — exposed so we can test it without spinning up
 * a browser. Returns higher numbers for links more likely to be case studies.
 */
export function scoreCandidate(input: {
  path: string;
  text: string;
  hasImage: boolean;
  hasHeading: boolean;
  inFooter: boolean;
  inNav: boolean;
  inMain: boolean;
}): number {
  let score = 0;

  // URL-path signals (high confidence on convention-following sites).
  if (/case[\s\-_/]?stud/i.test(input.path)) score += 6;
  if (/\/project[s]?(\/|$)/i.test(input.path)) score += 5;
  if (/\/work(\/|$)/i.test(input.path)) score += 4;
  if (/portfolio/i.test(input.path)) score += 3;

  // Root-level slug — catches Framer/Webflow sites where case studies live
  // at /gusto, /therabody, etc. with no descriptive prefix.
  const segments = input.path.split("/").filter(Boolean);
  if (
    segments.length === 1 &&
    segments[0].length >= 3 &&
    segments[0].length <= 40
  ) {
    score += 2;
  }

  // Link-text signals.
  const lowText = input.text.toLowerCase();
  if (/case\s*stud/i.test(lowText)) score += 4;
  if (/view\s+(project|work|case|study)/i.test(lowText)) score += 3;
  if (/(read|learn|explore|view)\s+more/i.test(lowText)) score += 2;

  // Card-pattern signals.
  if (input.hasImage && input.hasHeading) score += 4;
  else if (input.hasImage || input.hasHeading) score += 2;

  // DOM context.
  if (input.inFooter) score -= 4;
  if (input.inMain) score += 1;

  if (input.text.length >= 2 && input.text.length <= 80) score += 1;

  return score;
}

const NEGATIVE_PATH =
  /^\/(?:about|contact|services?|pricing|blog|sign[-_]?in|sign[-_]?up|login|logout|cart|checkout|privacy|terms|tos|legal|faq|help|home|press|news|company|jobs|careers|hire|search|book|schedule|index|resume|cv|downloads?|store|thank[-_]?you|confirmation|unsubscribe|404|500)(?:\/|$)/i;
const FILE_EXT =
  /\.(pdf|png|jpe?g|svg|webp|gif|zip|mp4|mov|webm|avi|css|js|woff2?|ttf|otf)$/i;
const MIN_SCORE = 3;

async function findCaseStudyUrls(
  page: Page,
  baseUrl: string,
  homepageUrl: string,
): Promise<string[]> {
  const baseHost = new URL(baseUrl).host;

  const rawLinks = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => {
      const link = a as HTMLAnchorElement;
      let inFooter = false;
      let inNav = false;
      let inMain = false;
      let node: Element | null = link.parentElement;
      while (node && node !== document.body) {
        const tag = node.tagName.toLowerCase();
        const role = (node.getAttribute("role") || "").toLowerCase();
        if (tag === "footer" || role === "contentinfo") inFooter = true;
        if (tag === "nav" || role === "navigation") inNav = true;
        if (tag === "main" || tag === "article" || role === "main") inMain = true;
        node = node.parentElement;
      }
      const card =
        link.closest(
          "article, [class*='card' i], [class*='project' i], [class*='work' i], [class*='case' i]",
        ) ||
        link.parentElement ||
        link;
      const cardEl = card as Element;
      const hasImage = !!cardEl.querySelector("img, picture");
      const hasHeading = !!cardEl.querySelector(
        "h1, h2, h3, h4, h5, h6, [class*='title' i], [class*='heading' i]",
      );
      return {
        href: link.href,
        text: (
          (link as HTMLElement).innerText ||
          link.textContent ||
          ""
        )
          .trim()
          .slice(0, 140),
        inFooter,
        inNav,
        inMain,
        hasImage,
        hasHeading,
      };
    }),
  );

  const scored = new Map<string, number>();
  for (const link of rawLinks) {
    let parsed: URL;
    try {
      parsed = new URL(link.href);
    } catch {
      continue;
    }
    if (parsed.host !== baseHost) continue;
    if (parsed.href === homepageUrl) continue;
    if (parsed.pathname === "/" || parsed.pathname === "") continue;
    if (FILE_EXT.test(parsed.pathname)) continue;
    if (/^(mailto|tel|javascript):/i.test(parsed.href)) continue;
    if (NEGATIVE_PATH.test(parsed.pathname)) continue;

    const score = scoreCandidate({
      path: parsed.pathname,
      text: link.text,
      hasImage: link.hasImage,
      hasHeading: link.hasHeading,
      inFooter: link.inFooter,
      inNav: link.inNav,
      inMain: link.inMain,
    });
    if (score < MIN_SCORE) continue;

    const prev = scored.get(parsed.href) ?? 0;
    if (score > prev) scored.set(parsed.href, score);
  }

  return Array.from(scored.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([url]) => url);
}

// ---------------------------------------------------------------------------
// Clickable-card discovery — for SPAs where case studies are state-routed.
// ---------------------------------------------------------------------------

/**
 * Returns the count of clickable "card" elements on the page — the fallback
 * used when no <a href> case studies were found. Cards are divs/sections with
 * `cursor: pointer` containing an image (or background-image) and meaningful
 * text. Anchors and buttons are excluded (already handled by link discovery).
 *
 * The heading requirement was intentionally dropped after portfolios built
 * with Figma Sites came up: that runtime renders EVERYTHING as <div>/<p>
 * with no semantic tags at all, so requiring <h1>-<h6> hid every case study.
 * The text-length filter (>= 15 chars) still rejects short nav items like
 * "About" or "Projects" that might slip past the image check via icons.
 */
async function countClickableCards(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("*"));
    const candidates = all.filter((el) => {
      if (el.tagName === "BUTTON" || el.tagName === "A") return false;
      const cs = getComputedStyle(el);
      if (cs.cursor !== "pointer") return false;
      const text = (el.textContent || "").trim();
      if (text.length < 15 || text.length > 500) return false;
      // Image can be an <img>/<picture> OR any descendant using a CSS
      // background-image (common in Figma Sites and Webflow).
      const hasInlineImage = !!el.querySelector("img, picture");
      const hasBgImage = Array.from(el.querySelectorAll("*")).some((d) => {
        const bg = getComputedStyle(d as Element).backgroundImage;
        return bg && bg !== "none";
      });
      return hasInlineImage || hasBgImage;
    });
    // Keep only deepest matches (avoid counting parent + child both).
    const deepest = candidates.filter(
      (el) => !candidates.some((other) => other !== el && el.contains(other)),
    );
    return deepest.length;
  });
}

/** Clicks the i-th clickable card matching the same heuristic as the counter. */
async function clickNthCard(page: Page, index: number): Promise<void> {
  await page.evaluate((idx) => {
    const all = Array.from(document.querySelectorAll("*"));
    const candidates = all.filter((el) => {
      if (el.tagName === "BUTTON" || el.tagName === "A") return false;
      const cs = getComputedStyle(el);
      if (cs.cursor !== "pointer") return false;
      const text = (el.textContent || "").trim();
      if (text.length < 15 || text.length > 500) return false;
      const hasInlineImage = !!el.querySelector("img, picture");
      const hasBgImage = Array.from(el.querySelectorAll("*")).some((d) => {
        const bg = getComputedStyle(d as Element).backgroundImage;
        return bg && bg !== "none";
      });
      return hasInlineImage || hasBgImage;
    });
    const deepest = candidates.filter(
      (el) => !candidates.some((other) => other !== el && el.contains(other)),
    );
    const el = deepest[idx] as HTMLElement | undefined;
    if (!el) throw new Error(`No clickable card at index ${idx}`);
    el.scrollIntoView({ block: "center" });
    el.click();
  }, index);
}
