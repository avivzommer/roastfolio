"use client";

import { useState } from "react";
import { ChevronRight, ChevronUp, ChevronDown, Info } from "lucide-react";
import type { Criterion } from "@/lib/review-view";
import { RatingChip } from "./rating-chip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Collapsible scored criteria — used inside Homepage and Case Study blocks.
 * Each row shows the criterion name + rating chip; expanding reveals the
 * question being evaluated and the agent's answer.
 */
export function CriteriaGroup({
  criteria,
  label = "Scored criteria",
}: {
  criteria: Criterion[];
  label?: string;
}) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());
  const allOpen = openSet.size === criteria.length;
  const toggle = (i: number) =>
    setOpenSet((p) => {
      const n = new Set(p);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const toggleAll = () =>
    setOpenSet(allOpen ? new Set() : new Set(criteria.map((_, i) => i)));

  return (
    <div>
      <div className="flex items-center justify-between px-6 pt-2 pb-2">
        <span
          className="text-[11px] font-bold tracking-widest uppercase whitespace-nowrap"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-1.5 rounded-full border-0 px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap"
          style={{
            background: "var(--s-container)",
            color: "var(--m3-primary)",
          }}
        >
          {allOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      {criteria.map((c, i) => (
        <CriterionRow
          key={i}
          c={c}
          open={openSet.has(i)}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  );
}

function CriterionRow({
  c,
  open,
  onToggle,
}: {
  c: Criterion;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-t" style={{ borderColor: "var(--outline-variant)" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={open}
        className="grid w-full cursor-pointer select-none grid-cols-[22px_1fr_auto] items-center gap-3.5 px-6 py-4 text-left transition-colors hover:bg-[var(--s-low)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--m3-primary)]"
      >
        <ChevronRight
          className={cn(
            "size-4 transition-transform",
            open && "rotate-90",
          )}
          style={{ color: open ? "var(--m3-primary)" : "var(--on-surface-variant)" }}
        />
        <span className="flex items-center gap-1.5">
          <span
            className="text-[15.5px] font-semibold"
            style={{ color: "var(--on-surface)" }}
          >
            {c.name}
          </span>
          <Tooltip>
            <TooltipTrigger
              aria-label={`What this measures: ${c.name}`}
              className="-m-1 inline-flex p-1"
              style={{ color: "var(--on-surface-variant)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-normal text-left leading-relaxed">
              {c.question}
            </TooltipContent>
          </Tooltip>
        </span>
        <span className="flex items-center gap-3">
          <RatingChip score={c.score} size="sm" />
        </span>
      </div>
      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-5 pl-[62px]">
            <p
              className="text-[15px] leading-[1.6]"
              style={{ color: "var(--on-surface)" }}
            >
              {c.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
