/**
 * Error logging for the review pipeline.
 *
 * runAgent historically swallowed errors into the Review row's failureReason,
 * which disappeared into Railway's log rotation after a few days. This module
 * persists them to a dedicated table so an admin can batch-review them weekly
 * instead of hunting through live logs.
 *
 * Also classifies errors as "system" (our fault — crawler/LLM/infra) or
 * "user" (the portfolio has nothing readable), which drives the message the
 * designer sees on the failed-review page: a soft "something broke on our
 * end, please retry" for system errors, versus the actionable "we couldn't
 * read your site" for user errors.
 */

import { nanoid } from "nanoid";
import { prisma } from "./db";

export type ErrorKind = "system" | "user";

/**
 * Decide whether a thrown error points at our infrastructure or at the
 * designer's portfolio. Keep this heuristic conservative — if we're not
 * sure, default to "system" so it shows up in the admin review queue.
 */
export function classifyError(
  err: unknown,
  phase: string,
): { kind: ErrorKind; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const message = raw.slice(0, 500);

  // Explicit "we got through the crawler but the site had nothing to read"
  // signal from run.ts — that's a legitimate portfolio-level answer.
  if (
    phase === "crawl" &&
    /could not extract readable content/i.test(message)
  ) {
    return { kind: "user", message };
  }

  // Everything else is on us: Firecrawl API errors, Anthropic 4xx/5xx,
  // network timeouts, Prisma failures, sharp crashes, type errors in
  // runtime code, etc. Logged to the admin queue for weekly review.
  return { kind: "system", message };
}

/** Writes one row to the ReviewError table. Never throws upstream. */
export async function logReviewError(input: {
  reviewId?: string;
  phase: string;
  kind: ErrorKind;
  message: string;
  portfolioUrl?: string;
}): Promise<void> {
  try {
    await prisma.reviewError.create({
      data: {
        id: nanoid(10),
        reviewId: input.reviewId ?? null,
        phase: input.phase,
        kind: input.kind,
        message: input.message.slice(0, 500),
        portfolioUrl: input.portfolioUrl ?? null,
      },
    });
  } catch (err) {
    // Logging the log failure is the last-resort fallback — we don't want
    // a dead DB connection to crash runAgent on top of its original error.
    console.error("[review-errors] failed to persist error row:", err);
  }
}

/** User-facing message shown on the failed-review page, per kind. */
export const USER_FACING_FAILURE = {
  system:
    "Something went wrong on our end. Please try again in a few minutes — this isn't about your portfolio.",
  user: null as string | null, // null → use the original message from the agent
} as const;
