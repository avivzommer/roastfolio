"use client";

import { useState } from "react";
import { ChevronDown, Clock, Target, List, TrendingUp } from "lucide-react";
import type { ActionItem } from "@/lib/types";
import { priorityTag } from "@/lib/review-view";
import { cn } from "@/lib/utils";

/**
 * Stack of action cards. First card is open by default.
 * P1 gets elevated styling; expand reveals Why / How / Expected signal rows.
 */
export function ActionStack({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const toggle = (i: number) =>
    setOpen((p) => {
      const n = new Set(p);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  if (items.length === 0) return null;

  return (
    <section
      id="actions"
      className="reveal"
      style={{ scrollMarginTop: 96 }}
    >
      <div className="mb-5">
        <span className="m3-eyebrow">Next best actions</span>
        <h2
          className="mt-2 text-[30px] font-bold leading-[1.1] tracking-tight"
          style={{ color: "var(--on-surface)" }}
        >
          Three concrete moves, ordered by impact.
        </h2>
      </div>
      <div className="flex flex-col gap-4">
        {items.map((a, i) => (
          <ActionRow
            key={i}
            item={a}
            isOpen={open.has(i)}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </section>
  );
}

function ActionRow({
  item,
  isOpen,
  onToggle,
}: {
  item: ActionItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isP1 = item.priority === 1;
  const tag = priorityTag(item.priority);

  return (
    <article
      className={cn("overflow-hidden transition-shadow")}
      style={{
        background: "var(--s-lowest)",
        borderRadius: "var(--r-lg)",
        boxShadow: isP1 ? "var(--e2)" : "var(--e1)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full select-none items-start gap-4 px-6 py-[22px] text-left"
      >
        <span
          className={cn(
            "flex size-11 flex-none items-center justify-center rounded-full text-[18px] font-bold",
          )}
          style={{
            background:
              item.priority === 1
                ? "var(--m3-primary)"
                : item.priority === 2
                  ? "var(--m3-secondary-container)"
                  : "var(--s-high)",
            color:
              item.priority === 1
                ? "var(--m3-on-primary)"
                : item.priority === 2
                  ? "var(--m3-on-secondary-container)"
                  : "var(--on-surface-variant)",
          }}
        >
          {item.priority}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--on-surface-variant)" }}>
            Priority {item.priority} · <b style={{ color: "var(--m3-primary)" }}>{tag}</b>
          </div>
          <div
            className="mt-1.5 text-[18px] font-bold leading-tight tracking-tight"
            style={{ color: "var(--on-surface)" }}
          >
            {item.title}
          </div>
        </div>
        {item.estimatedEffort && (
          <span
            className="inline-flex h-8 flex-none items-center gap-1.5 px-3.5 text-xs font-semibold"
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
            isOpen && "rotate-180",
          )}
          style={{ color: "var(--on-surface-variant)", marginTop: 8 }}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6 pl-[84px]">
            <DetailRow
              icon={<Target className="size-3" />}
              label="Why it matters"
              value={item.whyItMatters}
            />
            <DetailRow
              icon={<List className="size-3" />}
              label="How to do it"
              value={item.howToDoIt}
            />
            <div
              className="mt-3 rounded-[var(--r-md)] px-4.5 py-4"
              style={{ background: "var(--rt-strong-bg)" }}
            >
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--rt-strong)" }}>
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
      className="border-t py-4 first:border-t-0 first:pt-1"
      style={{ borderColor: "var(--outline-variant)" }}
    >
      <div
        className="mb-1.5 flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {icon}
        {label}
      </div>
      <div
        className="text-[15px] leading-[1.6]"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {value}
      </div>
    </div>
  );
}
