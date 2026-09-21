/**
 * LLM client wrapper.
 *
 * Calls Claude Sonnet 4.6 with the crawled portfolio content. Throws if
 * ANTHROPIC_API_KEY is missing — production never runs without it, and
 * dev runs through the same path now that we have the key.
 *
 * Pricing (Sonnet 4.6, approximate): $3 / 1M input tokens, $15 / 1M output
 * tokens. We track per-review cost so the monthly budget cap can enforce
 * itself.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ReviewReport, Seniority } from "../types";
import type { CrawledPortfolio } from "./crawler";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  type HeatLevel,
  type ReviewerInput,
} from "./prompt";

const MODEL_ID = "claude-sonnet-4-6";
const MAX_OUTPUT_TOKENS = 8_000;
/** Sonnet 4.6 pricing in cents-per-million-tokens. */
const INPUT_PRICE_PER_MILLION_CENTS = 300; // $3
const OUTPUT_PRICE_PER_MILLION_CENTS = 1_500; // $15

export interface GenerateReviewArgs {
  portfolioUrl: string;
  targetSeniority: Seniority;
  heatLevel: HeatLevel;
  crawl: CrawledPortfolio;
}

export interface GenerateReviewResult {
  report: ReviewReport;
  costCents: number;
  /** Kept on the result for log clarity. Always false in production. */
  isMock: boolean;
}

export async function generateReview(
  args: GenerateReviewArgs,
): Promise<GenerateReviewResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (dev) or the platform's env (prod) before reviewing portfolios.",
    );
  }
  return runReal(args);
}

// ---------------------------------------------------------------------------
// Real path
// ---------------------------------------------------------------------------

async function runReal(
  args: GenerateReviewArgs,
): Promise<GenerateReviewResult> {
  const client = new Anthropic();

  const reviewerInput: ReviewerInput = {
    portfolioUrl: args.portfolioUrl,
    targetSeniority: args.targetSeniority,
    heatLevel: args.heatLevel,
    homepageText: args.crawl.homepage.text,
    homepageTitle: args.crawl.homepage.title,
    caseStudyPages: args.crawl.caseStudies.map((p) => ({
      url: p.url,
      title: p.title,
      text: p.text,
    })),
    crawlErrors: args.crawl.errors,
  };

  // Build content blocks: text prompt + every screenshot as an image.
  const content: Anthropic.Messages.ContentBlockParam[] = [
    { type: "text", text: buildUserPrompt(reviewerInput) },
  ];
  const allPages = [args.crawl.homepage, ...args.crawl.caseStudies];
  for (const p of allPages) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: p.screenshotBase64,
      },
    });
  }

  // Explicit 4-minute timeout. Without this, a stalled connection can leave the
  // background agent process hanging for 10+ minutes (the SDK's default), and
  // the UI keeps showing "Building final report" with no progress.
  const response = await client.messages.create(
    {
      model: MODEL_ID,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    },
    { timeout: 240_000 },
  );

  const textBlock = response.content.find(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text",
  );
  if (!textBlock) {
    throw new Error("Model returned no text content");
  }

  const report = parseReportJson(textBlock.text, args.portfolioUrl);
  const costCents =
    (response.usage.input_tokens / 1_000_000) * INPUT_PRICE_PER_MILLION_CENTS +
    (response.usage.output_tokens / 1_000_000) *
      OUTPUT_PRICE_PER_MILLION_CENTS;

  return {
    report,
    costCents: Math.ceil(costCents),
    isMock: false,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pulls a JSON block out of a model response. The system prompt asks for raw
 * JSON, but we tolerate accidental code fences or trailing prose.
 */
function parseReportJson(text: string, portfolioUrl: string): ReviewReport {
  const cleaned = text.trim();
  let candidate = cleaned;

  // Strip code fences if the model wrapped the JSON.
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) candidate = fence[1];

  // Find the outermost {...} block as a final safety net.
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidate = candidate.slice(firstBrace, lastBrace + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (err) {
    throw new Error(
      `Model output was not valid JSON: ${String(err).slice(0, 120)}`,
    );
  }

  const report = parsed as ReviewReport;
  // Make sure the URL we render matches the URL the user submitted, even if
  // the model echoed it differently.
  report.portfolioUrl = portfolioUrl;
  return report;
}
