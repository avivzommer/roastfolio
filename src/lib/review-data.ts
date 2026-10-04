import { cache } from "react";
import { prisma } from "./db";
import type { ReviewReport } from "./types";

export interface LoadedReview {
  id: string;
  portfolioUrl: string;
  createdAt: Date;
  status: string;
  report: ReviewReport | null;
}

/**
 * Fetch a review row + parsed report by id. Wrapped in React's `cache()`
 * so repeated calls within the same request (layout + page both calling
 * this) are deduped automatically.
 */
export const loadReview = cache(async function loadReview(
  id: string,
): Promise<LoadedReview | null> {
  const row = await prisma.review.findUnique({ where: { id } });
  if (!row) return null;
  const report: ReviewReport | null = row.report
    ? (JSON.parse(row.report) as ReviewReport)
    : null;
  return {
    id: row.id,
    portfolioUrl: row.portfolioUrl,
    createdAt: row.createdAt,
    status: row.status,
    report,
  };
});

/** Stable id for a case study row — the LLM provides it, we fall back to its index. */
export function caseStudyId(cs: { id?: string }, index: number): string {
  return cs.id || `cs-${index + 1}`;
}
