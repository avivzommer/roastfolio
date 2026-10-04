import { X, Pencil } from "lucide-react";
import type { HomepageEvaluation } from "@/lib/types";
import { HOMEPAGE_ISSUE_LABEL, HOMEPAGE_ISSUE_KEYS_ORDER } from "./homepage-issue-keys";
import { RatingChip } from "./rating-chip";
import { CriteriaGroup } from "./criteria-group";
import { ShotPreview } from "./shot-preview";
import { SectionHeader } from "./section-header";
import { homepageCriteria, readableHost } from "@/lib/review-view";
import { Spacer } from "./review-chrome";

/**
 * Homepage review block, laid out as a sequence of top-level sections.
 *
 * On the Homepage sub-page each section stands on its own — screenshot,
 * criteria breakdown, detected issues, recommendations — rather than
 * being crammed into one monolithic card. All sections render open; the
 * user already navigated to this page specifically.
 */
export function HomepageBlock({
  homepage,
  portfolioUrl,
}: {
  homepage: HomepageEvaluation;
  portfolioUrl: string;
}) {
  const criteria = homepageCriteria(homepage);
  const overall = Math.round(
    (homepage.reflectsProductDesigner.score + homepage.uxClarity.score) / 2,
  );
  const issuesPresent = HOMEPAGE_ISSUE_KEYS_ORDER.filter(
    (k) => homepage.issues[k]?.present,
  );
  const recs = homepage.recommendations ?? [];

  return (
    <>
      {/* Full-page scrollable screenshot — anchors the whole page. */}
      {homepage.screenshotPath && (
        <ShotPreview
          src={homepage.screenshotPath}
          alt="Homepage"
          caption={readableHost(portfolioUrl)}
        />
      )}

      <Spacer />

      {/* Section: scored criteria — reads-as-product-designer + UX clarity. */}
      <section id="homepage-criteria" style={{ scrollMarginTop: 96 }}>
        <SectionHeader
          eyebrow="What was checked"
          title="Homepage criteria"
          trailing={<RatingChip score={overall} />}
        />
        <CriteriaGroup criteria={criteria} />
      </section>

      {issuesPresent.length > 0 && (
        <>
          <Spacer />
          <section id="homepage-issues" style={{ scrollMarginTop: 96 }}>
            <SectionHeader
              eyebrow="What we noticed"
              title={`${issuesPresent.length} issue${issuesPresent.length === 1 ? "" : "s"} present`}
            />
            <div className="flex flex-col gap-3.5">
              {issuesPresent.map((k) => {
                // issuesPresent already filtered on `?.present`; `!` tells
                // TS the entry exists even though newer issue keys are
                // optional for backward-compat with historical reports.
                const issue = homepage.issues[k]!;
                return (
                  <div
                    key={k}
                    className="p-5"
                    style={{
                      background: "var(--s-low)",
                      borderRadius: "var(--r-lg)",
                    }}
                  >
                    <div className="flex items-center gap-3 text-[15.5px] font-bold">
                      <span
                        className="flex size-[30px] flex-none items-center justify-center rounded-full"
                        style={{
                          background: "var(--rt-needswork-bg)",
                          color: "var(--rt-needswork)",
                        }}
                      >
                        <X className="size-3" />
                      </span>
                      {HOMEPAGE_ISSUE_LABEL[k]}
                    </div>
                    <p
                      className="mt-2.5 text-sm leading-[1.55]"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      {issue.comment}
                    </p>
                    {issue.examples && issue.examples.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        {issue.examples.map((eg, j) => (
                          <div
                            key={j}
                            className="px-3.5 py-2.5 text-[12.5px] leading-[1.5]"
                            style={{
                              background: "var(--s-container)",
                              color: "var(--on-surface-variant)",
                              borderRadius: "var(--r-sm)",
                            }}
                          >
                            <span
                              className="font-semibold"
                              style={{ color: "var(--m3-primary)" }}
                            >
                              e.g.{" "}
                            </span>
                            {eg}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {recs.length > 0 && (
        <>
          <Spacer />
          <section id="homepage-recommendations" style={{ scrollMarginTop: 96 }}>
            <SectionHeader
              eyebrow="What to try"
              title="What to change first"
              trailing={
                <span
                  className="flex size-9 flex-none items-center justify-center rounded-full"
                  style={{
                    background: "var(--m3-primary)",
                    color: "var(--m3-on-primary)",
                  }}
                >
                  <Pencil className="size-3" />
                </span>
              }
            />
            <ol className="flex list-none flex-col gap-3.5 p-0">
              {recs.map((it, i) => (
                <li
                  key={i}
                  className="relative pl-10 text-[14.5px] leading-[1.6]"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  <span
                    className="absolute -top-0.5 left-0 grid size-7 place-items-center rounded-full text-[13px] font-bold"
                    style={{
                      background: "var(--m3-secondary-container)",
                      color: "var(--m3-on-secondary-container)",
                    }}
                  >
                    {i + 1}
                  </span>
                  {it}
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </>
  );
}
