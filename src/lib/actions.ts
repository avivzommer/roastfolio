"use server";

import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "./db";
import { runAgent } from "./agent/run";
import type { Seniority, ReviewStatus } from "./types";
import {
  clearAdminCookie,
  isAdmin,
  passwordMatches,
  setAdminCookie,
} from "./auth";
import {
  formatRetryAfter,
  getClientIp,
  getMonthlyBudget,
  getRateLimit,
} from "./limits";

const SubmitSchema = z.object({
  portfolioUrl: z
    .string()
    .trim()
    .min(1, "Please paste a portfolio URL.")
    // Prepend https:// when no scheme was typed — users think "my website",
    // not "https://my website". Explicit http:// is preserved.
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .refine(
      (v) => {
        try {
          const u = new URL(v);
          return Boolean(u.hostname && u.hostname.includes("."));
        } catch {
          return false;
        }
      },
      { message: "That doesn't look like a valid URL." },
    ),
  targetSeniority: z
    .enum(["auto", "junior", "mid", "senior"])
    .default("auto"),
  heatLevel: z.enum(["chill", "honest", "spicy"]).default("honest"),
});

/**
 * Phase 5 implementation: kicks off the real agent pipeline.
 *
 * Validates input → creates a Review row with status='processing' and
 * report=null → fires runAgent(id) without awaiting → redirects to the
 * processing screen, which polls until the agent finishes.
 *
 * The agent does the actual crawl + LLM call in the background. When
 * ANTHROPIC_API_KEY is unset (the current state), the LLM step uses a
 * mock — but the crawl and every other layer is real.
 */
export async function submitReview(formData: FormData) {
  const raw = {
    portfolioUrl: String(formData.get("portfolioUrl") ?? ""),
    targetSeniority: String(formData.get("targetSeniority") ?? "auto"),
    heatLevel: String(formData.get("heatLevel") ?? "honest"),
  };

  const parsed = SubmitSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input.";
    redirect(`/?error=${encodeURIComponent(first)}`);
  }

  const { portfolioUrl, targetSeniority, heatLevel } = parsed.data;
  const inferredSeniority: Seniority =
    targetSeniority === "auto" ? "unspecified" : (targetSeniority as Seniority);

  // === Safety nets — check before spending API tokens. ===
  // Admin bypasses both budget and rate-limit (useful for QA and live demos).
  const adminBypass = await isAdmin();

  const ip = await getClientIp();

  if (!adminBypass) {
    const budget = await getMonthlyBudget();
    if (budget.exhausted) {
      redirect(`/?error=budget`);
    }

    const rate = await getRateLimit(ip);
    if (rate.blocked) {
      redirect(
        `/?error=rate-limit&retry=${encodeURIComponent(
          formatRetryAfter(rate.retryAfterSeconds),
        )}`,
      );
    }
  }

  const id = nanoid(10);

  await prisma.review.create({
    data: {
      id,
      portfolioUrl,
      targetSeniority: inferredSeniority,
      heatLevel,
      status: "processing",
      costCents: 0,
      report: null,
      ipAddress: ip,
    },
  });

  // Fire and forget. The processing page polls for completion.
  // We don't await — submitReview returns immediately so the redirect happens fast.
  void runAgent(id).catch((err) => {
    console.error(`[submitReview] runAgent crashed for ${id}:`, err);
  });

  redirect(`/r/${id}/processing`);
}

/**
 * Reads just enough of the review row to drive the processing screen's polling.
 * Doesn't return the full report — that's fetched on the review page itself.
 */
export async function getReviewStatus(id: string): Promise<{
  status: ReviewStatus;
  failureReason: string | null;
  portfolioUrl: string;
} | null> {
  const row = await prisma.review.findUnique({
    where: { id },
    select: { status: true, failureReason: true, portfolioUrl: true },
  });
  if (!row) return null;
  return {
    status: row.status as ReviewStatus,
    failureReason: row.failureReason,
    portfolioUrl: row.portfolioUrl,
  };
}

const WaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email.")
    .email("That doesn't look like a valid email."),
  portfolioUrl: z
    .string()
    .trim()
    .min(1, "Please paste a portfolio URL.")
    // Same normalization as SubmitSchema — bare domains get https:// prepended.
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .refine(
      (v) => {
        try {
          const u = new URL(v);
          return Boolean(u.hostname && u.hostname.includes("."));
        } catch {
          return false;
        }
      },
      { message: "That doesn't look like a valid URL." },
    ),
});

/**
 * Adds an email + portfolio URL to the waitlist. Used from the homepage when
 * the monthly API budget is exhausted. Resubmits with the same email update
 * the stored portfolioUrl in place (upsert), so a user changing their site
 * doesn't get a duplicate error.
 */
export async function submitWaitlist(formData: FormData) {
  const raw = {
    email: String(formData.get("email") ?? "").toLowerCase(),
    portfolioUrl: String(formData.get("portfolioUrl") ?? ""),
  };

  const parsed = WaitlistSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input.";
    redirect(`/?waitlistError=${encodeURIComponent(first)}`);
  }

  const { email, portfolioUrl } = parsed.data;
  const ip = await getClientIp();

  // Same per-IP rate limit as reviews — waitlist form is a public write
  // endpoint and needs equal spam protection.
  const rate = await getRateLimit(ip);
  if (rate.blocked) {
    redirect(
      `/?waitlistError=${encodeURIComponent(
        `Too many submissions. Try again ${formatRetryAfter(rate.retryAfterSeconds)}.`,
      )}`,
    );
  }

  await prisma.waitlist.upsert({
    where: { email },
    create: {
      id: nanoid(10),
      email,
      portfolioUrl,
      ipAddress: ip,
    },
    update: {
      portfolioUrl,
      ipAddress: ip,
    },
  });

  redirect("/?waitlisted=1");
}

/**
 * Records user feedback on a review. Tolerates duplicate calls — each call
 * inserts a new row, so the latest sentiment wins implicitly when summarized.
 * Also fires a best-effort email notification to the site owner.
 */
export async function submitFeedback(
  reviewId: string,
  helpful: boolean,
  comment?: string,
) {
  const trimmed = comment?.trim() || null;
  await prisma.feedback.create({
    data: {
      id: nanoid(10),
      reviewId,
      helpful,
      comment: trimmed,
    },
  });

  // Fire-and-forget notification. Wrapped in a self-invoked async so the
  // caller returns as soon as the DB write is done, regardless of Resend
  // latency or availability. Errors are swallowed inside email.ts.
  void (async () => {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { portfolioUrl: true },
      });
      if (!review) return;
      const { sendFeedbackNotification } = await import("./email");
      await sendFeedbackNotification({
        reviewId,
        helpful,
        comment: trimmed,
        portfolioUrl: review.portfolioUrl,
        siteBaseUrl: process.env.PUBLIC_BASE_URL ?? "https://roastfolio.up.railway.app",
      });
    } catch (err) {
      console.error("[submitFeedback] notification failed:", err);
    }
  })();
}

/**
 * Validates the admin password against ADMIN_PASSWORD env, sets the
 * signed session cookie, and redirects into the admin area.
 */
export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    redirect(`/admin/login?error=${encodeURIComponent("Incorrect password.")}`);
  }
  await setAdminCookie();
  redirect("/admin/history");
}

/** Clears the admin session and bounces back to the landing page. */
export async function logoutAdmin() {
  await clearAdminCookie();
  redirect("/");
}
