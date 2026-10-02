/**
 * View-layer adapter: maps our LLM-produced ReviewReport shape into the
 * structures the new M3 Expressive design expects (criteria with question/answer,
 * rating tiers, growth-lever statement vs. body, etc).
 *
 * The LLM still produces the existing ReviewReport. This module is the only
 * place that knows how to format that for the new design.
 */

import type {
  ReviewReport,
  HomepageEvaluation,
  CaseStudyEvaluation,
  OverviewScores,
  CaseStudyScores,
} from "./types";
import {
  HOMEPAGE_METRIC_LABEL,
  HOMEPAGE_METRIC_EXPLANATION,
  CASE_STUDY_METRIC_LABEL,
  CASE_STUDY_METRIC_EXPLANATION,
  OVERVIEW_METRIC_LABEL,
  OVERVIEW_METRIC_EXPLANATION,
} from "./types";

export type RatingTone = "strong" | "good" | "developing" | "needswork";

export interface RatingTier {
  label: string;
  tone: RatingTone;
}

/** Map a 1-5 score to a text tier — the heart of the new scoring display. */
export function ratingOf(score: number): RatingTier {
  if (score >= 4) return { label: "Strong", tone: "strong" };
  if (score >= 3) return { label: "Good", tone: "good" };
  if (score >= 2) return { label: "Developing", tone: "developing" };
  return { label: "Needs work", tone: "needswork" };
}

export interface HeatReading {
  /** 1-5 — how many flames are lit. */
  filled: number;
  /** Short descriptor: "Cold", "Warm", "Toasty", "Hot", "Blazing". */
  label: string;
}

/**
 * Portfolio-heat reading derived from the overall score. This is orthogonal
 * to the delivery-tone `heatLevel` a user picks — this one describes the
 * portfolio's current temperature, not how it should be reviewed.
 */
export function heatOf(score: number): HeatReading {
  const filled = Math.max(1, Math.min(5, Math.round(score)));
  const label =
    filled >= 5
      ? "Blazing"
      : filled >= 4
        ? "Hot"
        : filled >= 3
          ? "Toasty"
          : filled >= 2
            ? "Warm"
            : "Cold";
  return { filled, label };
}

export interface Criterion {
  name: string;
  question: string;
  answer: string;
  score: number;
}

/**
 * Builds question+answer criteria for the homepage panel.
 * Two criteria from the structured metrics, plus one for each detected issue.
 */
export function homepageCriteria(homepage: HomepageEvaluation): Criterion[] {
  return [
    {
      name: HOMEPAGE_METRIC_LABEL.reflectsProductDesigner,
      question: HOMEPAGE_METRIC_EXPLANATION.reflectsProductDesigner,
      answer: homepage.reflectsProductDesigner.comment,
      score: homepage.reflectsProductDesigner.score,
    },
    {
      name: HOMEPAGE_METRIC_LABEL.uxClarity,
      question: HOMEPAGE_METRIC_EXPLANATION.uxClarity,
      answer: homepage.uxClarity.comment,
      score: homepage.uxClarity.score,
    },
  ];
}

const CASE_STUDY_QUESTIONS: Record<keyof CaseStudyScores, string> = {
  problemFraming: CASE_STUDY_METRIC_EXPLANATION.problemFraming,
  uxThinking: CASE_STUDY_METRIC_EXPLANATION.uxThinking,
  productThinking: CASE_STUDY_METRIC_EXPLANATION.productThinking,
  uiCraft: CASE_STUDY_METRIC_EXPLANATION.uiCraft,
  impact: CASE_STUDY_METRIC_EXPLANATION.impact,
};

const CASE_STUDY_NAMES: Record<keyof CaseStudyScores, string> = {
  problemFraming: CASE_STUDY_METRIC_LABEL.problemFraming,
  uxThinking: CASE_STUDY_METRIC_LABEL.uxThinking,
  productThinking: CASE_STUDY_METRIC_LABEL.productThinking,
  uiCraft: CASE_STUDY_METRIC_LABEL.uiCraft,
  impact: CASE_STUDY_METRIC_LABEL.impact,
};

const CASE_STUDY_ORDER: Array<keyof CaseStudyScores> = [
  "problemFraming",
  "uxThinking",
  "productThinking",
  "uiCraft",
  "impact",
];

export function caseStudyCriteria(study: CaseStudyEvaluation): Criterion[] {
  return CASE_STUDY_ORDER.map((key) => ({
    name: CASE_STUDY_NAMES[key],
    question: CASE_STUDY_QUESTIONS[key],
    answer: study.scores[key].comment,
    score: study.scores[key].score,
  }));
}

const OVERVIEW_ORDER: Array<keyof OverviewScores> = [
  "communication",
  "productThinking",
  "uxThinking",
  "uiCraft",
  "impact",
  "seniorityFit",
];

export interface OverviewRow {
  key: keyof OverviewScores;
  name: string;
  desc: string;
  score: number;
}

export function overviewRows(scores: OverviewScores): OverviewRow[] {
  return OVERVIEW_ORDER.map((key) => ({
    key,
    name: OVERVIEW_METRIC_LABEL[key],
    desc: OVERVIEW_METRIC_EXPLANATION[key],
    score: scores[key],
  }));
}

/**
 * Splits the growth lever into a statement (short, rendered big) and a body
 * (longer, rendered small). The LLM may return either:
 *   a) a short diagnosis followed by a supporting sentence (two sentences),
 *   b) a single long sentence that uses a colon as the pivot
 *      ("The UI craft that matters is hidden: screens are too small..."),
 *   c) a single long sentence with no pivot at all.
 *
 * Strategy: split on the first sentence terminator; if that leaves the
 * statement over ~15 words, re-split at the first colon or em-dash instead.
 * As a last resort, keep the whole thing in `statement` and let the
 * component scale the font down.
 */
export function splitGrowthLever(text: string): {
  statement: string;
  body: string;
} {
  if (!text) return { statement: "", body: "" };

  // First try: split on a terminator (., !, ?) followed by whitespace.
  const terminatorSplit = text.match(/^([^.!?]*[.!?])\s+(.*)$/s);
  if (terminatorSplit) {
    const [, head, tail] = terminatorSplit;
    const headWords = head.trim().split(/\s+/).filter(Boolean).length;
    if (headWords <= 15) {
      return { statement: head.trim(), body: tail.trim() };
    }
    // Head is still too long to render as a display line — fall through
    // and let the pivot splitter below have a go.
  }

  // Second try: colon or em-dash pivot in a single long sentence.
  const pivotSplit = text.match(/^([^:—]{10,80})[:—]\s+(.+)$/s);
  if (pivotSplit) {
    return { statement: pivotSplit[1].trim(), body: pivotSplit[2].trim() };
  }

  // Fallback: single sentence, no pivot. Let the component render it at
  // a smaller font (see word-count tier logic in GrowthLeverCallout).
  return { statement: text.trim(), body: "" };
}

/** Average of overview scores → the headline rating tier shown on Score Breakdown. */
export function overallScoreFromScores(scores: OverviewScores): number {
  const vals = OVERVIEW_ORDER.map((k) => scores[k]);
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round(sum / vals.length);
}

/** Brand initials from the portfolio URL host for the topbar mark. */
export function brandInitials(url: string): string {
  try {
    const host = new URL(url).host.replace(/^www\./, "");
    const root = host.split(".")[0] || "PR";
    return root.slice(0, 2).toUpperCase();
  } catch {
    return "PR";
  }
}

/** Human-readable host for the topbar subtitle / case-study link rows. */
export function readableHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Format date like "June 7, 2026" — matches the design footer/header. */
export function readableDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Severity label rendering — keeps "Critical / Moderate / Minor" tier badges. */
export function severityLabel(s: "critical" | "moderate" | "minor"): string {
  if (s === "critical") return "Critical";
  if (s === "moderate") return "Moderate";
  return "Minor";
}

/** Priority tag copy used inside ActionStack. */
export function priorityTag(p: 1 | 2 | 3): string {
  if (p === 1) return "Highest-impact fix";
  if (p === 2) return "Competitive improvement";
  return "Polish";
}
