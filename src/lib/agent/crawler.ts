/**
 * Portfolio crawler — Firecrawl-powered.
 *
 * The reviewer agent needs to *see* a portfolio the way a human does, not
 * the way `curl` does. Modern portfolios (Framer, Webflow, custom Next sites)
 * render almost nothing in raw HTML — text appears only after JS runs.
 *
 * Instead of running Playwright/Chromium inside our container (which was
 * flaky on Railway's shared CPU and added ~1.6GB to the image), we call
 * Firecrawl's hosted scrape API: they run the browser, we get back
 * markdown + links + a hosted screenshot URL.
 *
 * For password-gated case studies, Firecrawl's `actions` parameter lets us
 * script a click + type + Enter sequence to unlock the page before scraping.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";
const MAX_CASE_STUDIES = 5;
const MAX_TEXT_CHARS = 8_000;
// Firecrawl handles its own timeouts internally; this is our outer bound.
const SCRAPE_TIMEOUT_MS = 90_000;
// Claude rejects any image with either dimension > 8000px. Full-page
// screenshots of long case studies routinely cross this. We crop the top
// portion before sending to the LLM, which keeps hero + above-the-fold
// context (where UI craft is judged) and discards infinite-scroll tails.
const MAX_SCREENSHOT_HEIGHT = 7_500;

export interface CrawlOptions {
  /** If set, screenshots are written here as PNG files. */
  screenshotDir?: string;
  /** Public URL prefix (e.g. /screenshots/abc). Combined with filename. */
  publicPathPrefix?: string;
  /** Optional password for gated case studies. When set, we run the
   *  click-type-Enter action sequence on each case-study scrape. */
  casePassword?: string | null;
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

type FirecrawlAction =
  | { type: "wait"; milliseconds: number }
  | { type: "click"; selector: string }
  | { type: "write"; text: string }
  | { type: "press"; key: string };

interface FirecrawlScrapeResponse {
  success?: boolean;
  data?: {
    markdown?: string;
    links?: string[];
    screenshot?: string;
    metadata?: {
      title?: string;
      sourceURL?: string;
      url?: string;
      statusCode?: number;
    };
  };
  error?: string;
}

/**
 * Pattern-match a Firecrawl response to tell whether the page we got back
 * is a password gate (site-level or page-level) rather than real content.
 * Returns true when the password hasn't been applied yet and the page
 * clearly shows a "Enter password" / 401 state.
 */
function looksLikePasswordGate(
  markdown: string | undefined,
  statusCode: number | undefined,
): boolean {
  if (statusCode === 401) return true;
  if (!markdown) return false;
  const short = markdown.length < 300;
  const hasPhrase =
    /enter\s*password|password\s*required|password\s*protected|site\s*is\s*password|this\s*case\s*study\s*is\s*password/i.test(
      markdown,
    );
  return short && hasPhrase;
}

/**
 * Build the password-unlock action sequence. Clicks the password input,
 * types the password, presses Enter. Pressing Enter is more portable than
 * guessing a submit-button selector across Framer / Webflow / custom gates.
 */
function passwordActions(password: string): FirecrawlAction[] {
  return [
    { type: "wait", milliseconds: 1500 },
    { type: "click", selector: "input[type='password']" },
    { type: "write", text: password },
    { type: "press", key: "Enter" },
    { type: "wait", milliseconds: 2500 },
  ];
}

async function callFirecrawl(
  url: string,
  opts: { withActions?: FirecrawlAction[] } = {},
): Promise<FirecrawlScrapeResponse> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }
  const body: Record<string, unknown> = {
    url,
    // Firecrawl v2 moved screenshot options inside the formats array (as an
    // object entry) and no longer accepts a top-level `screenshotOptions`
    // key. Keeping the plain-string entries for markdown + links.
    formats: [
      "markdown",
      "links",
      { type: "screenshot", fullPage: true },
    ],
    onlyMainContent: false,
    // Live fetch; portfolios change and we never want a stale snapshot.
    maxAge: 0,
    timeout: SCRAPE_TIMEOUT_MS,
  };
  if (opts.withActions && opts.withActions.length > 0) {
    body.actions = opts.withActions;
  }

  const controller = new AbortController();
  const abortTimer = setTimeout(
    () => controller.abort(),
    SCRAPE_TIMEOUT_MS + 10_000,
  );
  try {
    const res = await fetch(FIRECRAWL_SCRAPE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = (await res.json()) as FirecrawlScrapeResponse;
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? `firecrawl ${res.status}`);
    }
    return json;
  } finally {
    clearTimeout(abortTimer);
  }
}

/**
 * Download the hosted screenshot URL Firecrawl returns, save to disk if
 * screenshotDir is set, and return the base64 for the LLM.
 */
async function persistScreenshot(
  screenshotUrl: string | undefined,
  label: string,
  options: CrawlOptions,
): Promise<{ base64: string; publicPath?: string }> {
  if (!screenshotUrl) return { base64: "" };

  const res = await fetch(screenshotUrl);
  if (!res.ok) {
    throw new Error(`screenshot download ${res.status}`);
  }
  const fullBuffer = Buffer.from(await res.arrayBuffer());

  // The full-page PNG goes to disk as-is — the review UI shows the whole
  // scrollable screenshot. For the LLM we send a cropped-to-top variant
  // because Claude's image inputs cap at 8000px per side.
  const meta = await sharp(fullBuffer).metadata();
  const needsCrop =
    typeof meta.height === "number" && meta.height > MAX_SCREENSHOT_HEIGHT;
  const llmBuffer = needsCrop
    ? await sharp(fullBuffer)
        .extract({
          left: 0,
          top: 0,
          width: meta.width ?? 1920,
          height: MAX_SCREENSHOT_HEIGHT,
        })
        .png()
        .toBuffer()
    : fullBuffer;
  if (needsCrop) {
    console.log(
      `[crawl:${label}] cropped screenshot ${meta.width}x${meta.height} → ${meta.width}x${MAX_SCREENSHOT_HEIGHT} for LLM`,
    );
  }

  let publicPath: string | undefined;
  if (options.screenshotDir) {
    await mkdir(options.screenshotDir, { recursive: true });
    const filename = `${label}.png`;
    await writeFile(join(options.screenshotDir, filename), fullBuffer);
    if (options.publicPathPrefix) {
      publicPath = `${options.publicPathPrefix}/${filename}`;
    }
  }

  return { base64: llmBuffer.toString("base64"), publicPath };
}

async function scrapePage(
  url: string,
  label: string,
  options: CrawlOptions,
  withActions?: FirecrawlAction[],
): Promise<{
  page: CrawledPage;
  links: string[];
  statusCode?: number;
  rawMarkdown: string;
}> {
  console.log(
    `[crawl:${label}] firecrawl scrape ${url}${withActions ? " (with actions)" : ""}`,
  );
  const result = await callFirecrawl(url, { withActions });
  const data = result.data ?? {};
  const rawMarkdown = data.markdown ?? "";
  console.log(
    `[crawl:${label}] firecrawl done; status=${data.metadata?.statusCode}; markdownLen=${rawMarkdown.length}; links=${(data.links ?? []).length}`,
  );

  const text = rawMarkdown.slice(0, MAX_TEXT_CHARS);
  const title = data.metadata?.title ?? url;
  const finalUrl = data.metadata?.sourceURL ?? data.metadata?.url ?? url;

  const shot = await persistScreenshot(data.screenshot, label, options);
  console.log(`[crawl:${label}] screenshot persisted (${shot.base64.length} b64 chars)`);

  return {
    page: {
      url: finalUrl,
      title,
      text,
      screenshotBase64: shot.base64,
      screenshotPath: shot.publicPath,
    },
    links: data.links ?? [],
    statusCode: data.metadata?.statusCode,
    rawMarkdown,
  };
}

export async function crawlPortfolio(
  url: string,
  options: CrawlOptions = {},
): Promise<CrawledPortfolio> {
  const errors: string[] = [];

  console.log(`[crawl] starting; url=${url}; hasPassword=${!!options.casePassword}`);

  // ---------- Homepage (1 credit; also gives us the link list) ----------
  // First try without actions. If the response looks like a site-level
  // password gate and we have a password, retry with the unlock sequence.
  let home = await scrapePage(url, "homepage", options);
  let siteWasGated = false;
  if (
    options.casePassword &&
    looksLikePasswordGate(home.rawMarkdown, home.statusCode)
  ) {
    console.log(
      `[crawl] homepage appears site-level gated — retrying with password`,
    );
    siteWasGated = true;
    home = await scrapePage(
      url,
      "homepage",
      options,
      passwordActions(options.casePassword),
    );
  }
  const homepage = home.page;
  const homepageUrl = homepage.url;

  // ---------- Case study discovery ----------
  let caseStudyUrls = pickCaseStudyUrls(home.links, homepageUrl, homepage.text);
  console.log(`[crawl] found ${caseStudyUrls.length} candidate case-study url(s) from homepage`);

  // Index-page fallback. Some portfolios list case studies on a second-level
  // index like /works, /projects, /portfolio. If the homepage only produced
  // 0-1 candidates AND the single candidate (or any homepage link) matches an
  // index-page name, scrape that index too and merge its outbound links.
  if (caseStudyUrls.length <= 1) {
    const indexUrl = findIndexPageUrl(home.links, homepageUrl);
    if (indexUrl) {
      console.log(
        `[crawl] few candidates from homepage; crawling index page ${indexUrl} for case-study links`,
      );
      try {
        const indexScrape = await scrapePage(
          indexUrl,
          "index-scan",
          options,
          // When the whole site is gated, the index page also needs the
          // password unlock before we can see its links.
          options.casePassword
            ? passwordActions(options.casePassword)
            : undefined,
        );
        const subUrls = pickCaseStudyUrls(
          indexScrape.links,
          homepageUrl,
          indexScrape.rawMarkdown,
        );
        console.log(`[crawl] index page yielded ${subUrls.length} extra candidate(s)`);
        // Dedupe while preserving order and keeping the original homepage
        // candidate first (in case it IS a real case study).
        const seen = new Set<string>();
        const merged: string[] = [];
        for (const u of [...caseStudyUrls, ...subUrls]) {
          const key = normalizeUrl(u);
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(u);
        }
        caseStudyUrls = merged;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[crawl] index page scan failed: ${msg.slice(0, 140)}`);
      }
    }
  }
  console.log(`[crawl] final candidate list: ${caseStudyUrls.length} url(s)`);

  // Password-targeting strategy:
  //   - If site was gated at the root → every case study is behind the same
  //     gate (Firecrawl starts a fresh browser per scrape, so no cookie
  //     carries over). Apply unlock on ALL case studies.
  //   - Otherwise → only apply unlock on URLs the homepage markdown labeled
  //     "Password required" (the Framer per-case-study pattern). This avoids
  //     the "Element not found" error when the click action targets a public
  //     page with no password input.
  const gatedUrls = options.casePassword && !siteWasGated
    ? detectGatedUrls(homepage.text)
    : new Set<string>();
  if (options.casePassword) {
    console.log(
      `[crawl] gated urls (will unlock with password): ${siteWasGated ? "all (site-gated)" : gatedUrls.size}`,
    );
  }

  // ---------- Case studies ----------
  const caseStudies: CrawledPage[] = [];
  const unlockActions = options.casePassword
    ? passwordActions(options.casePassword)
    : undefined;

  for (let i = 0; i < Math.min(caseStudyUrls.length, MAX_CASE_STUDIES); i++) {
    const csUrl = caseStudyUrls[i];
    const label = `cs-${i + 1}`;
    const useUnlock =
      unlockActions && (siteWasGated || gatedUrls.has(normalizeUrl(csUrl)));
    console.log(
      `[crawl] case-study ${i + 1}/${Math.min(caseStudyUrls.length, MAX_CASE_STUDIES)}: ${csUrl}${useUnlock ? " (unlocking)" : ""}`,
    );
    try {
      const cs = await scrapePage(
        csUrl,
        label,
        options,
        useUnlock ? unlockActions : undefined,
      );
      caseStudies.push(cs.page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Could not capture ${csUrl}: ${msg.slice(0, 140)}`);
      console.warn(`[crawl] ${label} failed: ${msg.slice(0, 140)}`);
    }
  }

  return {
    homepageUrl,
    homepage,
    caseStudies,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Link scoring — pure logic, no browser needed. Used to filter the homepage's
// outgoing links down to probable case-study URLs.
// ---------------------------------------------------------------------------

/**
 * Pure scoring function — exposed so we can test it without any network.
 * Returns higher numbers for links more likely to be case studies.
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

  // Card-pattern signals (only when we have DOM context — Firecrawl doesn't).
  if (input.hasImage && input.hasHeading) score += 4;
  else if (input.hasImage || input.hasHeading) score += 2;

  // DOM context (same).
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

/**
 * Filter + rank Firecrawl's `links` array down to probable case-study URLs.
 * Same scoring heuristic as the old crawler, minus the DOM context (we
 * only know the URL + whatever text appears nearby in the markdown).
 */
export function pickCaseStudyUrls(
  rawLinks: string[],
  homepageUrl: string,
  markdown: string,
): string[] {
  const baseHost = new URL(homepageUrl).host;
  const homepagePath = new URL(homepageUrl).pathname.replace(/\/$/, "") || "/";

  const seen = new Set<string>();
  const scored: Array<{ url: string; score: number }> = [];

  for (const raw of rawLinks) {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      continue;
    }

    // Only same-host, non-asset, non-anchor links.
    if (u.host !== baseHost) continue;
    if (u.hash) continue;
    if (FILE_EXT.test(u.pathname)) continue;
    if (NEGATIVE_PATH.test(u.pathname)) continue;
    const normalizedPath = u.pathname.replace(/\/$/, "") || "/";
    if (normalizedPath === homepagePath) continue;

    // Dedupe by normalized URL (host + path, no query/hash).
    const key = `${u.host}${normalizedPath}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Find the link's text from the markdown — look for [text](url) pairs.
    // Not perfect, but gives us something to score.
    const linkText = extractLinkText(markdown, raw);

    const score = scoreCandidate({
      path: u.pathname,
      text: linkText,
      // Firecrawl's response gives us URLs but not nearby DOM — set these
      // false and rely on path + text signals, which are the strongest ones.
      hasImage: false,
      hasHeading: false,
      inFooter: false,
      inNav: false,
      inMain: true, // default-neutral assumption
    });

    if (score >= MIN_SCORE) {
      scored.push({ url: raw, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.url);
}

/**
 * Find the text label of a markdown link given its URL. Returns empty string
 * if the link isn't in the markdown or has no visible text.
 */
function extractLinkText(markdown: string, url: string): string {
  // Escape regex special chars in the URL.
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\[([^\\]]+)\\]\\(${escaped}\\)`);
  const match = markdown.match(re);
  return match?.[1]?.replace(/\s+/g, " ").trim().slice(0, 140) ?? "";
}

const GATE_PHRASES = /password\s*required|protected\s*content|enter\s*password|this\s*case\s*study\s*is\s*password/i;

/**
 * Return the set of URLs on the homepage that look password-gated.
 * We parse `[text block](url)` entries and check whether the text block
 * contains telltale phrases ("Password required", etc.). Returned URLs are
 * normalized (trailing slash removed, hash stripped) so the per-case-study
 * check matches reliably.
 */
export function detectGatedUrls(homepageMarkdown: string): Set<string> {
  const gated = new Set<string>();
  // Match [label text](url) across the whole markdown. The label can span
  // newlines in Firecrawl's output (bracketed card-style blocks), so use
  // non-greedy with [\s\S].
  const linkRe = /\[([\s\S]*?)\]\((https?:\/\/[^\s)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(homepageMarkdown)) !== null) {
    const label = m[1];
    const url = m[2];
    if (GATE_PHRASES.test(label)) {
      gated.add(normalizeUrl(url));
    }
  }
  return gated;
}

const INDEX_PATHS =
  /^\/(?:works?|projects?|portfolio|showcase|designs?|case[\s_\-]?stud(?:y|ies)?)\/?$/i;

/**
 * Return the most likely "work index" page on the same host — the thing a
 * designer would call /works, /projects, /portfolio, etc. Returns undefined
 * when no index-looking page appears in the link set.
 */
export function findIndexPageUrl(
  rawLinks: string[],
  homepageUrl: string,
): string | undefined {
  const baseHost = new URL(homepageUrl).host;
  const homepagePath = new URL(homepageUrl).pathname.replace(/\/$/, "") || "/";
  for (const raw of rawLinks) {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      continue;
    }
    if (u.host !== baseHost) continue;
    if (u.hash) continue;
    const normalizedPath = u.pathname.replace(/\/$/, "") || "/";
    if (normalizedPath === homepagePath) continue;
    if (INDEX_PATHS.test(u.pathname)) {
      return raw;
    }
  }
  return undefined;
}

/** Canonicalize a URL for Set comparisons: no hash, no trailing slash. */
function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const path = u.pathname.replace(/\/$/, "") || "/";
    return `${u.origin}${path}`;
  } catch {
    return raw;
  }
}
