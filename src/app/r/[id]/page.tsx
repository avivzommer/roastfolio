import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { loadReview, caseStudyId } from "@/lib/review-data";
import { Hero } from "@/components/review/hero";
import { GrowthLeverCallout } from "@/components/review/growth-lever";
import { SummaryActions } from "@/components/review/summary-actions";
import { ScoreBreakdown } from "@/components/review/score-breakdown";
import { RisksList } from "@/components/review/risks-list";
import { FeedbackSection } from "@/components/review/feedback-section";
import { FeedbackFab } from "@/components/review/feedback-fab";
import { SectionHeader } from "@/components/review/section-header";
import {
  Spacer,
  BrowserShot,
  InternalContextAdmin,
  confidenceSentence,
} from "@/components/review/review-chrome";
import {
  ReviewPager,
  buildPagerLinks,
} from "@/components/review/review-pager";

/**
 * Summary page — the entry point of a review. Three sections only:
 *
 *   1. The read — BrowserShot + currentSignal + 2-sentence summary.
 *   2. The move — growth lever (diagnosis) + Priority 1 action card
 *      + Priority 2 / 3 compact chips.
 *   3. The context — Score breakdown + Review risks + confidence line.
 *
 * Feedback sits below as a utility card, not called out as a section.
 * Homepage deep-dive lives at `/r/[id]/homepage`; each case study at
 * `/r/[id]/case/[csId]`. Chrome (topbar, tabs, footer) lives in the
 * shared `/r/[id]/layout.tsx`.
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

  const confidence = confidenceSentence(report);

  return (
    <>
      {/* Section 1 — The read.
          BrowserShot is the first visual anchor; Hero carries the signal
          and the viewing-experience summary. No rating chip here —
          verdict lives in Section 3. */}
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

      {/* Section 2 — The move.
          Growth lever (diagnosis) is immediately followed by the Priority 1
          action card. P2 and P3 collapse to compact chips below — expandable
          inline when the designer wants more. */}
      <SectionHeader
        eyebrow="The move"
        title="The one thing to work on"
      />
      <GrowthLeverCallout text={report.mainGrowthLever} />
      <div className="mt-4">
        <SummaryActions items={report.priorityActionPlan ?? []} />
      </div>

      <Spacer />

      {/* Section 3 — The context.
          Score breakdown, review risks (if any), and the confidence line
          grouped together as the back-up data a designer scans after the
          move. Confidence sits as a one-line footer at the bottom. */}
      {!isUnable && (
        <section id="context" style={{ scrollMarginTop: 96 }}>
          <SectionHeader
            eyebrow="The context"
            title="Scores, risks, and confidence"
          />
          <ScoreBreakdown scores={report.scores} />
          {report.redFlags.length > 0 && (
            <div className="mt-8">
              <h3
                className="mb-4 text-[11px] font-bold tracking-wider uppercase"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Review risks
              </h3>
              <RisksList
                flags={report.redFlags}
                intro="What a reviewer might notice or stop on. Useful context — not a judgment of you as a designer."
              />
            </div>
          )}
          {confidence && (
            <p
              className="mt-8 border-t pt-5 text-[13.5px] leading-[1.55]"
              style={{
                color: "var(--on-surface-variant)",
                borderColor: "var(--rule)",
              }}
            >
              {confidence}
            </p>
          )}
        </section>
      )}

      {adminView && !isUnable && <InternalContextAdmin report={report} />}

      {/* Feedback — utility box, not a numbered section. */}
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
