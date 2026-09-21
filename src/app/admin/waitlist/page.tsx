import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { logoutAdmin } from "@/lib/actions";
import { LogOut, ArrowLeft, ListChecks } from "lucide-react";

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonthUtc(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

export default async function AdminWaitlistPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const [rows, total, thisMonth] = await Promise.all([
    prisma.waitlist.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.waitlist.count(),
    prisma.waitlist.count({
      where: { createdAt: { gte: startOfMonthUtc() } },
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
              Admin · Waitlist
            </div>
            <div className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              People waiting for Roastfolio to reopen
            </div>
          </div>
        </Link>
        <div className="flex-1" />
        <Link href="/admin/history" className="m3-btn">
          <ListChecks className="size-4" />
          Review history
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
          className="mb-8 grid gap-4 sm:grid-cols-2"
          style={{ color: "var(--on-surface)" }}
        >
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
              Total on waitlist
            </div>
            <div
              className="mt-1 text-4xl font-bold tabular-nums"
              style={{ color: "var(--on-surface)" }}
            >
              {total}
            </div>
          </div>
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
              Added this month
            </div>
            <div
              className="mt-1 text-4xl font-bold tabular-nums"
              style={{ color: "var(--on-surface)" }}
            >
              {thisMonth}
            </div>
          </div>
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
                <Th>Joined</Th>
                <Th>Email</Th>
                <Th>Portfolio</Th>
                <Th align="right">IP</Th>
                <Th align="right">Notified</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-sm"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    No one on the waitlist yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
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
                      <span style={{ color: "var(--on-surface)" }}>
                        {row.email}
                      </span>
                    </Td>
                    <Td>
                      <a
                        href={row.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-xs truncate underline-offset-4 hover:underline"
                        style={{ color: "var(--on-surface)" }}
                      >
                        {row.portfolioUrl.replace(/^https?:\/\//, "")}
                      </a>
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
                        className="text-xs"
                        style={{
                          color: row.notified
                            ? "var(--rt-strong)"
                            : "var(--on-surface-variant)",
                        }}
                      >
                        {row.notified ? "Yes" : "—"}
                      </span>
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
    <td className="px-5 py-4 align-middle" style={{ textAlign: align }}>
      {children}
    </td>
  );
}
