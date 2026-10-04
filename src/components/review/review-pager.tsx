import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PagerLink {
  href: string;
  label: string;
  /** Short name of the section — shown under the "Previous"/"Next" chrome. */
  sectionName: string;
}

/**
 * Linear "Previous / Next" pager at the bottom of each review sub-page.
 * Mirrors the slideshow metaphor from the designer's post that inspired
 * splitting the review into pages.
 */
export function ReviewPager({
  prev,
  next,
}: {
  prev?: PagerLink;
  next?: PagerLink;
}) {
  return (
    <div
      className="mt-16 flex flex-col items-stretch justify-between gap-3 border-t pt-8 sm:flex-row sm:items-center"
      style={{ borderColor: "var(--rule)" }}
    >
      {prev ? (
        <Link
          href={prev.href}
          className="group inline-flex items-center gap-3 rounded-[var(--r-lg)] px-4 py-3 transition-colors sm:min-w-0 sm:flex-1 sm:max-w-[48%]"
          style={{
            background: "var(--s-lowest)",
            boxShadow: "var(--e1)",
          }}
        >
          <ChevronLeft
            className="size-5 flex-none transition-transform group-hover:-translate-x-0.5"
            style={{ color: "var(--on-surface-variant)" }}
          />
          <div className="min-w-0 flex-1 text-left">
            <div
              className="text-[10.5px] font-bold tracking-widest uppercase"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {prev.label}
            </div>
            <div
              className="truncate text-[15px] font-semibold"
              style={{ color: "var(--on-surface)" }}
            >
              {prev.sectionName}
            </div>
          </div>
        </Link>
      ) : (
        <div className="sm:flex-1" aria-hidden />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group inline-flex items-center gap-3 rounded-[var(--r-lg)] px-4 py-3 transition-colors sm:min-w-0 sm:flex-1 sm:max-w-[48%] sm:justify-end"
          style={{
            background: "var(--ink)",
            color: "var(--white, #FFFFFF)",
            boxShadow: "var(--e1)",
          }}
        >
          <div className="min-w-0 flex-1 text-left sm:text-right">
            <div
              className="text-[10.5px] font-bold tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.72)" }}
            >
              {next.label}
            </div>
            <div className="truncate text-[15px] font-semibold">
              {next.sectionName}
            </div>
          </div>
          <ChevronRight
            className="size-5 flex-none transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      ) : (
        <div className="sm:flex-1" aria-hidden />
      )}
    </div>
  );
}

/**
 * Build the prev/next hrefs for a given page type, based on which case
 * studies exist in the report. Keeps the walking order consistent across
 * Summary → Homepage → Case 1 → Case 2 → Case 3.
 */
export function buildPagerLinks(args: {
  reviewId: string;
  currentPage:
    | { kind: "summary" }
    | { kind: "homepage" }
    | { kind: "case"; index: number };
  cases: Array<{ id: string; name: string }>;
}): { prev?: PagerLink; next?: PagerLink } {
  const { reviewId, currentPage, cases } = args;

  const summary: PagerLink = {
    href: `/r/${reviewId}`,
    label: "Previous",
    sectionName: "Summary",
  };
  const homepage: PagerLink = {
    href: `/r/${reviewId}/homepage`,
    label: "Next",
    sectionName: "Homepage",
  };
  const casePagerLink = (i: number, direction: "prev" | "next"): PagerLink => ({
    href: `/r/${reviewId}/case/${cases[i].id}`,
    label: direction === "prev" ? "Previous" : "Next",
    sectionName: cases[i].name,
  });

  if (currentPage.kind === "summary") {
    return {
      next: { ...homepage, label: "Next" },
    };
  }
  if (currentPage.kind === "homepage") {
    return {
      prev: { ...summary, label: "Previous" },
      next:
        cases.length > 0
          ? casePagerLink(0, "next")
          : undefined,
    };
  }
  // case page
  const i = currentPage.index;
  const prev =
    i === 0
      ? { ...homepage, label: "Previous" }
      : casePagerLink(i - 1, "prev");
  const next = i + 1 < cases.length ? casePagerLink(i + 1, "next") : undefined;
  return { prev, next };
}
