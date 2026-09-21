"use client";

import { useState } from "react";
import type { RedFlag, RedFlagSeverity } from "@/lib/types";
import { severityLabel } from "@/lib/review-view";

/**
 * Risks list with severity filter — replaces the old RedFlagsSection.
 * Filterable by All / Critical / Moderate / Minor.
 */
export function RisksList({
  flags,
  intro,
}: {
  flags: RedFlag[];
  intro?: string;
}) {
  const [filter, setFilter] = useState<"All" | "Critical" | "Moderate" | "Minor">("All");
  if (flags.length === 0) return null;

  const counts = flags.reduce<Record<string, number>>((m, r) => {
    const label = severityLabel(r.severity);
    m[label] = (m[label] || 0) + 1;
    return m;
  }, {});
  const filters: Array<"All" | "Critical" | "Moderate" | "Minor"> = [
    "All",
    "Critical",
    "Moderate",
    "Minor",
  ];
  const shown =
    filter === "All"
      ? flags
      : flags.filter((r) => severityLabel(r.severity) === filter);

  return (
    <section id="risks" className="reveal" style={{ scrollMarginTop: 96 }}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="m3-eyebrow">Review risks</span>
          <h2
            className="mt-2 text-[30px] font-bold leading-[1.1] tracking-tight"
            style={{ color: "var(--on-surface)" }}
          >
            What a reviewer might stop on
          </h2>
          {intro && (
            <p
              className="mt-2 text-[15px]"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {intro}
            </p>
          )}
        </div>
        <div
          className="inline-flex gap-1.5 rounded-full p-1.5"
          style={{ background: "var(--s-container)" }}
        >
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="relative inline-flex cursor-pointer items-center gap-2 border-0 px-4 py-1.5 text-xs font-semibold transition-all"
              style={{
                background: filter === f ? "var(--m3-primary)" : "transparent",
                color: filter === f ? "var(--m3-on-primary)" : "var(--on-surface-variant)",
                borderRadius: "var(--r-full)",
              }}
            >
              {f}
              <span className="text-[11px] opacity-80">
                {f === "All" ? flags.length : counts[f] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3.5">
        {shown.map((r, i) => (
          <RiskCard key={i} flag={r} />
        ))}
      </div>
    </section>
  );
}

function RiskCard({ flag }: { flag: RedFlag }) {
  const sev = severityLabel(flag.severity);
  const tone =
    flag.severity === "critical"
      ? { bg: "var(--rt-needswork-bg)", c: "var(--rt-needswork)" }
      : flag.severity === "moderate"
        ? { bg: "var(--rt-developing-bg)", c: "var(--rt-developing)" }
        : { bg: "var(--s-container)", c: "var(--on-surface-variant)" };
  return (
    <div
      className="flex gap-4.5 p-5.5 transition-transform hover:-translate-y-0.5"
      style={{
        background: "var(--s-lowest)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--e1)",
      }}
    >
      <div className="w-[104px] flex-none">
        <span
          className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase"
          style={{
            background: tone.bg,
            color: tone.c,
            borderRadius: "var(--r-full)",
          }}
        >
          <span className="size-[7px] rounded-full" style={{ background: "currentColor" }} />
          {sev}
        </span>
        <div
          className="mt-2.5 text-[11px] font-bold tracking-wider uppercase"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {flag.category}
        </div>
      </div>
      <div>
        <div
          className="text-base font-bold tracking-tight"
          style={{ color: "var(--on-surface)" }}
        >
          {flag.title}
        </div>
        <p
          className="mt-2.5 text-sm leading-[1.55]"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {flag.detail}
        </p>
      </div>
    </div>
  );
}
