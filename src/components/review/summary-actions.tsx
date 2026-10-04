"use client";

import { useState } from "react";
import {
  ChevronDown,
  Clock,
  Target,
  List,
  TrendingUp,
} from "lucide-react";
import type { ActionItem } from "@/lib/types";
import { priorityTag } from "@/lib/review-view";
import { cn } from "@/lib/utils";

/**
 * Summary-page "The move" block.
 *
 * Priority 1 renders as the full action card (always open) so the
 * designer sees the highest-leverage change in detail. Priorities 2 and 3
 * sit below as one-line compact chips that expand inline on click — the
 * surface stays small by default but the detail is still reachable.
 *
 * Shape mirrors `ActionStack` but focused on the Summary's "name the move,
 * then also-worth-doing" rhythm. The old `ActionStack` is unused once the
 * Summary refactor lands.
 */
export function SummaryActions({ items }: { items: ActionItem[] }) {
  if (items.length === 0) return null;
  const [p1, ...rest] = items;

  return (
    <div className="flex flex-col gap-4">
      <PriorityOneCard item={p1} />
      {rest.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {rest.map((it, i) => (
            <PriorityChip key={i} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityOneCard({ item }: { item: ActionItem }) {
  const tag = priorityTag(item.priority);
  return (
    <article
      className="overflow-hidden"
      style={{
        background: "var(--s-lowest)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--e2)",
      }}
    >
      <div className="flex w-full select-none items-start gap-4 px-6 py-[22px]">
        <span
          className="flex size-11 flex-none items-center justify-center rounded-full text-[18px] font-bold"
          style={{
            background: "var(--m3-primary)",
            color: "var(--m3-on-primary)",
          }}
        >
          1
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[11px] font-bold tracking-wider uppercase"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Priority 1 ·{" "}
            <b style={{ color: "var(--m3-primary)" }}>{tag}</b>
          </div>
          <div
            className="mt-1.5 text-[18px] font-bold leading-tight tracking-tight"
            style={{ color: "var(--on-surface)" }}
          >
            {item.title}
          </div>
          {item.estimatedEffort && (
            <span
              className="mt-3 inline-flex h-8 items-center gap-1.5 px-3.5 text-xs font-semibold sm:hidden"
              style={{
                background: "var(--s-container)",
                color: "var(--on-surface-variant)",
                borderRadius: "var(--r-full)",
              }}
            >
              <Clock className="size-3" />
              {item.estimatedEffort}
            </span>
          )}
        </div>
        {item.estimatedEffort && (
          <span
            className="hidden h-8 flex-none items-center gap-1.5 px-3.5 text-xs font-semibold sm:inline-flex"
            style={{
              background: "var(--s-container)",
              color: "var(--on-surface-variant)",
              borderRadius: "var(--r-full)",
            }}
          >
            <Clock className="size-3" />
            {item.estimatedEffort}
          </span>
        )}
      </div>
      <div className="px-6 pb-6 pl-6 sm:pl-[84px]">
        <DetailRow
          icon={<Target className="size-3" />}
          label="Why it matters"
          value={item.whyItMatters}
        />
        <DetailRow
          icon={<List className="size-3" />}
          label="What to change"
          value={item.howToDoIt}
        />
        {item.expectedSignal && (
          <div
            className="mt-3 rounded-[var(--r-md)] px-4.5 py-4"
            style={{ background: "var(--rt-strong-bg)" }}
          >
            <div
              className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase"
              style={{ color: "var(--rt-strong)" }}
            >
              <TrendingUp className="size-3" />
              Expected signal
            </div>
            <p
              className="mt-1.5 text-[15px] leading-[1.6]"
              style={{ color: "#06351c" }}
            >
              {item.expectedSignal}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function PriorityChip({ item }: { item: ActionItem }) {
  const [open, setOpen] = useState(false);
  const tag = priorityTag(item.priority);
  const badgeBg =
    item.priority === 2 ? "var(--m3-secondary-container)" : "var(--s-high)";
  const badgeFg =
    item.priority === 2
      ? "var(--m3-on-secondary-container)"
      : "var(--on-surface-variant)";

  return (
    <article
      className="overflow-hidden"
      style={{
        background: "var(--s-lowest)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--e1)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full select-none items-center gap-3 px-5 py-3 text-left"
      >
        <span
          className="flex size-7 flex-none items-center justify-center rounded-full text-sm font-bold"
          style={{ background: badgeBg, color: badgeFg }}
        >
          {item.priority}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[10.5px] font-bold tracking-wider uppercase"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Priority {item.priority} ·{" "}
            <b style={{ color: "var(--m3-primary)" }}>{tag}</b>
          </div>
          <div
            className="truncate text-[14.5px] font-semibold"
            style={{ color: "var(--on-surface)" }}
          >
            {item.title}
          </div>
        </div>
        {item.estimatedEffort && (
          <span
            className="hidden h-7 flex-none items-center gap-1.5 px-3 text-[11px] font-semibold sm:inline-flex"
            style={{
              background: "var(--s-container)",
              color: "var(--on-surface-variant)",
              borderRadius: "var(--r-full)",
            }}
          >
            <Clock className="size-3" />
            {item.estimatedEffort}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-4 flex-none transition-transform",
            open && "rotate-180",
          )}
          style={{ color: "var(--on-surface-variant)" }}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pt-1 pb-4">
            <DetailRow
              icon={<Target className="size-3" />}
              label="Why it matters"
              value={item.whyItMatters}
            />
            <DetailRow
              icon={<List className="size-3" />}
              label="What to change"
              value={item.howToDoIt}
            />
            {item.expectedSignal && (
              <DetailRow
                icon={<TrendingUp className="size-3" />}
                label="Expected signal"
                value={item.expectedSignal}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div
      className="border-t py-3 first:border-t-0 first:pt-1"
      style={{ borderColor: "var(--outline-variant)" }}
    >
      <div
        className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {icon}
        {label}
      </div>
      <div
        className="text-[14.5px] leading-[1.55]"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {value}
      </div>
    </div>
  );
}
