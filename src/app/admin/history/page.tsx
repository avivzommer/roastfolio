import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { logoutAdmin } from "@/lib/actions";
import {
  getMonthlyBudget,
  ipRateLimitPerHour,
} from "@/lib/limits";
import type { ReviewReport } from "@/lib/types";
import { SENIORITY_LABEL, VERDICT_LABEL } from "@/lib/types";
import { RatingChip } from "@/components/review/rating-chip";
import { LogOut, ArrowLeft, Mail } from "lucide-react";

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatCost(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

interface IpActivity {
  ip: string;
  count: number;
  atLimit: boolean;
}

function recentActivityByIp(
  rows: { ipAddress: string | null; createdAt: Date }[],
  limit: number,
): IpActivity[] {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.ipAddress) continue;
    if (r.createdAt.getTime() < oneHourAgo) continue;
    counts.set(r.ipAddress, (counts.get(r.ipAddress) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([ip, count]) => ({ ip, count, atLimit: count >= limit }));
}

export default async function AdminHistoryPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const rows = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const budget = await getMonthlyBudget();
  const rateLimit = ipRateLimitPerHour();
  const ipActivity = recentActivityByIp(rows, rateLimit);
  const budgetTone =
    budget.pctUsed >= 1
      ? { bg: "var(--rt-needswork-bg)", c: "var(--rt-needswork)" }
      : budget.pctUsed >= 0.75
        ? { bg: "var(--rt-developing-bg)", c: "var(--rt-developing)" }
        : { bg: "var(--rt-strong-bg)", c: "var(--rt-strong)" };

  return (
    <>
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 flex h-[72px] items-center gap-4 px-6"
        style={{
          background: "color-mix(in srgb, var(--s-low) 86%, transparent)",
          backdropFilter: "saturate(150%) blur(16px)",
          WebkitBackdropFilter: "saturate(150%) blur(16px)",
        }}
      >
        <Link href="/" className="flex items-center gap-3.5">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold tracking-wide"
            style={{ background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}
          >
            PR
          </div>
          <div>
            <div
              className="text-[18px] font-bold leading-tight tracking-tight"
              style={{ color: "var(--on-surface)" }}
            >
              Admin · Review history
            </div>
            <div className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Every review the system has run
            </div>
          </div>
        </Link>
        <div className="flex-1" />
        <Link href="/admin/waitlist" className="m3-btn">
          <Mail className="size-4" />
          Waitlist
        </Link>
        <Link href="/" className="m3-btn">
          <ArrowLeft className="size-4" />
          Home
        </Link>
        <form action={logoutAdmin}>
          <button type="submit" className="m3-btn">
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        {/* Safety nets — budget + recent IP activity */}
        <section
          className="mb-8 grid gap-4 sm:grid-cols-2"
          style={{ color: "var(--on-surface)" }}
        >
          {/* Budget card */}
          <div
            className="p-5"
            style={{
              background: "var(--s-lowest)",
              borderRadius: "var(--r-xl)",
              boxShadow: "var(--e1)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-bold tracking-wider uppercase"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Monthly budget
              </span>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-widest uppercase"
                style={{
                  background: budgetTone.bg,
                  color: budgetTone.c,
                  borderRadius: "var(--r-full)",
                }}
              >
                {budget.exhausted
                  ? "Exhausted"
                  : budget.pctUsed >= 0.75
                    ? "Near limit"
                    : "Healthy"}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight">
                {formatCost(budget.spentCents)}
              </span>
              <span
                className="text-sm"
                style={{ color: "var(--on-surface-variant)" }}
              >
                of {formatCost(budget.limitCents)} this month
              </span>
            </div>
            <div
              className="mt-3 h-1.5 w-full overflow-hidden"
              style={{
                background: "var(--s-high)",
                borderRadius: "var(--r-full)",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, budget.pctUsed * 100).toFixed(1)}%`,
                  height: "100%",
                  background: budgetTone.c,
                }}
              />
            </div>
            <p
              className="mt-3 text-xs"
              style={{ color: "var(--on-surface-variant)" }}
            >
              New submissions are blocked once monthly spend reaches the cap.
              Cap resets on the 1st of the month.
            </p>
          </div>

          {/* IP activity card */}
          <div
            className="p-5"
            style={{
              background: "var(--s-lowest)",
              borderRadius: "var(--r-xl)",
              boxShadow: "var(--e1)",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-bold tracking-wider uppercase"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Rate limit · last hour
              </span>
              <span
                className="text-[11px] font-medium"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {rateLimit}/IP/hour
              </span>
            </div>
            {ipActivity.length === 0 ? (
              <p
                className="mt-3 text-sm"
                style={{ color: "var(--on-surface-variant)" }}
              >
                No submissions in the last hour.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {ipActivity.map((a) => (
                  <li
                    key={a.ip}
                    className="flex items-center justify-between rounded-[var(--r-md)] px-3 py-2"
                    style={{
                      background: a.atLimit
                        ? "var(--rt-developing-bg)"
                        : "var(--s-low)",
                    }}
                  >
                    <span
                      className="font-mono text-xs"
                      style={{
                        color: a.atLimit
                          ? "var(--rt-developing)"
                          : "var(--on-surface)",
                      }}
                    >
                      {a.ip}
                    </span>
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{
                        color: a.atLimit
                          ? "var(--rt-developing)"
                          : "var(--on-surface-variant)",
                      }}
                    >
                      {a.count} / {rateLimit}
                      {a.atLimit && " · blocked"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Reviews table */}
        <div
          className="overflow-hidden"
          style={{
            background: "var(--s-lowest)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--e1)",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--outline-variant)" }}
              >
                <Th>Date</Th>
                <Th>Portfolio</Th>
                <Th>Reviewer position</Th>
                <Th>Reads as</Th>
                <Th align="right">Rating</Th>
                <Th align="right">Confidence</Th>
                <Th align="right">IP</Th>
                <Th align="right">Cost</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 text-center text-sm"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    No reviews yet. Try{" "}
                    <code
                      className="rounded px-1.5 py-0.5"
                      style={{ background: "var(--s-container)" }}
                    >
                      npm run db:seed
                    </code>
                    .
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const report: ReviewReport | null = row.report
                    ? (JSON.parse(row.report) as ReviewReport)
                    : null;
                  return (
                    <tr
                      key={row.id}
                      className="border-b transition-colors hover:bg-[var(--s-low)]"
                      style={{ borderColor: "var(--outline-variant)" }}
                    >
                      <Td>
                        <span
                          className="tabular-nums"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {formatDate(row.createdAt)}
                        </span>
                      </Td>
                      <Td>
                        <Link
                          href={`/r/${row.id}`}
                          className="max-w-xs truncate underline-offset-4 hover:underline"
                          style={{ color: "var(--on-surface)" }}
                        >
                          {row.portfolioUrl}
                        </Link>
                      </Td>
                      <Td>
                        {report ? (
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--on-surface)" }}
                          >
                            {VERDICT_LABEL[report.verdict]}
                          </span>
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: "var(--on-surface-variant)" }}
                          >
                            {row.status}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <span
                          className="text-xs"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {report ? SENIORITY_LABEL[report.inferredSeniority] : "—"}
                        </span>
                      </Td>
                      <Td align="right">
                        {report ? (
                          <RatingChip score={report.overallScore} size="sm" />
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td align="right">
                        <span
                          className="text-xs capitalize"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {report?.confidenceLevel ?? "—"}
                        </span>
                      </Td>
                      <Td align="right">
                        <span
                          className="font-mono text-[11px]"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {row.ipAddress ?? "—"}
                        </span>
                      </Td>
                      <Td align="right">
                        <span
                          className="tabular-nums"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {formatCost(row.costCents)}
                        </span>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className="px-5 py-4 text-[11px] font-bold tracking-wider uppercase"
      style={{
        color: "var(--on-surface-variant)",
        textAlign: align,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className="px-5 py-4 align-middle"
      style={{ textAlign: align }}
    >
      {children}
    </td>
  );
}
