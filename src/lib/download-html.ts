/**
 * Builds a standalone, self-contained HTML document for a review.
 *
 * Mirrors the M3 Expressive review page:
 *   1. Minimal header (date + URL — no verdict badge)
 *   2. Current signal — qualitative phrase
 *   3. Summary
 *   4. What's already working
 *   5. Main growth lever (callout)
 *   6. Three action cards (title + why + how + effort + expected signal)
 *   7. Closing note
 *   8. Detailed breakdown
 *        - score breakdown (rating tiers)
 *        - homepage
 *        - case studies
 *        - review risks
 *
 * Inline CSS, screenshots as base64 data URIs, Google Fonts link — works offline once the
 * font has been cached or with the system font fallback.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  OVERVIEW_METRIC_LABEL,
  OVERVIEW_METRIC_EXPLANATION,
  HOMEPAGE_METRIC_LABEL,
  HOMEPAGE_METRIC_EXPLANATION,
  HOMEPAGE_ISSUE_LABEL,
  CASE_STUDY_METRIC_LABEL,
  CASE_STUDY_METRIC_EXPLANATION,
  CASE_STUDY_TYPE_LABEL,
  type ReviewReport,
  type OverviewScores,
  type RedFlagSeverity,
  type PriorityLevel,
  type ActionItem,
} from "./types";
import { ratingOf } from "./review-view";

const OVERVIEW_KEYS = [
  "communication",
  "productThinking",
  "uxThinking",
  "uiCraft",
  "impact",
  "seniorityFit",
] as const satisfies ReadonlyArray<keyof OverviewScores>;

const HOMEPAGE_ISSUE_KEYS = [
  "smallScreenshots",
  "genericText",
  "weakCaseStudyTitles",
] as const;

const CASE_STUDY_METRIC_KEYS = [
  "problemFraming",
  "uxThinking",
  "productThinking",
  "uiCraft",
  "impact",
] as const;

async function imageToDataURI(publicPath: string): Promise<string | null> {
  if (!publicPath) return null;
  const filePath = join(
    process.cwd(),
    "public",
    publicPath.replace(/^\//, ""),
  );
  try {
    const buf = await readFile(filePath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ratingChip(score: number, size: "sm" | "md" = "md"): string {
  const r = ratingOf(score);
  const cls = `rating-chip rating-chip--${r.tone}${size === "sm" ? " sm" : ""}`;
  return `<span class="${cls}"><span class="rating-chip__dot"></span>${esc(r.label)}</span>`;
}

function severityColor(s: RedFlagSeverity): {
  bg: string;
  c: string;
  label: string;
} {
  if (s === "critical") return { bg: "#FFDAD6", c: "#5E1014", label: "Critical" };
  if (s === "moderate") return { bg: "#FFDDAE", c: "#5A3B00", label: "Moderate" };
  return { bg: "#F6F5F8", c: "#48464B", label: "Minor" };
}

function priorityTagLabel(p: PriorityLevel): string {
  if (p === 1) return "Highest-impact fix";
  if (p === 2) return "Competitive improvement";
  return "Polish";
}

function rankColors(p: PriorityLevel): { bg: string; c: string } {
  if (p === 1) return { bg: "#2A282E", c: "#FFFFFF" };
  if (p === 2) return { bg: "#F1F0F4", c: "#1C1B1E" };
  return { bg: "#EBEAEF", c: "#48464B" };
}

function formatHost(rawUrl: string): string {
  try {
    return new URL(rawUrl).host.replace(/^www\./, "");
  } catch {
    return rawUrl;
  }
}

const STYLES = `
  *,*::before,*::after { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "IBM Plex Sans", -apple-system, "Segoe UI", Roboto, Arial, system-ui, sans-serif;
    color: #1C1B1E;
    background: #FCFBFD;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  main { max-width: 800px; margin: 0 auto; padding: 56px 32px 80px; }
  h1, h2, h3 { letter-spacing: -0.01em; margin: 0; }
  h2 { font-size: 30px; font-weight: 700; line-height: 1.1; }
  h3 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #48464B; }
  p { margin: 0; }
  a { color: inherit; }

  /* ===== Atoms ===== */
  .eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2A282E; }
  .url-link { color: #1C1B1E; font-weight: 600; font-size: 16px; text-decoration: none; }

  /* Rating chip — text tier */
  .rating-chip {
    display: inline-flex; align-items: center; gap: 7px; flex: none;
    height: 30px; padding: 0 14px; border-radius: 999px;
    font-size: 13px; font-weight: 700; letter-spacing: 0.01em; white-space: nowrap;
  }
  .rating-chip.sm { height: 26px; padding: 0 11px; font-size: 12px; }
  .rating-chip__dot { width: 8px; height: 8px; border-radius: 999px; flex: none; }
  .rating-chip--strong { color: #0F5132; background: #BFEBC8; }
  .rating-chip--strong .rating-chip__dot { background: #2E7D44; }
  .rating-chip--good { color: #00214D; background: #D9E2FF; }
  .rating-chip--good .rating-chip__dot { background: #2D5BB8; }
  .rating-chip--developing { color: #5A3B00; background: #FFDDAE; }
  .rating-chip--developing .rating-chip__dot { background: #C77900; }
  .rating-chip--needswork { color: #5E1014; background: #FFDAD6; }
  .rating-chip--needswork .rating-chip__dot { background: #C0392B; }

  /* ===== Sections ===== */
  .block { margin-top: 52px; }
  .block:first-of-type { margin-top: 0; }

  /* Header */
  header.top { display: flex; align-items: center; gap: 14px; padding-bottom: 24px; border-bottom: 1px solid #E2E0E5; }
  .brandmark {
    width: 44px; height: 44px; border-radius: 999px;
    background: #2A282E; color: #FFFFFF;
    display: grid; place-items: center;
    font-weight: 700; font-size: 16px; letter-spacing: 0.02em;
    flex: none;
  }
  .top__title { font-weight: 700; font-size: 18px; line-height: 1.1; }
  .top__sub { font-size: 12.5px; color: #48464B; margin-top: 2px; }

  /* Current signal hero */
  .signal-label { font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #48464B; }
  .signal {
    font-size: 36px; font-weight: 700; color: #1C1B1E;
    line-height: 1.08; margin-top: 12px; letter-spacing: -0.02em;
    max-width: 18ch;
  }
  .summary { font-size: 18px; line-height: 1.6; color: #48464B; margin-top: 22px; max-width: 60ch; }

  /* What's working — tonal cards */
  .work-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 20px; }
  @media (max-width: 640px) { .work-grid { grid-template-columns: 1fr; } }
  .work-card {
    display: flex; gap: 14px; padding: 20px;
    background: #F6F5F8; border-radius: 28px;
    font-size: 14.5px; line-height: 1.5; color: #1C1B1E;
  }
  .work-card__ic {
    width: 38px; height: 38px; flex: none; border-radius: 999px;
    background: #BFEBC8; color: #0F5132;
    display: grid; place-items: center;
    font-weight: 700; font-size: 16px;
  }

  /* Growth lever */
  .lever {
    border-radius: 36px;
    background: #F6F5F8;
    color: #1C1B1E;
    padding: 34px 36px;
  }
  .lever__tag {
    display: inline-flex; align-items: center; gap: 9px;
    height: 34px; padding: 0 16px 0 13px; border-radius: 999px;
    background: #F9B9FA; color: #74357A; white-space: nowrap;
    font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  }
  .lever__statement {
    font-size: 36px; line-height: 1.08; letter-spacing: -0.025em;
    font-weight: 700; margin: 20px 0 0; max-width: 18ch;
  }
  .lever__body { font-size: 16px; line-height: 1.62; color: #48464B; margin: 22px 0 0; max-width: 64ch; }

  /* Action cards */
  .actions { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
  .action {
    background: #FFFFFF;
    border-radius: 28px;
    box-shadow: 0 1px 2px rgba(28,27,30,.10), 0 1px 3px 1px rgba(28,27,30,.06);
    overflow: hidden;
  }
  .action.p1 { box-shadow: 0 1px 2px rgba(28,27,30,.12), 0 2px 6px 2px rgba(28,27,30,.08); }
  .action__head { display: flex; align-items: flex-start; gap: 16px; padding: 22px 24px; }
  .rank {
    width: 44px; height: 44px; flex: none; border-radius: 999px;
    display: grid; place-items: center; font-weight: 700; font-size: 18px;
  }
  .action__main { flex: 1; min-width: 0; }
  .priority-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #48464B; }
  .priority-tag b { color: #2A282E; }
  .action__title { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; margin: 6px 0 0; line-height: 1.3; color: #1C1B1E; }
  .effort-chip {
    display: inline-flex; align-items: center; gap: 7px; flex: none;
    height: 32px; padding: 0 14px; border-radius: 999px;
    background: #F6F5F8; color: #48464B;
    font-size: 12.5px; font-weight: 600; white-space: nowrap;
  }
  .action__detail { padding: 0 24px 22px 84px; }
  .detail-row { padding: 16px 0; border-top: 1px solid #E2E0E5; }
  .detail-row:first-child { border-top: none; padding-top: 4px; }
  .detail-row__k { font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #48464B; margin-bottom: 7px; }
  .detail-row__v { font-size: 15px; line-height: 1.6; color: #48464B; }
  .detail-row.signal { background: #BFEBC8; border-radius: 20px; padding: 16px 18px; margin-top: 8px; border: none; }
  .detail-row.signal .detail-row__k { color: #0F5132; }
  .detail-row.signal .detail-row__v { color: #06351c; }

  /* Closing */
  .closing { border-radius: 36px; background: #F6F5F8; padding: 34px 36px; }
  .closing .eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    height: 34px; padding: 0 16px 0 13px; border-radius: 999px;
    background: #2A282E; color: #FFFFFF;
    font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  }
  .closing__body { font-size: 20px; line-height: 1.5; color: #1C1B1E; margin: 20px 0 0; max-width: 60ch; font-weight: 600; letter-spacing: -0.01em; }
  .closing__conf { margin-top: 22px; padding-top: 18px; border-top: 1px solid #E2E0E5; font-size: 13.5px; line-height: 1.55; color: #48464B; }

  /* Detailed divider */
  .detailed-intro { margin-top: 52px; padding-top: 36px; border-top: 1px solid #E2E0E5; }

  /* Score breakdown */
  .overall { background: #F1F0F4; color: #1C1B1E; border-radius: 36px; padding: 26px 28px; margin: 20px 0 16px; }
  .overall__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .overall__label { font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .overall__take { margin-top: 18px; padding-top: 18px; border-top: 1px solid color-mix(in srgb, currentColor 18%, transparent); }
  .overall__take-v { font-size: 16px; line-height: 1.55; margin: 8px 0 0; font-weight: 500; max-width: 62ch; }

  .scorelist { display: flex; flex-direction: column; gap: 6px; }
  .scorerow {
    display: grid; grid-template-columns: 1fr auto; gap: 14px 20px; align-items: center;
    padding: 18px 22px; background: #F6F5F8; border-radius: 20px;
  }
  .scorerow__name { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
  .scorerow__desc { font-size: 13.5px; line-height: 1.5; color: #48464B; margin-top: 4px; max-width: 56ch; }

  /* Review block (homepage + case studies) */
  .review { background: #FFFFFF; border-radius: 36px; box-shadow: 0 1px 2px rgba(28,27,30,.10), 0 1px 3px 1px rgba(28,27,30,.06); overflow: hidden; margin-top: 20px; }
  .shot { display: block; position: relative; width: 100%; padding: 0; margin: 0; background: #F1F0F4; overflow: hidden; }
  .shot img { width: 100%; height: auto; display: block; max-height: 600px; object-fit: cover; object-position: 50% 38%; }
  .shot__cap { position: absolute; left: 16px; bottom: 15px;
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 600; color: #1C1B1E;
    background: #F0EFF3; padding: 7px 13px; border-radius: 999px;
  }
  .img-fallback { padding: 32px; text-align: center; color: #48464B; font-size: 12px; background: #FCFBFD; border: 1px dashed #E2E0E5; border-radius: 20px; margin: 20px 0 0; }
  .review__top { padding: 24px 26px; display: flex; align-items: flex-start; gap: 18px; }
  .review__topic {
    width: 48px; height: 48px; flex: none; border-radius: 999px;
    background: #F1F0F4; color: #1C1B1E;
    display: grid; place-items: center;
  }
  .review__main { flex: 1; min-width: 0; }
  .review__label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2A282E; }
  .review__title { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin: 8px 0 0; line-height: 1.2; }
  .review__link { display: inline-flex; align-items: center; gap: 7px; margin-top: 10px; font-size: 12.5px; color: #48464B; text-decoration: none; }
  .review__verdict { padding: 4px 26px 22px; font-size: 16px; line-height: 1.6; color: #1C1B1E; }

  /* Criteria table */
  .crit-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #48464B; padding: 8px 26px 4px; }
  .crit { border-top: 1px solid #E2E0E5; padding: 16px 26px; display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center; }
  .crit__name { font-size: 15.5px; font-weight: 600; color: #1C1B1E; }
  .crit__detail { padding: 0 26px 16px 16px; }
  .crit__q { font-size: 13.5px; color: #48464B; font-style: italic; line-height: 1.5; padding: 12px 16px; background: #FCFBFD; border-radius: 14px; margin-bottom: 12px; }
  .crit__a { font-size: 15px; line-height: 1.6; color: #1C1B1E; }

  /* Strengths / weaknesses */
  .panel-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 8px 26px 24px; }
  @media (max-width: 640px) { .panel-2col { grid-template-columns: 1fr; } }
  .panel { background: #FCFBFD; padding: 20px 22px; border-radius: 28px; }
  .panel__head { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
  .panel__ic { width: 32px; height: 32px; border-radius: 999px; display: grid; place-items: center; flex: none; font-weight: 700; }
  .panel__head h4 { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin: 0; }
  .ph-pos .panel__ic { background: #BFEBC8; color: #0F5132; }
  .ph-pos h4 { color: #0F5132; }
  .ph-neg .panel__ic { background: #F1F0F4; color: #2A282E; }
  .ph-neg h4 { color: #2A282E; }
  .itemlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 13px; }
  .itemlist li { position: relative; padding-left: 22px; font-size: 14px; line-height: 1.5; color: #48464B; }
  .itemlist li::before { content: ""; position: absolute; left: 0; top: 7px; width: 8px; height: 8px; border-radius: 999px; }
  .itemlist.pos li::before { background: #2E7D44; }
  .itemlist.neg li::before { background: #2A282E; }

  /* Reviewer needs callout */
  .callout { margin: 0 26px; padding: 18px 20px; display: flex; gap: 14px; background: #FFDDAE; border-radius: 28px; }
  .callout__ic { width: 36px; height: 36px; flex: none; border-radius: 999px; background: rgba(255,255,255,.55); color: #5A3B00; display: grid; place-items: center; font-weight: 700; }
  .callout__k { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #5A3B00; }
  .callout__v { font-size: 14px; line-height: 1.5; color: #422a00; margin-top: 4px; }

  /* Concrete changes */
  .changes { padding: 22px 26px 26px; margin-top: 18px; }
  .changes__head { display: flex; align-items: center; gap: 11px; margin-bottom: 16px; }
  .changes__ic { width: 36px; height: 36px; border-radius: 999px; background: #2A282E; color: #FFFFFF; display: grid; place-items: center; flex: none; font-weight: 700; }
  .changes__head h4 { font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin: 0; color: #2A282E; }
  .changes ol { list-style: none; counter-reset: c; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
  .changes li { counter-increment: c; position: relative; padding-left: 40px; font-size: 14.5px; line-height: 1.6; color: #48464B; }
  .changes li::before { content: counter(c); position: absolute; left: 0; top: -2px;
    width: 28px; height: 28px; border-radius: 999px; background: #F1F0F4;
    color: #1C1B1E; font-weight: 700; font-size: 13px; display: grid; place-items: center;
  }

  /* Issues (homepage) */
  .issues { padding: 8px 26px 4px; display: flex; flex-direction: column; gap: 14px; }
  .issue { padding: 18px 20px; background: #FCFBFD; border-radius: 28px; }
  .issue__title { display: flex; align-items: center; gap: 11px; font-size: 15.5px; font-weight: 700; color: #1C1B1E; }
  .issue__x { width: 30px; height: 30px; border-radius: 999px; background: #FFDAD6; color: #5E1014; display: grid; place-items: center; flex: none; font-weight: 700; }
  .issue__body { font-size: 14px; line-height: 1.55; color: #48464B; margin: 10px 0 0; }
  .issue__egs { margin: 13px 0 0; display: flex; flex-direction: column; gap: 8px; }
  .eg { font-size: 12.5px; line-height: 1.5; color: #48464B; background: #F6F5F8; border-radius: 14px; padding: 10px 13px; }
  .eg::before { content: "e.g. "; color: #2A282E; font-weight: 600; }

  /* Review risks */
  .risks { display: flex; flex-direction: column; gap: 14px; margin-top: 20px; }
  .risk { display: flex; gap: 18px; padding: 22px; background: #FFFFFF; border-radius: 28px; box-shadow: 0 1px 2px rgba(28,27,30,.10), 0 1px 3px 1px rgba(28,27,30,.06); }
  .risk__sev { flex: none; width: 110px; }
  .sev-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; padding: 6px 12px; border-radius: 999px; }
  .sev-dot { width: 7px; height: 7px; border-radius: 999px; background: currentColor; }
  .risk__cat { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #48464B; margin-top: 11px; }
  .risk__title { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; margin: 6px 0 0; color: #1C1B1E; }
  .risk__body { font-size: 14px; line-height: 1.55; color: #48464B; margin: 9px 0 0; }

  /* Footer */
  footer.foot { margin-top: 56px; padding-top: 16px; border-top: 1px solid #E2E0E5; color: #48464B; font-size: 12.5px; line-height: 1.6; display: flex; align-items: flex-start; gap: 11px; }
  .foot__dot { width: 9px; height: 9px; border-radius: 999px; background: #2A282E; margin-top: 5px; flex: none; }

  @media print {
    main { padding: 24px; max-width: 100%; }
    .action, .review, .risk { page-break-inside: avoid; break-inside: avoid; }
    .shot img { max-height: 500px; }
  }
`;

function renderActionCard(item: ActionItem): string {
  const ranks = rankColors(item.priority);
  const tag = priorityTagLabel(item.priority);
  const isP1 = item.priority === 1;
  return `
    <div class="action${isP1 ? " p1" : ""}">
      <div class="action__head">
        <span class="rank" style="background:${ranks.bg};color:${ranks.c};">${item.priority}</span>
        <div class="action__main">
          <div class="priority-tag">Priority ${item.priority} · <b>${esc(tag)}</b></div>
          <div class="action__title">${esc(item.title)}</div>
        </div>
        ${item.estimatedEffort ? `<span class="effort-chip">${esc(item.estimatedEffort)}</span>` : ""}
      </div>
      <div class="action__detail">
        ${
          item.whyItMatters
            ? `<div class="detail-row">
                <div class="detail-row__k">Why it matters</div>
                <div class="detail-row__v">${esc(item.whyItMatters)}</div>
              </div>`
            : ""
        }
        ${
          item.howToDoIt
            ? `<div class="detail-row">
                <div class="detail-row__k">How to do it</div>
                <div class="detail-row__v">${esc(item.howToDoIt)}</div>
              </div>`
            : ""
        }
        ${
          item.expectedSignal
            ? `<div class="detail-row signal">
                <div class="detail-row__k">Expected signal</div>
                <div class="detail-row__v">${esc(item.expectedSignal)}</div>
              </div>`
            : ""
        }
      </div>
    </div>`;
}

function renderScoreTable(scores: OverviewScores): string {
  return `
    <div class="scorelist">
      ${OVERVIEW_KEYS.map(
        (k) => `
        <div class="scorerow">
          <div>
            <div class="scorerow__name">${esc(OVERVIEW_METRIC_LABEL[k])}</div>
            <div class="scorerow__desc">${esc(OVERVIEW_METRIC_EXPLANATION[k])}</div>
          </div>
          <div>${ratingChip(scores[k])}</div>
        </div>`,
      ).join("")}
    </div>`;
}

function renderHomepage(
  homepage: ReviewReport["homepage"],
  imgUri: string | null,
  portfolioHost: string,
): string {
  const issuesPresent = HOMEPAGE_ISSUE_KEYS.filter(
    (k) => homepage.issues[k]?.present,
  );
  const overall = Math.round(
    (homepage.reflectsProductDesigner.score + homepage.uxClarity.score) / 2,
  );
  return `
    <div class="review">
      ${
        imgUri
          ? `<div class="shot"><img src="${imgUri}" alt="Homepage screenshot" />
            <span class="shot__cap">${esc(portfolioHost)} · live capture</span></div>`
          : `<div class="img-fallback">Screenshot unavailable</div>`
      }
      <div class="review__top">
        <span class="review__topic">🏠</span>
        <div class="review__main">
          <div class="review__label">Homepage analysis</div>
          <h3 class="review__title">Homepage</h3>
        </div>
        ${ratingChip(overall)}
      </div>

      <div class="crit-label">Homepage criteria</div>
      <div class="crit">
        <div class="crit__name">${esc(HOMEPAGE_METRIC_LABEL.reflectsProductDesigner)}</div>
        ${ratingChip(homepage.reflectsProductDesigner.score, "sm")}
      </div>
      <div class="crit__detail">
        <div class="crit__q">${esc(HOMEPAGE_METRIC_EXPLANATION.reflectsProductDesigner)}</div>
        <div class="crit__a">${esc(homepage.reflectsProductDesigner.comment)}</div>
      </div>
      <div class="crit">
        <div class="crit__name">${esc(HOMEPAGE_METRIC_LABEL.uxClarity)}</div>
        ${ratingChip(homepage.uxClarity.score, "sm")}
      </div>
      <div class="crit__detail">
        <div class="crit__q">${esc(HOMEPAGE_METRIC_EXPLANATION.uxClarity)}</div>
        <div class="crit__a">${esc(homepage.uxClarity.comment)}</div>
      </div>

      ${
        issuesPresent.length > 0
          ? `<div class="issues">
            ${issuesPresent
              .map((k) => {
                const issue = homepage.issues[k];
                return `<div class="issue">
                  <div class="issue__title"><span class="issue__x">✕</span>${esc(HOMEPAGE_ISSUE_LABEL[k])}</div>
                  <p class="issue__body">${esc(issue.comment)}</p>
                  ${
                    issue.examples && issue.examples.length > 0
                      ? `<div class="issue__egs">${issue.examples
                          .map((e) => `<div class="eg">${esc(e)}</div>`)
                          .join("")}</div>`
                      : ""
                  }
                </div>`;
              })
              .join("")}
          </div>`
          : ""
      }

      ${
        homepage.recommendations && homepage.recommendations.length > 0
          ? `<div class="changes">
            <div class="changes__head">
              <span class="changes__ic">✎</span>
              <h4>What to change first</h4>
            </div>
            <ol>${homepage.recommendations.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
          </div>`
          : ""
      }
    </div>`;
}

async function renderCaseStudies(
  caseStudies: ReviewReport["caseStudies"],
): Promise<string> {
  const parts: string[] = [];
  for (const cs of caseStudies) {
    const imgUri = await imageToDataURI(cs.screenshotPath);
    parts.push(`
      <div class="review">
        ${
          imgUri
            ? `<div class="shot"><img src="${imgUri}" alt="${esc(cs.name)} screenshot" />
              <span class="shot__cap">${esc(formatHost(cs.url))} · live capture</span></div>`
            : `<div class="img-fallback">Screenshot unavailable</div>`
        }
        <div class="review__top">
          <span class="review__topic">▤</span>
          <div class="review__main">
            <div class="review__label">${esc(CASE_STUDY_TYPE_LABEL[cs.type])}</div>
            <h3 class="review__title">${esc(cs.name)}</h3>
            <a class="review__link" href="${esc(cs.url)}">${esc(formatHost(cs.url))}</a>
          </div>
          ${ratingChip(cs.overallScore)}
        </div>
        ${cs.summary ? `<div class="review__verdict">${esc(cs.summary)}</div>` : ""}

        <div class="crit-label">Scored criteria</div>
        ${CASE_STUDY_METRIC_KEYS.map(
          (k) => `
          <div class="crit">
            <div class="crit__name">${esc(CASE_STUDY_METRIC_LABEL[k])}</div>
            ${ratingChip(cs.scores[k].score, "sm")}
          </div>
          <div class="crit__detail">
            <div class="crit__q">${esc(CASE_STUDY_METRIC_EXPLANATION[k])}</div>
            <div class="crit__a">${esc(cs.scores[k].comment)}</div>
          </div>`,
        ).join("")}

        ${
          cs.strengths.length || cs.weaknesses.length
            ? `<div class="panel-2col">
              ${
                cs.strengths.length
                  ? `<div class="panel ph-pos">
                    <div class="panel__head"><span class="panel__ic">✓</span><h4>Strengths</h4></div>
                    <ul class="itemlist pos">${cs.strengths.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
                  </div>`
                  : ""
              }
              ${
                cs.weaknesses.length
                  ? `<div class="panel ph-neg">
                    <div class="panel__head"><span class="panel__ic">↑</span><h4>What can be strengthened</h4></div>
                    <ul class="itemlist neg">${cs.weaknesses.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
                  </div>`
                  : ""
              }
            </div>`
            : ""
        }

        ${
          cs.mainRisk
            ? `<div class="callout">
              <span class="callout__ic">👁</span>
              <div>
                <div class="callout__k">What a reviewer may still need to understand</div>
                <div class="callout__v">${esc(cs.mainRisk)}</div>
              </div>
            </div>`
            : ""
        }

        ${
          cs.recommendedImprovements && cs.recommendedImprovements.length > 0
            ? `<div class="changes">
              <div class="changes__head">
                <span class="changes__ic">✎</span>
                <h4>One concrete change to try</h4>
              </div>
              <ol>${cs.recommendedImprovements.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
            </div>`
            : ""
        }
      </div>`);
  }
  return parts.join("");
}

function renderReviewRisks(redFlags: ReviewReport["redFlags"]): string {
  if (redFlags.length === 0) return "";
  return `<div class="risks">${redFlags
    .map((f) => {
      const c = severityColor(f.severity);
      return `<div class="risk">
        <div class="risk__sev">
          <span class="sev-badge" style="background:${c.bg};color:${c.c};">
            <span class="sev-dot"></span>${c.label}
          </span>
          <div class="risk__cat">${esc(f.category)}</div>
        </div>
        <div>
          <div class="risk__title">${esc(f.title)}</div>
          <p class="risk__body">${esc(f.detail)}</p>
        </div>
      </div>`;
    })
    .join("")}</div>`;
}

export async function buildReviewHtml(
  report: ReviewReport,
  meta: { createdAt: Date },
): Promise<string> {
  const host = formatHost(report.portfolioUrl);
  const homepageImgUri = await imageToDataURI(
    report.homepage?.screenshotPath ?? "",
  );
  const caseStudiesHtml = await renderCaseStudies(report.caseStudies ?? []);
  const isUnable = report.verdict === "unable_to_evaluate";
  const dateLabel = meta.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const initials = (() => {
    try {
      const h = new URL(report.portfolioUrl).host.replace(/^www\./, "");
      return (h.split(".")[0] || "PR").slice(0, 2).toUpperCase();
    } catch {
      return "PR";
    }
  })();
  const actionPlan = report.priorityActionPlan ?? [];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Portfolio review — ${esc(host)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>${STYLES}</style>
</head>
<body>
  <main>
    <header class="top">
      <div class="brandmark">${esc(initials)}</div>
      <div>
        <div class="top__title">Roastfolio</div>
        <div class="top__sub">${esc(host)} · ${esc(dateLabel)}</div>
      </div>
    </header>

    ${
      report.currentSignal
        ? `<section class="block">
          <p class="signal-label">Current signal</p>
          <h1 class="signal">${esc(report.currentSignal)}</h1>
        </section>`
        : ""
    }

    <section class="block">
      <p class="summary">${esc(report.summary)}</p>
    </section>

    ${
      report.topStrengths?.length
        ? `<section class="block">
          <h3>What's already working</h3>
          <div class="work-grid">
            ${report.topStrengths.map((s) => `<div class="work-card"><span class="work-card__ic">✓</span><span>${esc(s)}</span></div>`).join("")}
          </div>
        </section>`
        : ""
    }

    ${
      report.mainGrowthLever
        ? `<section class="block">
          <div class="lever">
            <span class="lever__tag">⚡ Main growth lever</span>
            <p class="lever__statement">${esc(splitFirstSentence(report.mainGrowthLever).first)}</p>
            ${splitFirstSentence(report.mainGrowthLever).rest ? `<p class="lever__body">${esc(splitFirstSentence(report.mainGrowthLever).rest)}</p>` : ""}
          </div>
        </section>`
        : ""
    }

    ${
      actionPlan.length
        ? `<section class="block">
          <h3>Next best actions</h3>
          <div class="actions">${actionPlan.map(renderActionCard).join("")}</div>
        </section>`
        : ""
    }

    ${
      report.closingNote
        ? `<section class="block">
          <div class="closing">
            <span class="eyebrow">⚐ The path forward</span>
            <p class="closing__body">${esc(report.closingNote)}</p>
          </div>
        </section>`
        : ""
    }

    ${
      report.evaluatorNote
        ? `<section class="block">
          <div class="img-fallback" style="text-align:left; border-style: solid;">${esc(report.evaluatorNote)}</div>
        </section>`
        : ""
    }

    <section class="detailed-intro">
      <span class="eyebrow">Detailed breakdown</span>
      <h2 style="margin-top:8px;">Score categories, homepage, case studies, and review risks.</h2>
    </section>

    ${
      !isUnable
        ? `<section class="block">
          <h3>Score breakdown</h3>
          ${renderScoreTable(report.scores)}
        </section>`
        : ""
    }

    ${
      report.homepage
        ? `<section class="block">
          ${renderHomepage(report.homepage, homepageImgUri, host)}
        </section>`
        : ""
    }

    ${caseStudiesHtml ? `<section class="block">${caseStudiesHtml}</section>` : ""}

    ${
      report.redFlags?.length
        ? `<section class="block">
          <h3>Review risks</h3>
          <p style="color:#48464B; font-size:13px; margin: 4px 0 4px;">What a reviewer might notice or stop on.</p>
          ${renderReviewRisks(report.redFlags)}
        </section>`
        : ""
    }

    <footer class="foot">
      <span class="foot__dot"></span>
      <span>Generated by Roastfolio on ${esc(dateLabel)}. Reviewing ${esc(host)}. This is one design lead's read — treat it as informed input, not a final judgment.</span>
    </footer>
  </main>
</body>
</html>`;
}

function splitFirstSentence(text: string): { first: string; rest: string } {
  if (!text) return { first: "", rest: "" };
  const m = text.match(/^([^.!?]*[.!?])\s+(.*)$/s);
  if (!m) return { first: text, rest: "" };
  return { first: m[1].trim(), rest: m[2].trim() };
}
