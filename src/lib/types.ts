/**
 * Review data shape (v2).
 *
 * Restructured for simpler reading and visual presentation:
 *  - Five-star scoring throughout (1–5), so designers can scan at a glance.
 *  - Every metric has a paired short comment (1–2 sentences in plain English).
 *  - A new Homepage section evaluates the homepage itself, not just the work.
 *  - Case studies capped at 3 most representative ones.
 *  - Screenshot paths injected by the orchestrator after the crawl.
 *
 * Language target: clear English, written for designers whose first language is Hebrew.
 * Short sentences, no jargon.
 */

export type Seniority = "junior" | "mid" | "senior" | "unspecified";

export type Verdict =
  | "strong_pass"
  | "pass"
  | "borderline"
  | "weak_pass"
  | "fail"
  | "unable_to_evaluate";

export type ReviewStatus = "pending" | "processing" | "completed" | "failed";

export type RedFlagSeverity = "critical" | "moderate" | "minor";

export type PriorityLevel = 1 | 2 | 3;

export type CaseStudyType =
  | "full_case_study"
  | "condensed_case_study"
  | "showcase"
  | "concept_gallery"
  | "protected_or_incomplete";

export type ProjectDomain =
  | "b2b_saas"
  | "b2c_product"
  | "mobile_app"
  | "dashboard"
  | "admin_tool"
  | "internal_tool"
  | "marketplace"
  | "ecommerce"
  | "ai_product"
  | "fintech"
  | "healthcare"
  | "edtech"
  | "brand_marketing"
  | "visual_design_only"
  | "student_project"
  | "concept_project"
  | "shipped_product"
  | "other";

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

/** A score (1–5) paired with a short explanation of why. */
export interface ScoredItem {
  /** 1–5. */
  score: number;
  /** 1–2 sentences in simple English. */
  comment: string;
}

/** A check for a known common mistake. Present means the issue was found. */
export interface IssueCheck {
  present: boolean;
  /** Short comment. If present is false, can briefly say "looks good". */
  comment: string;
  /** Optional concrete examples pulled from the page. */
  examples?: string[];
}

/** Per-case-study scored dimensions (each is a 1–5 ScoredItem). */
export interface CaseStudyScores {
  problemFraming: ScoredItem;
  uxThinking: ScoredItem;
  productThinking: ScoredItem;
  uiCraft: ScoredItem;
  impact: ScoredItem;
}

/** Portfolio-level scores across 6 categories (1–5 each). */
export interface OverviewScores {
  communication: number;
  productThinking: number;
  uxThinking: number;
  uiCraft: number;
  impact: number;
  seniorityFit: number;
}

// ---------------------------------------------------------------------------
// Homepage evaluation
// ---------------------------------------------------------------------------

export interface HomepageEvaluation {
  /** Injected by orchestrator. Public path like /screenshots/<reviewId>/homepage.png */
  screenshotPath: string;
  /** 1–5 overall score for the homepage. */
  overallScore: number;
  /** Headline question: does the homepage clearly read as a product designer's? */
  reflectsProductDesigner: ScoredItem;
  /** Is the homepage itself well-designed and easy to use? */
  uxClarity: ScoredItem;
  /** Common designer-homepage mistakes. */
  issues: {
    smallScreenshots: IssueCheck;
    genericText: IssueCheck;
    weakCaseStudyTitles: IssueCheck;
  };
  /** Short concrete next steps for the homepage specifically. */
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Case study evaluation (max 3 per review)
// ---------------------------------------------------------------------------

/**
 * ACTION check — UI inspection from the case study's screenshots.
 * Six named dimensions, each pass/fail with one line of evidence.
 * `notInferable` allowed only on interaction/navigation when the screenshots
 * don't show enough to decide honestly.
 */
export interface ActionCheck {
  appeal: { verdict: "pass" | "fail"; evidence: string };
  clarity: { verdict: "pass" | "fail"; evidence: string };
  typography: { verdict: "pass" | "fail"; evidence: string };
  interaction: {
    verdict: "pass" | "fail" | "notInferable";
    evidence: string;
  };
  order: { verdict: "pass" | "fail"; evidence: string };
  navigation: {
    verdict: "pass" | "fail" | "notInferable";
    evidence: string;
  };
}

/**
 * PROVE check — UX inspection from case study text + any flow/journey/research
 * artifacts. Five named dimensions, each pass/fail with one line of evidence.
 */
export interface ProveCheck {
  problem: { verdict: "pass" | "fail"; evidence: string };
  research: { verdict: "pass" | "fail"; evidence: string };
  options: { verdict: "pass" | "fail"; evidence: string };
  verification: { verdict: "pass" | "fail"; evidence: string };
  edgeCases: { verdict: "pass" | "fail"; evidence: string };
}

export interface CaseStudyEvaluation {
  /** Stable id, e.g. "cs-1". */
  id: string;
  /** The URL on the designer's portfolio. Used by orchestrator to match screenshots. */
  url: string;
  /** Short title — what the designer called this case study. */
  name: string;
  type: CaseStudyType;
  domains: ProjectDomain[];
  /** Injected by orchestrator. */
  screenshotPath: string;
  /** 1–5 overall score for this case study. */
  overallScore: number;
  /** Per-dimension scores (1–5) with comments. */
  scores: CaseStudyScores;
  /** UI inspection (ACTION) — new. Optional so legacy reports still parse. */
  actionCheck?: ActionCheck;
  /** UX inspection (PROVE) — new. Optional so legacy reports still parse. */
  proveCheck?: ProveCheck;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  /** One-sentence main hiring risk for this case study. */
  mainRisk: string;
  recommendedImprovements: string[];
}

// ---------------------------------------------------------------------------
// Red flag + Action item (unchanged shape, kept for parity)
// ---------------------------------------------------------------------------

export interface RedFlag {
  severity: RedFlagSeverity;
  category: string;
  title: string;
  detail: string;
}

export interface ActionItem {
  priority: PriorityLevel;
  /** What to change — a clear action title. */
  title: string;
  /** Why it matters in terms of hiring signal. */
  whyItMatters: string;
  /** How to do it — concrete steps the designer can follow. */
  howToDoIt: string;
  /** Estimated effort, e.g. "30–45 minutes", "2 hours". */
  estimatedEffort: string;
  /** What signal the reviewer will read more clearly afterward. */
  expectedSignal: string;
}

// ---------------------------------------------------------------------------
// Top-level review report
// ---------------------------------------------------------------------------

export interface ReviewReport {
  portfolioUrl: string;
  targetSeniority: Seniority;
  inferredSeniority: Seniority;
  domainFit: string;

  // --- Internal evaluation (kept; surfaced primarily in the admin layer)
  verdict: Verdict;
  /** 1–5 overall. */
  overallScore: number;
  /** Agent's confidence in the assessment given the available evidence. */
  confidenceLevel: "low" | "medium" | "high";

  // --- User-facing opening
  /** Short qualitative phrase. e.g. "Strong visual foundation, promising junior-level portfolio". */
  currentSignal: string;
  /** 2–4 sentences. Starts with evidence of strength, names the main gap, ends with the improvement path. */
  summary: string;
  /** 3–4 concrete strengths. Each references visible evidence. */
  topStrengths: string[];
  /** Single central improvement theme — the one growth lever this designer should pull. 1–2 sentences. */
  mainGrowthLever: string;
  /** Used internally in the detailed view, framed as "what a reviewer may still need to understand". */
  mainRisks: string[];

  // --- Detailed score breakdown (second layer)
  scores: OverviewScores;
  homepage: HomepageEvaluation;
  /** Up to 3, most representative for the current signal. */
  caseStudies: CaseStudyEvaluation[];
  /** Internal name kept. UI labels these as "Review risks". */
  redFlags: RedFlag[];
  /** Exactly 3 next-best actions. */
  priorityActionPlan: ActionItem[];

  // --- Closing
  /** Encouraging directional note. e.g. "The strongest path isn't more projects — it's making the thinking visible." */
  closingNote: string;
  /** Honest caveat note. Used most for unable_to_evaluate. */
  evaluatorNote?: string;
}

/** DB row wrapper. */
export interface ReviewRecord {
  id: string;
  createdAt: Date;
  portfolioUrl: string;
  targetSeniority: Seniority;
  status: ReviewStatus;
  costCents: number;
  report: ReviewReport | null;
}

// ---------------------------------------------------------------------------
// Display labels + tooltip explanations
// (Kept in code, not LLM-generated, so they stay consistent across reviews.)
// ---------------------------------------------------------------------------

export const VERDICT_LABEL: Record<Verdict, string> = {
  strong_pass: "Strong Pass",
  pass: "Pass",
  borderline: "Borderline",
  weak_pass: "Weak Pass",
  fail: "Fail",
  unable_to_evaluate: "Unable to Evaluate",
};

export const SENIORITY_LABEL: Record<Seniority, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  unspecified: "Unspecified",
};

export const CASE_STUDY_TYPE_LABEL: Record<CaseStudyType, string> = {
  full_case_study: "Full case study",
  condensed_case_study: "Condensed case study",
  showcase: "Showcase",
  concept_gallery: "Concept",
  protected_or_incomplete: "Protected / incomplete",
};

export const OVERVIEW_METRIC_LABEL: Record<keyof OverviewScores, string> = {
  communication: "Communication",
  productThinking: "Product thinking",
  uxThinking: "UX thinking",
  uiCraft: "UI craft",
  impact: "Impact",
  seniorityFit: "Seniority fit",
};

export const OVERVIEW_METRIC_EXPLANATION: Record<keyof OverviewScores, string> =
  {
    communication:
      "How clearly the portfolio explains who you are and what you do. Sharp positioning, easy to scan, work easy to find.",
    productThinking:
      "Does the work show understanding of products as systems? Business goals, trade-offs, prioritization, real constraints.",
    uxThinking:
      "Depth of UX reasoning. Flows, edge cases, accessibility, decisions backed by user understanding — not just final screens.",
    uiCraft:
      "Visual execution. Typography, spacing, hierarchy, component consistency, production-quality screens.",
    impact:
      "Evidence of outcomes. Metrics, launches, customer effect, learning, post-launch signals.",
    seniorityFit:
      "Does the work match the seniority level claimed? Ownership, ambiguity, scale, strategic thinking.",
  };

export const HOMEPAGE_METRIC_LABEL = {
  reflectsProductDesigner: "Reads as a product designer",
  uxClarity: "Clear and easy to use",
} as const;

export const HOMEPAGE_METRIC_EXPLANATION = {
  reflectsProductDesigner:
    "Would a busy hiring manager land here and instantly know they are visiting a product designer's portfolio?",
  uxClarity:
    "Is the homepage itself well designed? Easy to navigate, clear hierarchy, no friction finding the work.",
} as const;

export const HOMEPAGE_ISSUE_LABEL = {
  smallScreenshots: "Screenshots aren't readable",
  genericText: "Generic, vague text",
  weakCaseStudyTitles: "Weak case study titles",
} as const;

export const HOMEPAGE_ISSUE_EXPLANATION = {
  smallScreenshots:
    "Your work needs to be visible. This covers two patterns: tiny thumbnails on the homepage, and full-page screenshots scaled down so the UI text is unreadable.",
  genericText:
    "Lines like 'passionate designer creating beautiful experiences' could be anyone. Specific, personal positioning helps reviewers remember you.",
  weakCaseStudyTitles:
    "Titles like '2024' or 'Acme Inc.' describe the project. Strong titles describe the value you delivered as a designer.",
} as const;

export const CASE_STUDY_METRIC_LABEL = {
  problemFraming: "Problem framing",
  uxThinking: "UX thinking",
  productThinking: "Product thinking",
  uiCraft: "UI craft",
  impact: "Impact",
} as const;

export const CASE_STUDY_METRIC_EXPLANATION = {
  problemFraming:
    "Does the case study explain what problem existed, who had it, and why it mattered — before showing the solution?",
  uxThinking:
    "Are flows, edge cases, accessibility, and interaction logic shown? Or only final screens?",
  productThinking:
    "Is there business context? Trade-offs explained? Prioritization shown? Constraints made clear?",
  uiCraft:
    "Hierarchy, spacing, typography, component consistency in the shown screens.",
  impact:
    "What happened after launch? Metrics, qualitative outcomes, learning, post-launch signals.",
} as const;
