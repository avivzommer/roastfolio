import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { logoutAdmin } from "@/lib/actions";
import { LogOut, ArrowLeft, ListChecks, Mail } from "lucide-react";

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonthUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

// Match the 4 sentiment ids used by the review-page feedback UI so we can
// show the emoji + label admins expect to see.
const SENTIMENT_LABEL: Record<string, { label: string; emoji: string }> = {
  helpful: { label: "Spot on", emoji: "🎯" },
  mostly: { label: "Mostly useful", emoji: "👍" },
  somewhat: { label: "Somewhat", emoji: "🤔" },
  off: { label: "Missed the mark", emoji: "😕" },
};

/**
 * Extracts the sentiment id from the comment string. The client wraps the
 * user's text with `[sentiment_id] ...`; strip it back apart for display.
 */
function parseComment(comment: string | null): {
  sentiment: string | null;
  text: string;
} {
  if (!comment) return { sentiment: null, text: "" };
  const m = comment.match(/^\[([^\]]+)\]\s*(.*)$/s);
  if (!m) return { sentiment: null, text: comment };
  const id = m[1] === "no-sentiment" ? null : m[1];
  return { sentiment: id, text: m[2] };
}

export default async function AdminFeedbackPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const [rows, total, thisMonth, positive] = await Promise.all([
    prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        review: {
          select: { portfolioUrl: true },
        },
      },
    }),
    prisma.feedback.count(),
    prisma.feedback.count({
      where: { createdAt: { gte: startOfMonthUtc() } },
    }),
    prisma.feedback.count({ where: { helpful: true } }),
  ]);

  const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;

  return (
    <>
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
            style={{
              background: "var(--m3-primary)",
              color: "var(--m3-on-primary)",
            }}
          >
            PR
          </div>
          <div>
            <div
              className="text-[18px] font-bold leading-tight tracking-tight"
              style={{ color: "var(--on-surface)" }}
            >
              Admin · Feedback
            </div>
            <div className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              What users think of their reviews
            </div>
          </div>
        </Link>
        <div className="flex-1" />
        <Link href="/admin/history" className="m3-btn">
          <ListChecks className="size-4" />
          Review history
        </Link>
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
        <section
          className="mb-8 grid gap-4 sm:grid-cols-3"
          style={{ color: "var(--on-surface)" }}
        >
          <StatCard label="Total feedback" value={total} />
          <StatCard label="This month" value={thisMonth} />
          <StatCard
            label="Positive"
            value={`${positive} (${positivePct}%)`}
          />
        </section>

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
                <Th>Verdict</Th>
                <Th>Comment</Th>
                <Th>Review</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-sm"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    No feedback yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const parsed = parseComment(row.comment);
                  const sent = parsed.sentiment
                    ? SENTIMENT_LABEL[parsed.sentiment]
                    : null;
                  return (
                    <tr
                      key={row.id}
                      className="border-b align-top transition-colors hover:bg-[var(--s-low)]"
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
                        <span
                          style={{
                            color: row.helpful
                              ? "var(--rt-strong)"
                              : "var(--rt-needswork)",
                          }}
                        >
                          {sent ? `${sent.emoji} ${sent.label}` : row.helpful ? "👍 Helpful" : "👎 Not helpful"}
                        </span>
                      </Td>
                      <Td>
                        {parsed.text ? (
                          <span
                            className="whitespace-pre-wrap"
                            style={{ color: "var(--on-surface)" }}
                          >
                            {parsed.text}
                          </span>
                        ) : (
                          <span
                            className="text-xs italic"
                            style={{ color: "var(--on-surface-variant)" }}
                          >
                            (no comment)
                          </span>
                        )}
                      </Td>
                      <Td>
                        <Link
                          href={`/r/${row.reviewId}`}
                          target="_blank"
                          className="max-w-xs truncate underline-offset-4 hover:underline"
                          style={{ color: "var(--on-surface)" }}
                        >
                          {row.review?.portfolioUrl
                            ? row.review.portfolioUrl.replace(/^https?:\/\//, "")
                            : row.reviewId}
                        </Link>
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
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
      <div
        className="text-[11px] font-bold tracking-wider uppercase"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-4xl font-bold tabular-nums"
        style={{ color: "var(--on-surface)" }}
      >
        {value}
      </div>
    </div>
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
    <td className="px-5 py-4 align-top" style={{ textAlign: align }}>
      {children}
    </td>
  );
}
