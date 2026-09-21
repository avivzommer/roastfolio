import { Home, X, Pencil } from "lucide-react";
import type { HomepageEvaluation } from "@/lib/types";
import { HOMEPAGE_ISSUE_LABEL, HOMEPAGE_ISSUE_KEYS_ORDER } from "./homepage-issue-keys";
import { RatingChip } from "./rating-chip";
import { CriteriaGroup } from "./criteria-group";
import { ShotPreview } from "./shot-preview";
import { homepageCriteria, readableHost } from "@/lib/review-view";

/**
 * Homepage review block: screenshot → criteria → detected issues → change list.
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
    <section
      id="homepage"
      className="reveal"
      style={{ scrollMarginTop: 96 }}
    >
      <div
        className="overflow-hidden"
        style={{
          background: "var(--s-lowest)",
          borderRadius: "var(--r-xl)",
          boxShadow: "var(--e1)",
        }}
      >
        {homepage.screenshotPath && (
          <ShotPreview
            src={homepage.screenshotPath}
            alt="Homepage"
            caption={readableHost(portfolioUrl)}
          />
        )}
        <div className="flex items-start gap-4 px-6 py-6">
          <span
            className="flex size-12 flex-none items-center justify-center rounded-full"
            style={{
              background: "var(--m3-secondary-container)",
              color: "var(--m3-on-secondary-container)",
            }}
          >
            <Home className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-[11px] font-bold tracking-widest uppercase"
              style={{ color: "var(--m3-primary)" }}
            >
              Homepage analysis
            </div>
            <h3
              className="mt-2 text-[22px] font-bold leading-tight tracking-tight"
              style={{ color: "var(--on-surface)" }}
            >
              Homepage
            </h3>
          </div>
          <RatingChip score={overall} />
        </div>

        <CriteriaGroup criteria={criteria} label="Homepage criteria" />

        {issuesPresent.length > 0 && (
          <div className="flex flex-col gap-3.5 px-6 pt-2 pb-1">
            {issuesPresent.map((k) => {
              const issue = homepage.issues[k];
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
        )}

        {recs.length > 0 && (
          <div className="mt-4.5 px-6 pt-6 pb-6">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex size-9 flex-none items-center justify-center rounded-full"
                style={{
                  background: "var(--m3-primary)",
                  color: "var(--m3-on-primary)",
                }}
              >
                <Pencil className="size-3" />
              </span>
              <h4
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: "var(--m3-primary)" }}
              >
                What to change first
              </h4>
            </div>
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
          </div>
        )}
      </div>
    </section>
  );
}
