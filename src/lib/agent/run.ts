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
    const crawl = await crawlPortfolio(row.portfolioUrl, screenshotPaths(reviewId));
    console.log(
      `[agent] ${reviewId} phase=crawl done; caseStudies=${crawl.caseStudies.length}; errors=${crawl.errors.length}`,
    );

    const nothingExtracted =
      crawl.homepage.text.length < 40 && crawl.caseStudies.length === 0;
    if (nothingExtracted) {
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: "failed",
          failureReason:
            "Could not extract readable content from this portfolio.",
        },
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
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[agent] ${reviewId} FAILED in phase=${phase} after ${
        Date.now() - start
      }ms:`,
      message,
    );
    await prisma.review
      .update({
        where: { id: reviewId },
        data: {
          status: "failed",
          failureReason: `${phase}: ${message}`.slice(0, 500),
        },
      })
      .catch(() => {});
  }
}
