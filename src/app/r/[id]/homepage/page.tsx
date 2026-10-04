import { notFound } from "next/navigation";
import { loadReview, caseStudyId } from "@/lib/review-data";
import { HomepageBlock } from "@/components/review/homepage-block";
import {
  ReviewPager,
  buildPagerLinks,
} from "@/components/review/review-pager";

/**
 * Homepage deep-dive page. HomepageBlock now renders as a sequence of
 * open sections (shot preview, criteria, issues, recommendations) rather
 * than one monolithic card.
 *
 * The Coda-style BrowserShot mockup lives on the Summary page as the
 * review's overall visual anchor; this page shows the clean full-page
 * screenshot via `ShotPreview` inside HomepageBlock.
 */
export default async function ReviewHomepagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loaded = await loadReview(id);
  if (!loaded) notFound();
  const { report } = loaded;
  if (!report) notFound();

  const caseStudies = report.caseStudies ?? [];
  const pagerCases = caseStudies.map((cs, i) => ({
    id: caseStudyId(cs, i),
    name: cs.name,
  }));
  const pager = buildPagerLinks({
    reviewId: id,
    currentPage: { kind: "homepage" },
    cases: pagerCases,
  });

  return (
    <>
      {report.homepage && (
        <HomepageBlock
          homepage={report.homepage}
          portfolioUrl={report.portfolioUrl}
        />
      )}
      <ReviewPager prev={pager.prev} next={pager.next} />
    </>
  );
}
