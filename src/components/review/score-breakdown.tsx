import { Info } from "lucide-react";
import { RatingChip } from "./rating-chip";
import { HeatMeter } from "./heat-meter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { overviewRows, overallScoreFromScores } from "@/lib/review-view";
import type { OverviewScores } from "@/lib/types";

/**
 * Score Breakdown — compact table: overall row + 6 category rows.
 */
export function ScoreBreakdown({
  scores,
  summary,
}: {
  scores: OverviewScores;
  /** Optional "what a hiring manager can expect" paragraph. */
  summary?: { label: string; text: string };
}) {
  const rows = overviewRows(scores);
  const overall = overallScoreFromScores(scores);

  return (
    <section
      id="scores"
      className="reveal"
      style={{ scrollMarginTop: 96 }}
    >
      <div className="mb-3">
        <span className="m3-eyebrow">Score breakdown</span>
        <h2
          className="mt-1.5 text-[20px] font-semibold leading-tight tracking-tight"
          style={{ color: "var(--on-surface)" }}
        >
          Six evaluation categories
        </h2>
      </div>

      <div
        className="overflow-hidden"
        style={{
          background: "var(--s-container)",
          borderRadius: "var(--r-md)",
          border: "1px solid var(--outline-variant)",
        }}
      >
        {/* Overall row */}
        <div
          className="grid grid-cols-[1fr_auto] items-center gap-x-4 px-4 py-2.5"
          style={{
            background: "var(--m3-secondary-container)",
            color: "var(--m3-on-secondary-container)",
          }}
        >
          <div className="text-[11px] font-bold tracking-widest uppercase">
            Overall assessment
          </div>
          <div className="flex items-center gap-2">
            <HeatMeter score={overall} size="sm" />
            <RatingChip score={overall} size="sm" />
          </div>
        </div>

        {summary && (
          <div
            className="border-t px-4 py-3"
            style={{ borderColor: "var(--outline-variant)" }}
          >
            <p
              className="text-[13.5px] leading-[1.55]"
              style={{ color: "var(--on-surface)" }}
            >
              {summary.text}
            </p>
          </div>
        )}

        {/* Per-category rows */}
        {rows.map((s) => (
          <div
            key={s.key}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 border-t px-4 py-2.5 transition-colors hover:bg-[var(--s-high)]"
            style={{ borderColor: "var(--outline-variant)" }}
          >
            <div className="flex items-center gap-1.5">
              <span
                className="text-[14px] font-semibold tracking-tight"
                style={{ color: "var(--on-surface)" }}
              >
                {s.name}
              </span>
              <Tooltip>
                <TooltipTrigger
                  aria-label={`What this measures: ${s.name}`}
                  className="-m-1 inline-flex p-1"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  <Info className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-normal text-left leading-relaxed">
                  {s.desc}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="justify-self-end">
              <RatingChip score={s.score} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
