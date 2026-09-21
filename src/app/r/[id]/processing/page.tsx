"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { getReviewStatus } from "@/lib/actions";

const STAGES = [
  "Firing up the grill",
  "Reading your homepage",
  "Sniffing out the case studies",
  "Chewing on the case studies",
  "Checking the UX seasoning",
  "Checking the product craft",
  "Checking the UI craft",
  "Plating up the roast",
];

const STAGE_ADVANCE_MS = 3_000;
const POLL_INTERVAL_MS = 2_000;

const TOKENS: React.CSSProperties = {
  "--peach": "#FDDDBB",
  "--peach-2": "#FCD3A8",
  "--ink": "#111111",
  "--ink-soft": "#4A4640",
  "--rule": "#E9C79C",
  "--white": "#FFFFFF",
  "--f-display": "var(--font-bricolage), Inter, system-ui, sans-serif",
  "--f-body": "var(--font-inter), system-ui, sans-serif",
} as React.CSSProperties;

type Phase =
  | { kind: "running" }
  | { kind: "completed" }
  | { kind: "failed"; reason: string | null };

export default function ProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [portfolioUrl, setPortfolioUrl] = useState<string>("");
  const [phase, setPhase] = useState<Phase>({ kind: "running" });

  useEffect(() => {
    if (phase.kind !== "running") return;
    const t = setTimeout(
      () => setStage((s) => (s + 1) % STAGES.length),
      STAGE_ADVANCE_MS,
    );
    return () => clearTimeout(t);
  }, [stage, phase.kind]);

  useEffect(() => {
    if (phase.kind !== "running") return;
    let cancelled = false;
    const poll = async () => {
      const status = await getReviewStatus(id);
      if (cancelled || !status) return;
      setPortfolioUrl((prev) => prev || status.portfolioUrl);
      if (status.status === "completed") {
        setPhase({ kind: "completed" });
        router.replace(`/r/${id}`);
      } else if (status.status === "failed") {
        setPhase({ kind: "failed", reason: status.failureReason });
      }
    };
    void poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id, router, phase.kind]);

  if (phase.kind === "failed") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="text-center">
          <div
            className="mx-auto flex size-12 items-center justify-center rounded-full"
            style={{
              background: "var(--rt-needswork-bg)",
              color: "var(--rt-needswork)",
            }}
          >
            <AlertCircle className="size-5" />
          </div>
          <h1
            className="mt-5 text-[28px] font-bold tracking-tight"
            style={{ color: "var(--on-surface)" }}
          >
            Review couldn&rsquo;t finish
          </h1>
          <p
            className="mt-3.5 text-sm leading-relaxed"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {phase.reason ??
              "Something went wrong while reviewing this portfolio."}
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-2">
          <Link
            href="/"
            className="m3-btn m3-btn--primary m3-btn--lg"
            style={{ width: "fit-content", margin: "0 auto" }}
          >
            Try another URL
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div
      style={{
        ...TOKENS,
        background: "var(--peach)",
        color: "var(--ink)",
        fontFamily: "var(--f-body)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes rf-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rf-enter {
          opacity: 0;
          animation: rf-fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .rf-enter-1 { animation-delay: 0ms; }
        .rf-enter-2 { animation-delay: 140ms; }
        .rf-enter-3 { animation-delay: 260ms; }
        .rf-enter-4 { animation-delay: 380ms; }

        @keyframes rf-stage-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rf-stage {
          animation: rf-stage-in 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .rf-enter, .rf-stage {
            opacity: 1;
            animation: none;
          }
        }
      `}</style>

      <header className="flex h-[72px] items-center px-6 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            roastfolio
          </span>
          <span
            aria-label="Beta"
            style={{
              fontFamily: "var(--f-body)",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink)",
              background: "rgba(17, 17, 17, 0.08)",
              border: "1px solid rgba(17, 17, 17, 0.16)",
              borderRadius: 999,
              padding: "2px 8px",
              lineHeight: 1.3,
            }}
          >
            Beta
          </span>
        </Link>
      </header>

      <main className="flex-1">
        <section
          className="mx-auto flex w-full max-w-[880px] flex-col items-center px-6 py-8 text-center sm:px-10"
          style={{ minHeight: "calc(100vh - 72px)", justifyContent: "center" }}
        >
          <img
            src="/hero-searching.svg"
            alt=""
            aria-hidden="true"
            className="rf-enter rf-enter-1 mb-10 h-auto w-full select-none"
            style={{ display: "block", maxWidth: 350 }}
          />

          <h1
            key={stage}
            aria-live="polite"
            className="rf-stage text-balance"
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 700,
              fontSize: "clamp(44px, 6vw, 84px)",
              lineHeight: 1.0,
              letterSpacing: "-0.032em",
              color: "var(--ink)",
              maxWidth: 15 + "ch",
              minHeight: "2em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {STAGES[stage]}
          </h1>

          <p
            className="rf-enter rf-enter-3 mt-5 text-[18px] leading-[1.5]"
            style={{ color: "var(--ink-soft)", maxWidth: "44ch" }}
          >
            Hold tight — this usually takes 90 seconds to 2 minutes.
          </p>

          <div
            aria-hidden
            className="rf-enter rf-enter-4 mt-9 flex w-full flex-col items-stretch gap-3 sm:flex-row"
            style={{ maxWidth: 560 }}
          >
            <input
              type="url"
              value={portfolioUrl}
              disabled
              readOnly
              placeholder="your-portfolio.com"
              className="min-w-0 flex-1 outline-none"
              style={{
                fontFamily: "var(--f-body)",
                fontSize: 16,
                color: "var(--ink-soft)",
                background: "var(--white)",
                border: "1.5px solid var(--rule)",
                borderRadius: 12,
                paddingInline: 20,
                paddingBlock: 18,
                textAlign: "left",
                opacity: 0.7,
                cursor: "not-allowed",
              }}
            />
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center whitespace-nowrap"
              style={{
                fontFamily: "var(--f-body)",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--white)",
                background: "var(--ink)",
                border: "1.5px solid var(--ink)",
                borderRadius: 12,
                paddingInline: 30,
                paddingBlock: 18,
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              Roasting…
            </button>
          </div>

          <Link
            href="/"
            className="rf-enter rf-enter-4 mt-5 text-[14px]"
            style={{
              color: "var(--ink-soft)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Cancel
          </Link>
        </section>
      </main>
    </div>
  );
}
