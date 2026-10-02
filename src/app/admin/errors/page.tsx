import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { logoutAdmin, toggleReviewErrorResolved } from "@/lib/actions";
import {
  LogOut,
  ArrowLeft,
  ListChecks,
  Mail,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

function formatDate(d: Date) {
  const iso = d.toISOString();
  // "2026-10-01 15:47"
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

function startOfWeekUtc(d = new Date()): Date {
  const copy = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  copy.setUTCDate(copy.getUTCDate() - copy.getUTCDay());
  return copy;
}

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
  const sp = await searchParams;
  // Default view: unresolved system errors — the triage queue.
  const show = sp.show ?? "unresolved";

  const whereClause =
    show === "all"
      ? {}
      : show === "resolved"
        ? { resolved: true }
        : show === "system"
          ? { kind: "system", resolved: false }
          : show === "user"
            ? { kind: "user", resolved: false }
            : { resolved: false };

  const [rows, total, unresolvedSystem, thisWeekSystem] = await Promise.all([
    prisma.reviewError.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.reviewError.count(),
    prisma.reviewError.count({
      where: { resolved: false, kind: "system" },
    }),
    prisma.reviewError.count({
      where: {
        kind: "system",
        createdAt: { gte: startOfWeekUtc() },
      },
    }),
  ]);

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
        <Link href="/admin" className="flex items-center gap-3.5">
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
              Admin · Errors
            </div>
            <div className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              What broke on the review pipeline
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
        <Link href="/admin/feedback" className="m3-btn">
          <MessageSquare className="size-4" />
          Feedback
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
          className="mb-6 grid gap-4 sm:grid-cols-3"
          style={{ color: "var(--on-surface)" }}
        >
          <StatCard label="Unresolved system errors" value={unresolvedSystem} />
          <StatCard label="System errors this week" value={thisWeekSystem} />
          <StatCard label="Total errors (all time)" value={total} />
        </section>

        {/* Filter chips */}
        <div
          className="mb-6 flex flex-wrap gap-2 text-sm"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <FilterChip href="/admin/errors" label="Unresolved" active={show === "unresolved"} />
          <FilterChip
            href="/admin/errors?show=system"
            label="System only"
            active={show === "system"}
          />
          <FilterChip
            href="/admin/errors?show=user"
            label="User only"
            active={show === "user"}
          />
          <FilterChip
            href="/admin/errors?show=resolved"
            label="Resolved"
            active={show === "resolved"}
          />
          <FilterChip href="/admin/errors?show=all" label="All" active={show === "all"} />
        </div>

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
                <Th>When</Th>
                <Th>Kind</Th>
                <Th>Phase</Th>
                <Th>Portfolio</Th>
                <Th>Message</Th>
                <Th align="right">Review</Th>
                <Th align="right">Resolved</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-sm"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    No errors in this view. {show === "unresolved" && "Nice."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b align-top transition-colors hover:bg-[var(--s-low)]"
                    style={{ borderColor: "var(--outline-variant)" }}
                  >
                    <Td>
                      <span
                        className="font-mono text-[11px] whitespace-nowrap"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        {formatDate(row.createdAt)}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          background:
                            row.kind === "system"
                              ? "var(--rt-needswork-bg)"
                              : "var(--rt-developing-bg)",
                          color:
                            row.kind === "system"
                              ? "var(--rt-needswork)"
                              : "var(--rt-developing)",
                        }}
                      >
                        {row.kind === "system" && (
                          <AlertTriangle className="size-3" />
                        )}
                        {row.kind}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        {row.phase}
                      </span>
                    </Td>
                    <Td>
                      {row.portfolioUrl ? (
                        <a
                          href={row.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-xs truncate underline-offset-4 hover:underline"
                          style={{ color: "var(--on-surface)" }}
                        >
                          {row.portfolioUrl.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span style={{ color: "var(--on-surface-variant)" }}>
                          —
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span
                        className="whitespace-pre-wrap text-[13px]"
                        style={{ color: "var(--on-surface)" }}
                      >
                        {row.message}
                      </span>
                    </Td>
                    <Td align="right">
                      {row.reviewId ? (
                        <Link
                          href={`/r/${row.reviewId}`}
                          target="_blank"
                          className="font-mono text-[11px] underline-offset-4 hover:underline"
                          style={{ color: "var(--on-surface)" }}
                        >
                          {row.reviewId}
                        </Link>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          —
                        </span>
                      )}
                    </Td>
                    <Td align="right">
                      <form action={toggleReviewErrorResolved}>
                        <input type="hidden" name="id" value={row.id} />
                        <button
                          type="submit"
                          className="rounded-full px-3 py-1 text-[11px] font-semibold"
                          style={{
                            background: row.resolved
                              ? "var(--rt-strong-bg)"
                              : "var(--s-container)",
                            color: row.resolved
                              ? "var(--rt-strong)"
                              : "var(--on-surface)",
                            cursor: "pointer",
                            border: "none",
                          }}
                        >
                          {row.resolved ? "✓ resolved" : "mark resolved"}
                        </button>
                      </form>
                    </Td>
                  </tr>
                ))
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

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5"
      style={{
        background: active ? "var(--m3-primary)" : "var(--s-container)",
        color: active ? "var(--m3-on-primary)" : "var(--on-surface)",
        fontWeight: active ? 600 : 500,
      }}
    >
      {label}
    </Link>
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
