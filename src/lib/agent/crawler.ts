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

const FIRECRAWL_SCRAPE_URL = "https://api.firecrawl.dev/v2/scrape";
const MAX_CASE_STUDIES = 5;
const MAX_TEXT_CHARS = 8_000;
// Firecrawl handles its own timeouts internally; this is our outer bound.
const SCRAPE_TIMEOUT_MS = 90_000;

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
  const buffer = Buffer.from(await res.arrayBuffer());

  let publicPath: string | undefined;
  if (options.screenshotDir) {
    await mkdir(options.screenshotDir, { recursive: true });
    const filename = `${label}.png`;
    await writeFile(join(options.screenshotDir, filename), buffer);
    if (options.publicPathPrefix) {
      publicPath = `${options.publicPathPrefix}/${filename}`;
    }
  }

  return { base64: buffer.toString("base64"), publicPath };
}

async function scrapePage(
  url: string,
  label: string,
  options: CrawlOptions,
  withActions?: FirecrawlAction[],
): Promise<{ page: CrawledPage; links: string[] }> {
  console.log(`[crawl:${label}] firecrawl scrape ${url}`);
  const result = await callFirecrawl(url, { withActions });
  const data = result.data ?? {};
  console.log(
    `[crawl:${label}] firecrawl done; markdownLen=${(data.markdown ?? "").length}; links=${(data.links ?? []).length}`,
  );

  const text = (data.markdown ?? "").slice(0, MAX_TEXT_CHARS);
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
  };
}

export async function crawlPortfolio(
  url: string,
  options: CrawlOptions = {},
): Promise<CrawledPortfolio> {
  const errors: string[] = [];

  console.log(`[crawl] starting; url=${url}; hasPassword=${!!options.casePassword}`);

  // ---------- Homepage (1 credit; also gives us the link list) ----------
  const home = await scrapePage(url, "homepage", options);
  const homepage = home.page;
  const homepageUrl = homepage.url;

  // ---------- Case study discovery ----------
  const caseStudyUrls = pickCaseStudyUrls(home.links, homepageUrl, homepage.text);
  console.log(`[crawl] found ${caseStudyUrls.length} candidate case-study url(s)`);

  // ---------- Case studies ----------
  const caseStudies: CrawledPage[] = [];
  const actions = options.casePassword
    ? passwordActions(options.casePassword)
    : undefined;

  for (let i = 0; i < Math.min(caseStudyUrls.length, MAX_CASE_STUDIES); i++) {
    const csUrl = caseStudyUrls[i];
    const label = `cs-${i + 1}`;
    console.log(`[crawl] case-study ${i + 1}/${Math.min(caseStudyUrls.length, MAX_CASE_STUDIES)}: ${csUrl}`);
    try {
      const cs = await scrapePage(csUrl, label, options, actions);
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
