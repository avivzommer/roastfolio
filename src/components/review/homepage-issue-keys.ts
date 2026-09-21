import { HOMEPAGE_ISSUE_LABEL as L } from "@/lib/types";

export const HOMEPAGE_ISSUE_LABEL = L;
export const HOMEPAGE_ISSUE_KEYS_ORDER = [
  "smallScreenshots",
  "genericText",
  "weakCaseStudyTitles",
] as const;
export type HomepageIssueKey = (typeof HOMEPAGE_ISSUE_KEYS_ORDER)[number];
