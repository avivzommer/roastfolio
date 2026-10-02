import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/header";

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
      <AdminHeader
        section="waitlist"
        title="Admin · Waitlist"
        subtitle="People waiting for Roastfolio to reopen"
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
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
          className="overflow-x-auto"
          style={{
            background: "var(--s-lowest)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--e1)",
          }}
        >
          <table className="w-full min-w-[720px] text-sm">
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
