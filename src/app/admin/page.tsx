import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getMonthlyBudget } from "@/lib/limits";
import { AdminHeader } from "@/components/admin/header";
import {
  ArrowRight,
  ListChecks,
  Mail,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

function startOfMonthUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function startOfWeekUtc(d = new Date()): Date {
  const copy = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  copy.setUTCDate(copy.getUTCDate() - copy.getUTCDay());
  return copy;
}

export default async function AdminOverviewPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const monthStart = startOfMonthUtc();
  const weekStart = startOfWeekUtc();

  const [
    budget,
    reviewsTotal,
    reviewsThisMonth,
    reviewsThisWeek,
    reviewsFailedThisWeek,
    waitlistTotal,
    waitlistThisMonth,
    feedbackTotal,
    feedbackPositive,
    errorsUnresolvedSystem,
    errorsThisWeek,
    latestError,
    recentActivity,
  ] = await Promise.all([
    getMonthlyBudget(),
    prisma.review.count(),
    prisma.review.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.review.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.review.count({
      where: { createdAt: { gte: weekStart }, status: "failed" },
    }),
    prisma.waitlist.count(),
    prisma.waitlist.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.feedback.count(),
    prisma.feedback.count({ where: { helpful: true } }),
    prisma.reviewError.count({
      where: { resolved: false, kind: "system" },
    }),
    prisma.reviewError.count({
      where: { kind: "system", createdAt: { gte: weekStart } },
    }),
    prisma.reviewError.findFirst({
      where: { resolved: false, kind: "system" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, phase: true, portfolioUrl: true },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        createdAt: true,
        portfolioUrl: true,
        status: true,
        failureKind: true,
      },
    }),
  ]);

  const feedbackPositivePct =
    feedbackTotal > 0 ? Math.round((feedbackPositive / feedbackTotal) * 100) : 0;

  // Little helper to tint the budget card red / amber / green.
  const budgetTone =
    budget.pctUsed >= 1
      ? { bg: "var(--rt-needswork-bg)", c: "var(--rt-needswork)" }
      : budget.pctUsed >= 0.75
        ? { bg: "var(--rt-developing-bg)", c: "var(--rt-developing)" }
        : { bg: "var(--rt-strong-bg)", c: "var(--rt-strong)" };

  // Red flag chip when there's anything in the triage queue.
  const errorsTone =
    errorsUnresolvedSystem > 0
      ? { bg: "var(--rt-needswork-bg)", c: "var(--rt-needswork)" }
      : { bg: "var(--rt-strong-bg)", c: "var(--rt-strong)" };

  return (
    <>
      <AdminHeader
        section="overview"
        title="Admin · Overview"
        subtitle="Roastfolio health at a glance"
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        {/* Top-line health strip */}
        <section
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ color: "var(--on-surface)" }}
        >
          <StatCard
            label="Spent this month"
            primary={`$${(budget.spentCents / 100).toFixed(2)}`}
            secondary={`of $${(budget.limitCents / 100).toFixed(2)} cap`}
            chipLabel={
              budget.exhausted
                ? "Exhausted"
                : budget.pctUsed >= 0.75
                  ? "Near limit"
                  : "Healthy"
            }
            chipStyle={budgetTone}
          />
          <StatCard
            label="Reviews this week"
            primary={reviewsThisWeek.toString()}
            secondary={
              reviewsFailedThisWeek > 0
                ? `${reviewsFailedThisWeek} failed`
                : "No failures"
            }
          />
          <StatCard
            label="Unresolved system errors"
            primary={errorsUnresolvedSystem.toString()}
            secondary={
              errorsThisWeek > 0
                ? `${errorsThisWeek} new this week`
                : "Clean week"
            }
            chipLabel={errorsUnresolvedSystem > 0 ? "Needs triage" : "Clear"}
            chipStyle={errorsTone}
          />
          <StatCard
            label="Waitlist signups"
            primary={waitlistTotal.toString()}
            secondary={
              waitlistThisMonth > 0
                ? `${waitlistThisMonth} this month`
                : "None this month"
            }
          />
        </section>

        {/* Section cards — one per admin surface */}
        <section className="grid gap-5 sm:grid-cols-2">
          <AdminCard
            href="/admin/history"
            icon={<ListChecks className="size-5" />}
            title="Review history"
            lede={`${reviewsTotal.toLocaleString()} total · ${reviewsThisMonth} this month`}
            body="Every submitted review, including status, inferred seniority, overall rating, and cost. Click a row to open the finished report."
          />
          <AdminCard
            href="/admin/errors"
            icon={<AlertTriangle className="size-5" />}
            title="Errors"
            lede={
              errorsUnresolvedSystem > 0
                ? `${errorsUnresolvedSystem} unresolved · ${errorsThisWeek} this week`
                : "Nothing to triage"
            }
            body={
              latestError
                ? `Last unresolved: ${new Date(latestError.createdAt).toISOString().slice(0, 10)} · phase=${latestError.phase}${latestError.portfolioUrl ? ` · ${latestError.portfolioUrl.replace(/^https?:\/\//, "").slice(0, 48)}` : ""}`
                : "Weekly triage queue for crawler / LLM / infra failures. User-facing portfolio issues filter separately."
            }
            urgent={errorsUnresolvedSystem > 0}
          />
          <AdminCard
            href="/admin/feedback"
            icon={<MessageSquare className="size-5" />}
            title="Feedback"
            lede={
              feedbackTotal > 0
                ? `${feedbackTotal} total · ${feedbackPositivePct}% positive`
                : "No feedback yet"
            }
            body="What users thought of their reviews — emoji verdict + comment, linked to the review they rated. Also triggers a Resend email to you per submission."
          />
          <AdminCard
            href="/admin/waitlist"
            icon={<Mail className="size-5" />}
            title="Waitlist"
            lede={
              waitlistTotal > 0
                ? `${waitlistTotal} total · ${waitlistThisMonth} this month`
                : "No signups yet"
            }
            body="People who hit the budget-exhausted state and asked to be notified. Shows email + portfolio URL + whether you've emailed them."
          />
        </section>

        {/* Recent activity — last 5 reviews, inline */}
        {recentActivity.length > 0 && (
          <section
            className="mt-10 overflow-hidden"
            style={{
              background: "var(--s-lowest)",
              borderRadius: "var(--r-xl)",
              boxShadow: "var(--e1)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--outline-variant)" }}
            >
              <h2
                className="text-[14px] font-bold tracking-wide"
                style={{ color: "var(--on-surface)" }}
              >
                Recent reviews
              </h2>
              <Link
                href="/admin/history"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                style={{ color: "var(--on-surface-variant)" }}
              >
                See all
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <ul>
              {recentActivity.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center gap-4 border-b px-5 py-3 last:border-b-0"
                  style={{ borderColor: "var(--outline-variant)" }}
                >
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    {new Date(row.createdAt).toISOString().slice(0, 10)}
                  </span>
                  <Link
                    href={`/r/${row.id}`}
                    className="min-w-0 flex-1 truncate text-[14px] underline-offset-4 hover:underline"
                    style={{ color: "var(--on-surface)" }}
                  >
                    {row.portfolioUrl.replace(/^https?:\/\//, "")}
                  </Link>
                  <StatusChip
                    status={row.status}
                    failureKind={row.failureKind}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

function StatCard({
  label,
  primary,
  secondary,
  chipLabel,
  chipStyle,
}: {
  label: string;
  primary: string;
  secondary: string;
  chipLabel?: string;
  chipStyle?: { bg: string; c: string };
}) {
  return (
    <div
      className="p-5"
      style={{
        background: "var(--s-lowest)",
        borderRadius: "var(--r-xl)",
        boxShadow: "var(--e1)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="text-[11px] font-bold tracking-wider uppercase"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {label}
        </div>
        {chipLabel && chipStyle && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
            style={{ background: chipStyle.bg, color: chipStyle.c }}
          >
            {chipLabel}
          </span>
        )}
      </div>
      <div
        className="mt-2 text-3xl font-bold tabular-nums"
        style={{ color: "var(--on-surface)" }}
      >
        {primary}
      </div>
      <div
        className="mt-1 text-[12px]"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {secondary}
      </div>
    </div>
  );
}

function AdminCard({
  href,
  icon,
  title,
  lede,
  body,
  urgent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  lede: string;
  body: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block p-6 transition-colors hover:bg-[var(--s-low)]"
      style={{
        background: "var(--s-lowest)",
        borderRadius: "var(--r-xl)",
        boxShadow: "var(--e1)",
        border: urgent
          ? "1.5px solid var(--rt-needswork)"
          : "1.5px solid transparent",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 items-center justify-center rounded-full"
            style={{
              background: urgent ? "var(--rt-needswork-bg)" : "var(--s-container)",
              color: urgent ? "var(--rt-needswork)" : "var(--on-surface)",
            }}
          >
            {icon}
          </span>
          <h3
            className="text-[16px] font-bold tracking-tight"
            style={{ color: "var(--on-surface)" }}
          >
            {title}
          </h3>
        </div>
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--on-surface-variant)" }}
        />
      </div>
      <div
        className="mt-4 text-[14px] font-semibold"
        style={{ color: "var(--on-surface)" }}
      >
        {lede}
      </div>
      <p
        className="mt-1 text-[13px] leading-relaxed"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {body}
      </p>
    </Link>
  );
}

function StatusChip({
  status,
  failureKind,
}: {
  status: string;
  failureKind: string | null;
}) {
  if (status === "completed") {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
        style={{
          background: "var(--rt-strong-bg)",
          color: "var(--rt-strong)",
        }}
      >
        completed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
        style={{
          background:
            failureKind === "system"
              ? "var(--rt-needswork-bg)"
              : "var(--rt-developing-bg)",
          color:
            failureKind === "system"
              ? "var(--rt-needswork)"
              : "var(--rt-developing)",
        }}
      >
        {failureKind === "system" ? "system failed" : "failed"}
      </span>
    );
  }
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase"
      style={{
        background: "var(--s-container)",
        color: "var(--on-surface-variant)",
      }}
    >
      {status}
    </span>
  );
}
