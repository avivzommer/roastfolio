import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { loadReview, caseStudyId } from "@/lib/review-data";
import { Hero } from "@/components/review/hero";
import { WorkingGrid } from "@/components/review/working-grid";
import { GrowthLeverCallout } from "@/components/review/growth-lever";
import { ActionStack } from "@/components/review/action-stack";
import { ScoreBreakdown } from "@/components/review/score-breakdown";
import { RisksList } from "@/components/review/risks-list";
import { ClosingCard } from "@/components/review/closing-card";
import { FeedbackSection } from "@/components/review/feedback-section";
import { FeedbackFab } from "@/components/review/feedback-fab";
import {
  Spacer,
  InternalContextAdmin,
  confidenceSentence,
} from "@/components/review/review-chrome";
import {
  ReviewPager,
  buildPagerLinks,
} from "@/components/review/review-pager";

/**
 * Summary page — the entry point of a review. Carries the hero signal,
 * strengths, growth lever, next-best actions, score breakdown, review
 * risks, closing calibration, and the feedback form.
 *
 * The homepage deep-dive lives at `/r/[id]/homepage`; each case study at
 * `/r/[id]/case/[csId]`. Chrome (topbar, tabs, footer) is shared via
 * `/r/[id]/layout.tsx`.
 */
export default async function ReviewSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loaded = await loadReview(id);
  if (!loaded) notFound();

  const { report, status } = loaded;

  if (status !== "completed" || !report) {
    return (
      <div
        className="rounded-[var(--r-md)] px-5 py-4 text-sm"
        style={{
          background: "var(--s-container)",
          color: "var(--on-surface-variant)",
        }}
      >
        This review is {status}. Once it completes, the report will appear here.
      </div>
    );
  }

  const isUnable = report.verdict === "unable_to_evaluate";
  const caseStudies = report.caseStudies ?? [];
  const adminView = await isAdmin();

  const pagerCases = caseStudies.map((cs, i) => ({
    id: caseStudyId(cs, i),
    name: cs.name,
  }));
  const pager = buildPagerLinks({
    reviewId: id,
    currentPage: { kind: "summary" },
    cases: pagerCases,
  });

  return (
    <>
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
          <section id="scores" style={{ scrollMarginTop: 96 }}>
            <div className="mb-3">
              <span className="m3-eyebrow">Score breakdown</span>
              <h2
                className="mt-1.5 text-[20px] font-semibold leading-tight tracking-tight"
                style={{ color: "var(--on-surface)" }}
              >
                Six evaluation categories
              </h2>
            </div>
            <ScoreBreakdown scores={report.scores} />
          </section>
        </>
      )}

      {report.redFlags.length > 0 && (
        <>
          <Spacer />
          <section id="risks" style={{ scrollMarginTop: 96 }}>
            <div className="mb-5">
              <span className="m3-eyebrow">Review risks</span>
              <h2
                className="mt-1.5 text-[20px] font-semibold leading-tight tracking-tight"
                style={{ color: "var(--on-surface)" }}
              >
                What a reviewer might stop on
              </h2>
            </div>
            <RisksList
              flags={report.redFlags}
              intro="What a reviewer might notice or stop on. Useful context — not a judgment of you as a designer."
            />
          </section>
        </>
      )}

      {adminView && !isUnable && <InternalContextAdmin report={report} />}

      <Spacer />
      <ClosingCard
        closing={report.closingNote}
        confidence={confidenceSentence(report)}
      />

      <Spacer />
      <FeedbackSection reviewId={id} />

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

      <ReviewPager next={pager.next} />
      <FeedbackFab />
    </>
  );
}
