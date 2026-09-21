import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import type { ReviewReport } from "@/lib/types";
import { SENIORITY_LABEL, VERDICT_LABEL } from "@/lib/types";
import { overallScoreFromScores, readableHost, readableDate } from "@/lib/review-view";
import {
  SidebarNav,
  ScrollProgress,
  type NavGroup,
} from "@/components/review/sidebar-nav";
import { Hero } from "@/components/review/hero";
import { WorkingGrid } from "@/components/review/working-grid";
import { GrowthLeverCallout } from "@/components/review/growth-lever";
import { ActionStack } from "@/components/review/action-stack";
import { ScoreBreakdown } from "@/components/review/score-breakdown";
import { HomepageBlock } from "@/components/review/homepage-block";
import { CaseStudyBlock } from "@/components/review/case-study-block";
import { RisksList } from "@/components/review/risks-list";
import { ClosingCard } from "@/components/review/closing-card";
import { FeedbackSection } from "@/components/review/feedback-section";
import { FeedbackFab } from "@/components/review/feedback-fab";
import { Target, Check, Zap, List } from "lucide-react";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await prisma.review.findUnique({ where: { id } });
  if (!row) notFound();

  const report: ReviewReport | null = row.report
    ? (JSON.parse(row.report) as ReviewReport)
    : null;

  if (row.status !== "completed" || !report) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div
          className="rounded-[var(--r-md)] px-5 py-4 text-sm"
          style={{
            background: "var(--s-container)",
            color: "var(--on-surface-variant)",
          }}
        >
          This review is {row.status}. Once it completes, the report will
          appear here.
        </div>
      </main>
    );
  }

  const isUnable = report.verdict === "unable_to_evaluate";
  const caseStudies = report.caseStudies ?? [];
  const adminView = await isAdmin();
  const overall = overallScoreFromScores(report.scores);
  const homepageScore = Math.round(
    (report.homepage.reflectsProductDesigner.score +
      report.homepage.uxClarity.score) /
      2,
  );

  // Sidebar nav — Summary group + Breakdown group.
  const navGroups: NavGroup[] = [
    {
      label: "Summary",
      items: [
        { id: "signal", name: "Current signal", icon: <Target className="size-[15px]" /> },
        { id: "working", name: "What's working", icon: <Check className="size-[15px]" /> },
        { id: "lever", name: "Growth lever", icon: <Zap className="size-[15px]" /> },
        { id: "actions", name: "Next actions", icon: <List className="size-[15px]" /> },
      ],
    },
    {
      label: "Breakdown",
      items: [
        { id: "scores", name: "Score breakdown", score: overall },
        { id: "homepage", name: "Homepage", score: homepageScore },
        ...caseStudies.map((cs, i) => ({
          id: cs.id || `cs-${i}`,
          name: cs.name,
          score: cs.overallScore,
        })),
        ...(report.redFlags.length > 0
          ? [{ id: "risks", name: "Review risks" }]
          : []),
        { id: "feedback", name: "Give feedback" },
      ],
    },
  ];

  return (
    <div style={PEACH_TOKENS as React.CSSProperties}>
      <ScrollProgress />
      <ReviewHeader
        portfolioUrl={report.portfolioUrl}
        createdAt={row.createdAt}
        reviewId={id}
      />
      <div
        className="mx-auto w-full px-4 pb-16 sm:px-6"
        style={{ maxWidth: 1240 }}
      >
        <div
          className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]"
          style={{
            // Paint the sidebar column via gradient so it fills the whole card
            // height regardless of the sticky aside's fixed height.
            background:
              "linear-gradient(to right, var(--sidebar-bg) 0, var(--sidebar-bg) 260px, var(--doc-bg) 260px, var(--doc-bg) 100%)",
            border: "1px solid var(--rule)",
            borderRadius: 20,
            boxShadow: "0 24px 60px -32px rgba(74, 46, 20, 0.28)",
            // `clip` (not `hidden`) trims the border-radius without creating a
            // scroll container — so the sticky sidebar can track the viewport.
            overflow: "clip",
          }}
        >
          <div>
            <SidebarNav groups={navGroups} />
          </div>
          <main className="min-w-0">
            <div className="mx-auto max-w-[800px] px-6 pt-12 pb-24 sm:px-10 sm:pt-16">
              {report.homepage?.screenshotPath && (
                <BrowserShot
                  src={report.homepage.screenshotPath}
                  url={report.portfolioUrl}
                />
              )}
              <Hero
                eyebrow="Current signal"
                headline={report.currentSignal || "Portfolio review"}
                body={report.summary}
              />

              <Spacer />
              <WorkingGrid items={report.topStrengths} />

              <Spacer />
              <GrowthLeverCallout text={report.mainGrowthLever} />

              <Spacer />
              <ActionStack items={report.priorityActionPlan ?? []} />

              {!isUnable && (
                <>
                  <Spacer />
                  <ScoreBreakdown scores={report.scores} />
                </>
              )}

              {report.homepage && (
                <>
                  <Spacer />
                  <HomepageBlock
                    homepage={report.homepage}
                    portfolioUrl={report.portfolioUrl}
                  />
                </>
              )}

              {caseStudies.map((cs) => (
                <div key={cs.id}>
                  <Spacer />
                  <CaseStudyBlock study={cs} />
                </div>
              ))}

              {report.redFlags.length > 0 && (
                <>
                  <Spacer />
                  <RisksList
                    flags={report.redFlags}
                    intro="What a reviewer might notice or stop on. Useful context — not a judgment of you as a designer."
                  />
                </>
              )}

              {adminView && !isUnable && (
                <>
                  <Spacer />
                  <InternalContextAdmin report={report} />
                </>
              )}

              <Spacer />
              <ClosingCard
                closing={report.closingNote}
                confidence={confidenceSentence(report)}
              />

              <Spacer />
              <FeedbackSection reviewId={row.id} />

              {report.evaluatorNote && (
                <div
                  className="mt-10 rounded-[var(--r-lg)] px-5.5 py-4.5"
                  style={{
                    background: "var(--s-container)",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  {report.evaluatorNote}
                </div>
              )}

              <Footer
                portfolioUrl={report.portfolioUrl}
                createdAt={row.createdAt}
              />
            </div>
          </main>
        </div>
      </div>
      <FeedbackFab />
    </div>
  );
}

/**
 * Peach-tone reskin — overrides M3 tokens locally so the whole review-page
 * subtree (topbar, sidebar, cards, chips) picks up the homepage palette
 * without editing every leaf component.
 */
const PEACH_TOKENS = {
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
  // Strong = warm olive, Good = caramel, Developing = amber, Needs work = rust.
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

  // Feedback pop — swap pink for warm coral that reads on peach.
  "--pop-pink": "#F5A88A",
  "--pop-pink-ink": "#5C1E0C",

  background: "#FDDDBB",
  color: "#111111",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  minHeight: "100vh",
};

/**
 * Coda-style browser frame around the scanned portfolio homepage.
 * Traffic-light dots + URL pill on top, screenshot below, big soft shadow.
 */
function BrowserShot({ src, url }: { src: string; url: string }) {
  const readableUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="relative mb-12 select-none" aria-hidden="true">
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          background: "#FFFFFF",
          border: "1px solid var(--ink)",
          // Hard-edged solid ink drop shadow — Coda-style.
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
            style={{
              width: 11,
              height: 11,
              borderRadius: 999,
              background: "#F17161",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: 999,
              background: "#F2BD41",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: 999,
              background: "#61C554",
              display: "inline-block",
            }}
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

      {/* Flames escaping the bottom-right corner of the browser card. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fire.svg"
        alt=""
        style={{
          position: "absolute",
          right: -36,
          bottom: -30,
          width: 200,
          height: 200,
          maxWidth: "none",
          maxHeight: "none",
          pointerEvents: "none",
          zIndex: 3,
          transform: "rotate(6deg)",
        }}
      />
    </div>
  );
}

function ReviewHeader({
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
      className="mx-auto flex w-full items-center gap-4 px-6 sm:px-10"
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
          Visit site
        </a>
        <a
          href={`/r/${reviewId}/download`}
          download
          className="inline-flex items-center gap-2 whitespace-nowrap"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#FFFFFF",
            background: "var(--ink)",
            border: "1.5px solid var(--ink)",
            borderRadius: 10,
            padding: "9px 16px",
            textDecoration: "none",
          }}
        >
          <Download className="size-4" />
          Export
        </a>
      </div>
    </header>
  );
}

function Spacer() {
  return <div className="mt-13" style={{ marginTop: 52 }} />;
}

function Footer({
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

function InternalContextAdmin({ report }: { report: ReviewReport }) {
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
          <dt
            className="text-xs"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Reads as
          </dt>
          <dd className="font-medium">
            {SENIORITY_LABEL[report.inferredSeniority]}
          </dd>
        </div>
        <div>
          <dt
            className="text-xs"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Reviewer position
          </dt>
          <dd className="font-medium">{VERDICT_LABEL[report.verdict]}</dd>
        </div>
        {report.confidenceLevel && (
          <div>
            <dt
              className="text-xs"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Confidence
            </dt>
            <dd className="font-medium capitalize">{report.confidenceLevel}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function confidenceSentence(report: ReviewReport): string | undefined {
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
