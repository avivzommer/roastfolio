import Link from "next/link";
import { ExternalLink, Download } from "lucide-react";
import type { ReviewReport } from "@/lib/types";
import { SENIORITY_LABEL, VERDICT_LABEL } from "@/lib/types";
import { readableHost, readableDate } from "@/lib/review-view";

/**
 * Shared chrome used across the Summary / Homepage / Case-study review pages.
 * Lives at this file instead of inside each page so there is one place to
 * change the topbar, peach tokens, footer, browser mockup, and admin block.
 */

/**
 * Peach-tone reskin — overrides M3 tokens locally so the whole review-page
 * subtree (topbar, cards, chips) picks up the homepage palette without
 * editing every leaf component. Applied once at the layout root.
 */
export const PEACH_TOKENS = {
  "--peach": "#FDDDBB",
  "--peach-soft": "#FBF0DA",
  "--cream": "#FBF3E4",
  "--sidebar-bg": "#F9EAD1",
  "--doc-bg": "#FFFEFA",
  "--ink": "#111111",
  "--ink-soft": "#4A4640",
  "--rule": "#E9C79C",
  "--rule-soft": "#F0D9B6",
  "--white": "#FFFFFF",

  // M3 token overrides — cascade to child components.
  "--background": "#FDDDBB",
  "--foreground": "#111111",
  "--s-lowest": "#FFFFFF",
  "--s-low": "#FFFEFA",
  "--s-container": "#F7E4CA",
  "--s-high": "#F0D5B3",
  "--s-highest": "#ECC99A",
  "--on-surface": "#111111",
  "--on-surface-variant": "#4A4640",
  "--outline": "#C9AC81",
  "--outline-variant": "#E9C79C",
  "--m3-primary": "#111111",
  "--m3-on-primary": "#FFFFFF",
  "--m3-primary-container": "#F7E4CA",
  "--m3-on-primary-container": "#111111",
  "--m3-secondary-container": "#F7E4CA",
  "--m3-on-secondary-container": "#111111",

  // Rating tones — reworked to a warm palette that lives on peach.
  "--rt-strong": "#3D5A20",
  "--rt-strong-bg": "#DFE7BF",
  "--rt-strong-line": "#C9D3A0",
  "--rt-strong-dot": "#5A7A28",
  "--rt-good": "#6B3F14",
  "--rt-good-bg": "#F1DBB9",
  "--rt-good-line": "#E4C99B",
  "--rt-good-dot": "#B4813A",
  "--rt-developing": "#6B4715",
  "--rt-developing-bg": "#F5D6A0",
  "--rt-developing-line": "#E9C787",
  "--rt-developing-dot": "#C48A24",
  "--rt-needswork": "#7A1E0C",
  "--rt-needswork-bg": "#F5C7B4",
  "--rt-needswork-line": "#EAB29A",
  "--rt-needswork-dot": "#B8442B",

  // Feedback pop — warm coral that reads on peach.
  "--pop-pink": "#F5A88A",
  "--pop-pink-ink": "#5C1E0C",

  background: "#FDDDBB",
  color: "#111111",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  minHeight: "100vh",
};

/**
 * Topbar: brand mark, portfolio host + date, Visit site + Export buttons.
 * Shared across every review sub-page via the layout.
 */
export function ReviewHeader({
  portfolioUrl,
  createdAt,
  reviewId,
}: {
  portfolioUrl: string;
  createdAt: Date;
  reviewId: string;
}) {
  const host = readableHost(portfolioUrl);
  const date = readableDate(createdAt);
  return (
    <header
      className="mx-auto flex w-full items-center gap-3 px-4 sm:gap-4 sm:px-10"
      style={{ maxWidth: 1240, height: 88 }}
    >
      <Link href="/" className="inline-flex items-center gap-2.5">
        <span
          style={{
            fontFamily: "var(--font-bricolage), Inter, system-ui, sans-serif",
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
          className="hidden sm:inline-block"
          style={{
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

      <div className="hidden min-w-0 flex-1 items-center gap-2 pl-4 sm:flex">
        <span
          className="truncate text-[13px]"
          style={{ color: "var(--ink-soft)" }}
        >
          {host} · {date}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <a
          href={portfolioUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Visit site"
          className="inline-flex items-center gap-2 whitespace-nowrap"
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink)",
            background: "transparent",
            border: "1.5px solid rgba(17, 17, 17, 0.14)",
            borderRadius: 10,
            padding: "9px 14px",
            textDecoration: "none",
          }}
        >
          <ExternalLink className="size-4" />
          <span className="hidden sm:inline">Visit site</span>
        </a>
        <a
          href={`/r/${reviewId}/download`}
          download
          aria-label="Export"
          className="inline-flex items-center gap-2 whitespace-nowrap"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#FFFFFF",
            background: "var(--ink)",
            border: "1.5px solid var(--ink)",
            borderRadius: 10,
            padding: "9px 14px",
            textDecoration: "none",
          }}
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Export</span>
        </a>
      </div>
    </header>
  );
}

/** Vertical spacer that matches the per-section rhythm on the review. */
export function Spacer() {
  return <div style={{ marginTop: 52 }} />;
}

/** Footer line shown at the bottom of each review sub-page. */
export function Footer({
  portfolioUrl,
  createdAt,
}: {
  portfolioUrl: string;
  createdAt: Date;
}) {
  return (
    <div
      className="mt-16 pt-6"
      style={{
        color: "var(--ink-soft)",
        fontSize: 12.5,
        lineHeight: 1.6,
        borderTop: "1px solid var(--rule)",
      }}
    >
      <span>
        Generated by Roastfolio on{" "}
        {createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        . Reviewing{" "}
        <a
          href={portfolioUrl}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
          style={{ color: "var(--ink)" }}
        >
          {portfolioUrl.replace(/^https?:\/\//, "")}
        </a>
        . This is one design lead&rsquo;s read — treat it as informed input,
        not a final judgment.
      </span>
    </div>
  );
}

/**
 * Coda-style browser frame around the scanned portfolio homepage.
 * Lives on the Homepage sub-page now.
 */
export function BrowserShot({ src, url }: { src: string; url: string }) {
  const readableUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="relative mb-12 select-none" aria-hidden="true">
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          background: "#FFFFFF",
          border: "1px solid var(--ink)",
          boxShadow: "10px 10px 0 var(--ink)",
          position: "relative",
        }}
      >
        <div
          className="flex items-center gap-2 px-3.5"
          style={{
            height: 36,
            background: "#F6EDDE",
            borderBottom: "1px solid var(--ink)",
          }}
        >
          <span
            style={{ width: 11, height: 11, borderRadius: 999, background: "#F17161", display: "inline-block" }}
          />
          <span
            style={{ width: 11, height: 11, borderRadius: 999, background: "#F2BD41", display: "inline-block" }}
          />
          <span
            style={{ width: 11, height: 11, borderRadius: 999, background: "#61C554", display: "inline-block" }}
          />
          <div
            className="mx-auto flex items-center justify-center truncate"
            style={{
              maxWidth: "58%",
              height: 22,
              padding: "0 12px",
              borderRadius: 999,
              background: "#FFFFFF",
              border: "1px solid var(--rule)",
              fontSize: 11.5,
              color: "var(--ink-soft)",
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            }}
          >
            <span className="truncate">{readableUrl}</span>
          </div>
          <span style={{ width: 33, flex: "none" }} />
        </div>

        <div
          style={{
            aspectRatio: "16 / 10",
            background: "#FFFFFF",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
              display: "block",
              position: "absolute",
              inset: 0,
            }}
          />
        </div>
      </div>

      {/* Flames escaping the bottom-right corner. CSS in globals.css
          scales .rf-browser-fire down on mobile. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fire.svg"
        alt=""
        className="rf-browser-fire"
        style={{
          position: "absolute",
          pointerEvents: "none",
          zIndex: 3,
          transform: "rotate(6deg)",
          maxWidth: "none",
          maxHeight: "none",
        }}
      />
    </div>
  );
}

/**
 * Admin-only block showing the LLM's inferred classification. Rendered at
 * the bottom of the Summary page when the viewer is an admin.
 */
export function InternalContextAdmin({ report }: { report: ReviewReport }) {
  return (
    <section
      className="mt-14 border-t pt-7"
      style={{ borderColor: "var(--outline-variant)" }}
    >
      <div className="flex items-center gap-2">
        <h3
          className="text-sm font-medium tracking-wide uppercase"
          style={{ color: "var(--on-surface)" }}
        >
          Internal context
        </h3>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium tracking-widest uppercase"
          style={{
            background: "var(--s-container)",
            color: "var(--on-surface-variant)",
          }}
        >
          Admin only
        </span>
      </div>
      <p
        className="mt-1.5 text-xs"
        style={{ color: "var(--on-surface-variant)" }}
      >
        The classification used to calibrate this review. Hidden from the
        designer&rsquo;s view.
      </p>
      <dl
        className="mt-4 grid gap-3 text-sm sm:grid-cols-3"
        style={{ color: "var(--on-surface)" }}
      >
        <div>
          <dt className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            Reads as
          </dt>
          <dd className="font-medium">
            {SENIORITY_LABEL[report.inferredSeniority]}
          </dd>
        </div>
        <div>
          <dt className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            Reviewer position
          </dt>
          <dd className="font-medium">{VERDICT_LABEL[report.verdict]}</dd>
        </div>
        {report.confidenceLevel && (
          <div>
            <dt className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Confidence
            </dt>
            <dd className="font-medium capitalize">{report.confidenceLevel}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

/** One-sentence calibration string shown under the ClosingCard on Summary. */
export function confidenceSentence(report: ReviewReport): string | undefined {
  const tier = report.confidenceLevel;
  if (!tier) return undefined;
  const seniority = SENIORITY_LABEL[report.inferredSeniority].toLowerCase();
  if (tier === "high") {
    return `Confidence is high — the homepage and case studies provided clear, accessible content across the board. Based on the current evidence, this portfolio fits a ${seniority}-level hiring bar.`;
  }
  if (tier === "low") {
    return `Confidence is low — significant content was gated, broken, or missing, so this read is partial. Based on what could be evaluated, this portfolio fits a ${seniority}-level hiring bar.`;
  }
  return `Confidence is medium — there was enough to evaluate, but some content was thin or unclear. Based on the current evidence, this portfolio fits a ${seniority}-level hiring bar.`;
}
