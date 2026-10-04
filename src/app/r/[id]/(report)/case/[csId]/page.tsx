import { notFound } from "next/navigation";
import { loadReview, caseStudyId } from "@/lib/review-data";
import { CaseStudyBlock } from "@/components/review/case-study-block";
import {
  ReviewPager,
  buildPagerLinks,
} from "@/components/review/review-pager";

/**
 * One case study per page. Resolves the dynamic `csId` segment by matching
 * it against `report.caseStudies[].id` (falling back to `cs-${index+1}`),
 * then renders the CaseStudyBlock + the shared pager.
 */
export default async function ReviewCaseStudyPage({
  params,
}: {
  params: Promise<{ id: string; csId: string }>;
}) {
  const { id, csId } = await params;
  const loaded = await loadReview(id);
  if (!loaded) notFound();
  const { report } = loaded;
  if (!report) notFound();

  const caseStudies = report.caseStudies ?? [];
  const index = caseStudies.findIndex(
    (cs, i) => caseStudyId(cs, i) === csId,
  );
  if (index === -1) notFound();
  const study = caseStudies[index];

  const pagerCases = caseStudies.map((cs, i) => ({
    id: caseStudyId(cs, i),
    name: cs.name,
  }));
  const pager = buildPagerLinks({
    reviewId: id,
    currentPage: { kind: "case", index },
    cases: pagerCases,
  });

  return (
    <>
      <CaseStudyBlock study={study} />
      <ReviewPager prev={pager.prev} next={pager.next} />
    </>
  );
}
