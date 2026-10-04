import { ExternalLink, Eye, Check, ArrowUp, Pencil } from "lucide-react";
import type { CaseStudyEvaluation } from "@/lib/types";
import { RatingChip } from "./rating-chip";
import { CriteriaGroup } from "./criteria-group";
import { ShotPreview } from "./shot-preview";
import { SectionHeader } from "./section-header";
import { Spacer } from "./review-chrome";
import { caseStudyCriteria, readableHost } from "@/lib/review-view";

/**
 * Case Study review block, laid out as a sequence of top-level sections.
 *
 * On the case-study sub-page each block stands on its own — screenshot,
 * hero (name + summary + rating), scored criteria, strengths, what could
 * be stronger, reviewer-needs callout, and the recommended change — rather
 * than being crammed into one monolithic card. All sections render open.
 */
export function CaseStudyBlock({ study }: { study: CaseStudyEvaluation }) {
  const criteria = caseStudyCriteria(study);

  return (
    <>
      {study.screenshotPath && (
        <ShotPreview
          src={study.screenshotPath}
          alt={study.name}
          caption={readableHost(study.url)}
        />
      )}

      <Spacer />

      {/* Section: hero — name + rating + one-sentence summary. */}
      <section id="case-hero" style={{ scrollMarginTop: 96 }}>
        <SectionHeader
          eyebrow="Case study"
          title={study.name}
          trailing={<RatingChip score={study.overallScore} />}
        />
        {study.url && (
          <a
            href={study.url}
            target="_blank"
            rel="noreferrer"
            className="mb-4 inline-flex items-center gap-1.5 text-xs"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <ExternalLink className="size-3" />
            {readableHost(study.url)}
          </a>
        )}
        {study.summary && (
          <p
            className="mt-2 text-[16px] leading-[1.6]"
            style={{ color: "var(--on-surface)" }}
          >
            {study.summary}
          </p>
        )}
      </section>

      <Spacer />

      {/* Section: scored criteria. */}
      <section id="case-criteria" style={{ scrollMarginTop: 96 }}>
        <SectionHeader
          eyebrow="Scored criteria"
          title="Five dimensions"
        />
        <CriteriaGroup criteria={criteria} />
      </section>

      {study.strengths.length > 0 && (
        <>
          <Spacer />
          <section id="case-strengths" style={{ scrollMarginTop: 96 }}>
            <SectionHeader
              eyebrow="What's working"
              title={`${study.strengths.length} strength${study.strengths.length === 1 ? "" : "s"}`}
            />
            <Panel kind="pos" items={study.strengths} />
          </section>
        </>
      )}

      {study.weaknesses.length > 0 && (
        <>
          <Spacer />
          <section id="case-weaknesses" style={{ scrollMarginTop: 96 }}>
            <SectionHeader
              eyebrow="What could be stronger"
              title="Where to deepen"
            />
            <Panel kind="neg" items={study.weaknesses} />
          </section>
        </>
      )}

      {study.mainRisk && (
        <>
          <Spacer />
          <section id="case-risk" style={{ scrollMarginTop: 96 }}>
            <SectionHeader
              eyebrow="A reviewer may still need"
              title="One thing to understand"
            />
            <div
              className="flex gap-3.5 p-5"
              style={{
                background: "var(--rt-developing-bg)",
                borderRadius: "var(--r-lg)",
              }}
            >
              <span
                className="flex size-9 flex-none items-center justify-center rounded-full"
                style={{
                  background: "rgba(255,255,255,.55)",
                  color: "var(--rt-developing)",
                }}
              >
                <Eye className="size-3.5" />
              </span>
              <div
                className="text-sm leading-[1.55]"
                style={{ color: "#422a00" }}
              >
                {study.mainRisk}
              </div>
            </div>
          </section>
        </>
      )}

      {study.recommendedImprovements?.length > 0 && (
        <>
          <Spacer />
          <section id="case-recommendations" style={{ scrollMarginTop: 96 }}>
            <SectionHeader
              eyebrow="What to try"
              title="Concrete changes"
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
              {study.recommendedImprovements.map((it, i) => (
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

function Panel({
  kind,
  items,
}: {
  kind: "pos" | "neg";
  items: string[];
}) {
  const Icon = kind === "pos" ? Check : ArrowUp;
  const iconBg =
    kind === "pos" ? "var(--rt-strong-bg)" : "var(--m3-secondary-container)";
  const iconColor = kind === "pos" ? "var(--rt-strong)" : "var(--m3-primary)";

  return (
    <div
      className="p-5"
      style={{
        background: "var(--s-low)",
        borderRadius: "var(--r-lg)",
      }}
    >
      <ul className="flex list-none flex-col gap-3 p-0">
        {items.map((it, i) => (
          <li
            key={i}
            className="relative flex items-start gap-3 text-sm leading-[1.55]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <span
              className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full"
              style={{ background: iconBg, color: iconColor }}
            >
              <Icon className="size-2.5" />
            </span>
            <span className="min-w-0 flex-1">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
