import { notFound } from "next/navigation";
import { loadReview, caseStudyId } from "@/lib/review-data";
import { BrowserShot } from "@/components/review/review-chrome";
import { HomepageBlock } from "@/components/review/homepage-block";
import {
  ReviewPager,
  buildPagerLinks,
} from "@/components/review/review-pager";

/**
 * Homepage deep-dive page. The BrowserShot screenshot + the HomepageBlock
 * (criteria, detected issues, recommendations). Sits as tab 2 of the
 * review walk-through.
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
      {report.homepage?.screenshotPath && (
        <BrowserShot
          src={report.homepage.screenshotPath}
          url={report.portfolioUrl}
        />
      )}
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
