import { notFound } from "next/navigation";
import { loadReview, caseStudyId } from "@/lib/review-data";
import {
  PEACH_TOKENS,
  ReviewHeader,
  Footer,
} from "@/components/review/review-chrome";
import { ScrollProgress } from "@/components/review/scroll-progress";
import { ReviewTabs } from "@/components/review/review-tabs";

/**
 * Shared chrome around every review sub-page: Summary (`/r/[id]`),
 * Homepage (`/r/[id]/homepage`), and each case study
 * (`/r/[id]/case/[csId]`).
 *
 * Owns the peach-token subtree, the top-of-page scroll-progress bar,
 * the topbar, the section tab rail, and the shared card shell and
 * Footer that wrap every page's own content column.
 *
 * Data fetching is deduped via React's `cache()` in loadReview — the
 * nested page.tsx that also calls `loadReview(id)` will hit the same
 * cached response within one request.
 */
export default async function ReviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loaded = await loadReview(id);
  if (!loaded) notFound();

  const report = loaded.report;

  // Only the Summary page is useful if the review hasn't completed or
  // failed to produce a report. Let that page handle the fallback copy;
  // suppress the tab bar here when there's nothing to tab between.
  const caseStudies =
    report?.caseStudies?.map((cs, i) => ({
      id: caseStudyId(cs, i),
      name: cs.name,
    })) ?? [];

  return (
    <div style={PEACH_TOKENS as React.CSSProperties}>
      <ScrollProgress />
      <ReviewHeader
        portfolioUrl={loaded.portfolioUrl}
        createdAt={loaded.createdAt}
        reviewId={id}
      />
      <div
        className="mx-auto w-full px-4 pb-16 sm:px-6"
        style={{ maxWidth: 1240 }}
      >
        <div
          style={{
            border: "1px solid var(--rule)",
            borderRadius: 20,
            boxShadow: "0 24px 60px -32px rgba(74, 46, 20, 0.28)",
            overflow: "clip",
            background: "var(--doc-bg)",
          }}
        >
          <div className="mx-auto max-w-[920px] px-4 pt-6 pb-10 sm:px-10 sm:pt-8 sm:pb-16">
            {report && (
              <ReviewTabs reviewId={id} cases={caseStudies} />
            )}
            <div className="mt-8">{children}</div>
            <Footer
              portfolioUrl={loaded.portfolioUrl}
              createdAt={loaded.createdAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
