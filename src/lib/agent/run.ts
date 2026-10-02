/**
 * Reviewer orchestrator.
 *
 * Single entry point for "given a reviewId, do the whole thing":
 *   crawl → LLM → parse → save.
 *
 * Called fire-and-forget from submitReview. Errors are caught and recorded
 * on the Review row (status="failed", failureReason set) — they never throw
 * out of this function.
 *
 * Also responsible for injecting screenshot paths into the LLM report,
 * since the LLM doesn't know about file paths.
 */

import path from "node:path";
import { prisma } from "../db";
import type { Seniority } from "../types";
import { crawlPortfolio } from "./crawler";
import { generateReview } from "./llm";
import type { HeatLevel } from "./prompt";
import { classifyError, logReviewError } from "../review-errors";

function screenshotPaths(reviewId: string): {
  screenshotDir: string;
  publicPathPrefix: string;
} {
  return {
    screenshotDir: path.join(
      process.cwd(),
      "public",
      "screenshots",
      reviewId,
    ),
    publicPathPrefix: `/screenshots/${reviewId}`,
  };
}

export async function runAgent(reviewId: string): Promise<void> {
  const start = Date.now();
  let phase = "load";

  console.log(`[agent] ${reviewId} starting`);

  try {
    const row = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!row) {
      console.warn(`[agent] no review row ${reviewId}; aborting`);
      return;
    }
    console.log(`[agent] ${reviewId} loaded row url=${row.portfolioUrl}`);

    phase = "crawl";
    console.log(`[agent] ${reviewId} phase=crawl starting`);
    const providedPassword = !!row.casePassword;
    const crawl = await crawlPortfolio(row.portfolioUrl, {
      ...screenshotPaths(reviewId),
      casePassword: row.casePassword ?? null,
    });
    console.log(
      `[agent] ${reviewId} phase=crawl done; caseStudies=${crawl.caseStudies.length}; errors=${crawl.errors.length}`,
    );

    // Clear the password from the DB the moment it has served its purpose.
    // Keeps secrets out of long-lived storage even if the LLM phase then
    // throws or the admin panel leaks row data.
    if (row.casePassword) {
      await prisma.review
        .update({ where: { id: reviewId }, data: { casePassword: null } })
        .catch((err) => {
          console.warn(
            `[agent] ${reviewId} failed to clear casePassword:`,
            err,
          );
        });
    }

    const nothingExtracted =
      crawl.homepage.text.length < 40 && crawl.caseStudies.length === 0;
    if (nothingExtracted) {
      const userMessage =
        "Could not extract readable content from this portfolio.";
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: "failed",
          failureReason: userMessage,
          failureKind: "user",
        },
      });
      // Still worth logging — a run of these in a week can hint at a crawler
      // regression rather than real portfolios being bad.
      void logReviewError({
        reviewId,
        phase: "crawl",
        kind: "user",
        message: userMessage,
        portfolioUrl: row.portfolioUrl,
      });
      console.warn(
        `[agent] ${reviewId} empty crawl after ${Date.now() - start}ms`,
      );
      return;
    }

    phase = "llm";
    console.log(`[agent] ${reviewId} phase=llm starting`);
    // Older rows may not have heatLevel — fall back to "honest".
    const heatLevel: HeatLevel =
      (row.heatLevel as HeatLevel | undefined) ?? "honest";
    const result = await generateReview({
      portfolioUrl: row.portfolioUrl,
      targetSeniority: row.targetSeniority as Seniority,
      heatLevel,
      crawl,
      providedPassword,
    });

    // Inject screenshot paths the LLM doesn't know about.
    if (result.report.homepage) {
      result.report.homepage.screenshotPath =
        crawl.homepage.screenshotPath ?? "";
    }
    for (const cs of result.report.caseStudies) {
      const matched = crawl.caseStudies.find((c) => c.url === cs.url);
      cs.screenshotPath = matched?.screenshotPath ?? "";
    }

    phase = "save";
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: "completed",
        report: JSON.stringify(result.report),
        costCents: result.costCents,
      },
    });

    console.log(
      `[agent] ${reviewId} ${result.isMock ? "MOCK" : "real"} in ${
        Date.now() - start
      }ms; cost=${result.costCents}¢; cs=${crawl.caseStudies.length}→${
        result.report.caseStudies.length
      }; errors=${crawl.errors.length}`,
    );
  } catch (err) {
    const { kind, message } = classifyError(err, phase);
    console.error(
      `[agent] ${reviewId} FAILED in phase=${phase} after ${
        Date.now() - start
      }ms (${kind}):`,
      message,
    );

    // Load the portfolio URL for the error log; may fail if the row itself
    // is unreachable, which we tolerate.
    const row = await prisma.review
      .findUnique({
        where: { id: reviewId },
        select: { portfolioUrl: true },
      })
      .catch(() => null);

    void logReviewError({
      reviewId,
      phase,
      kind,
      message: `${phase}: ${message}`,
      portfolioUrl: row?.portfolioUrl,
    });

    // Store a technical reason for admin visibility, plus the kind so the
    // user-facing processing page can swap in friendlier copy for "system"
    // failures that aren't the designer's fault.
    await prisma.review
      .update({
        where: { id: reviewId },
        data: {
          status: "failed",
          failureReason: `${phase}: ${message}`.slice(0, 500),
          failureKind: kind,
          // Also wipe the password on failure — no reason to keep a secret
          // sitting next to a dead review row.
          casePassword: null,
        },
      })
      .catch(() => {});
  }
}
