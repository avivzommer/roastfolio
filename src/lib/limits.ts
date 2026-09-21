/**
 * Safety nets: monthly budget cap + per-IP rate limit.
 *
 * Both are enforced inside the submitReview server action. Without them,
 * anyone with the URL could loop the form and either run up the bill or
 * starve real users. The checks are deliberately simple: a SUM query for
 * spend, a COUNT query for rate.
 *
 * Defaults can be overridden via env:
 *   MONTHLY_BUDGET_CENTS=2000  ($20)
 *   IP_RATE_LIMIT_PER_HOUR=4
 */

import { headers } from "next/headers";
import { prisma } from "./db";

const DEFAULT_MONTHLY_BUDGET_CENTS = 2000; // $20.00
const DEFAULT_IP_RATE_LIMIT_PER_HOUR = 4;

export function monthlyBudgetCents(): number {
  const env = Number(process.env.MONTHLY_BUDGET_CENTS);
  return Number.isFinite(env) && env > 0 ? env : DEFAULT_MONTHLY_BUDGET_CENTS;
}

export function ipRateLimitPerHour(): number {
  const env = Number(process.env.IP_RATE_LIMIT_PER_HOUR);
  return Number.isFinite(env) && env > 0
    ? env
    : DEFAULT_IP_RATE_LIMIT_PER_HOUR;
}

/** Reads the calling client's IP from request headers. Falls back to "unknown" in dev. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function startOfMonthUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export interface BudgetStatus {
  spentCents: number;
  limitCents: number;
  remainingCents: number;
  pctUsed: number;
  /** True when no new submissions should be accepted. */
  exhausted: boolean;
}

/** Sums spend for the current calendar month and compares against the cap. */
export async function getMonthlyBudget(): Promise<BudgetStatus> {
  const limitCents = monthlyBudgetCents();
  const since = startOfMonthUtc();
  const agg = await prisma.review.aggregate({
    where: { createdAt: { gte: since } },
    _sum: { costCents: true },
  });
  const spentCents = agg._sum.costCents ?? 0;
  const remainingCents = Math.max(0, limitCents - spentCents);
  const pctUsed = limitCents > 0 ? spentCents / limitCents : 1;
  return {
    spentCents,
    limitCents,
    remainingCents,
    pctUsed,
    exhausted: spentCents >= limitCents,
  };
}

export interface RateLimitStatus {
  ip: string;
  countInLastHour: number;
  limit: number;
  /** True when the IP is at or above the per-hour cap. */
  blocked: boolean;
  /** Seconds until the IP can submit again (best estimate from the oldest submission in the window). */
  retryAfterSeconds: number;
}

function rateLimitAllowlist(): Set<string> {
  const raw = process.env.RATE_LIMIT_ALLOWLIST_IPS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** Counts Review rows by IP in the last hour and reports whether the IP is blocked. */
export async function getRateLimit(ip: string): Promise<RateLimitStatus> {
  const limit = ipRateLimitPerHour();
  if (!ip || ip === "unknown") {
    // We can't bucket reliably, but don't fully block — admin sees this in history.
    return {
      ip,
      countInLastHour: 0,
      limit,
      blocked: false,
      retryAfterSeconds: 0,
    };
  }
  // Allowlisted IPs (e.g. the owner's home IP for testing) bypass the check.
  if (rateLimitAllowlist().has(ip)) {
    return {
      ip,
      countInLastHour: 0,
      limit,
      blocked: false,
      retryAfterSeconds: 0,
    };
  }
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const rows = await prisma.review.findMany({
    where: { ipAddress: ip, createdAt: { gte: oneHourAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const countInLastHour = rows.length;
  const blocked = countInLastHour >= limit;
  let retryAfterSeconds = 0;
  if (blocked && rows[0]) {
    const earliestExpiresAt = rows[0].createdAt.getTime() + 60 * 60 * 1000;
    retryAfterSeconds = Math.max(
      0,
      Math.ceil((earliestExpiresAt - Date.now()) / 1000),
    );
  }
  return { ip, countInLastHour, limit, blocked, retryAfterSeconds };
}

/** Friendly seconds → "in 23 minutes" / "in less than a minute" formatting. */
export function formatRetryAfter(seconds: number): string {
  if (seconds <= 60) return "in less than a minute";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  return `in ${hours} hour${hours === 1 ? "" : "s"}`;
}
