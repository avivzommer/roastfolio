import { Layers, ExternalLink, Eye, Check, ArrowUp, Pencil } from "lucide-react";
import type { CaseStudyEvaluation } from "@/lib/types";
import { RatingChip } from "./rating-chip";
import { CriteriaGroup } from "./criteria-group";
import { ShotPreview } from "./shot-preview";
import { caseStudyCriteria, readableHost } from "@/lib/review-view";

/**
 * Case Study review block: screenshot → metadata header → summary → criteria
 * → strengths / what can be strengthened → reviewer-needs callout → changes.
 */
export function CaseStudyBlock({ study }: { study: CaseStudyEvaluation }) {
  const criteria = caseStudyCriteria(study);

  return (
    <section
      id={study.id || `cs-${Math.random().toString(36).slice(2, 8)}`}
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
        {study.screenshotPath && (
          <ShotPreview
            src={study.screenshotPath}
            alt={study.name}
            caption={readableHost(study.url)}
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
            <Layers className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="text-[11px] font-bold tracking-widest uppercase"
              style={{ color: "var(--m3-primary)" }}
            >
              Case study
            </div>
            <h3
              className="mt-2 text-[22px] font-bold leading-tight tracking-tight"
              style={{ color: "var(--on-surface)" }}
            >
              {study.name}
            </h3>
            {study.url && (
              <a
                href={study.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs"
                style={{ color: "var(--on-surface-variant)" }}
              >
                <ExternalLink className="size-3" />
                {readableHost(study.url)}
              </a>
            )}
          </div>
          <RatingChip score={study.overallScore} />
        </div>

        {study.summary && (
          <div
            className="px-6 pb-5.5 text-base leading-[1.6]"
            style={{ color: "var(--on-surface)" }}
          >
            {study.summary}
          </div>
        )}

        <CriteriaGroup criteria={criteria} />

        {(study.strengths.length > 0 || study.weaknesses.length > 0) && (
          <div className="grid gap-3.5 px-6 pt-2 pb-6 sm:grid-cols-2">
            {study.strengths.length > 0 && (
              <Panel
                kind="pos"
                title="Strengths"
                items={study.strengths}
              />
            )}
            {study.weaknesses.length > 0 && (
              <Panel
                kind="neg"
                title="What can be strengthened"
                items={study.weaknesses}
              />
            )}
          </div>
        )}

        {study.mainRisk && (
          <div
            className="mx-6 mb-3 flex gap-3.5 p-5"
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
            <div>
              <div
                className="text-[11px] font-bold tracking-wider uppercase"
                style={{ color: "var(--rt-developing)" }}
              >
                What a reviewer may still need to understand
              </div>
              <div
                className="mt-1 text-sm leading-[1.5]"
                style={{ color: "#422a00" }}
              >
                {study.mainRisk}
              </div>
            </div>
          </div>
        )}

        {study.recommendedImprovements?.length > 0 && (
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
                One concrete change to try
              </h4>
            </div>
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
          </div>
        )}
      </div>
    </section>
  );
}

function Panel({
  kind,
  title,
  items,
}: {
  kind: "pos" | "neg";
  title: string;
  items: string[];
}) {
  const Icon = kind === "pos" ? Check : ArrowUp;
  const iconBg =
    kind === "pos" ? "var(--rt-strong-bg)" : "var(--m3-secondary-container)";
  const iconColor = kind === "pos" ? "var(--rt-strong)" : "var(--m3-primary)";
  const dotColor =
    kind === "pos" ? "var(--rt-strong-dot)" : "var(--m3-primary)";

  return (
    <div
      className="p-5"
      style={{
        background: "var(--s-low)",
        borderRadius: "var(--r-lg)",
      }}
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <span
          className="flex size-8 flex-none items-center justify-center rounded-full"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon className="size-3" />
        </span>
        <h4
          className="text-xs font-bold tracking-wider uppercase"
          style={{ color: iconColor }}
        >
          {title}
        </h4>
      </div>
      <ul className="flex list-none flex-col gap-3 p-0">
        {items.map((it, i) => (
          <li
            key={i}
            className="relative pl-5.5 text-sm leading-[1.5]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <span
              className="absolute top-[7px] left-0 size-2 rounded-full"
              style={{ background: dotColor }}
            />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
