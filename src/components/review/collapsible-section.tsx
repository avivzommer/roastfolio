"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { RatingChip } from "./rating-chip";

/**
 * Collapsed-by-default breakdown card.
 *
 * Each item in the "Breakdown" sidebar group — Score breakdown, Homepage,
 * every case study, Review risks — renders as one of these so the user
 * doesn't have to scroll past 10+ full sections to find the one they care
 * about. The header card is always visible (title + optional score chip +
 * chevron); the body only mounts the full existing component on expand.
 *
 * The sidebar's `go()` dispatches a `rf-section-open` event when the user
 * clicks a nav row; the matching section listens for its own id, opens
 * itself, and then the sidebar's scroll animation runs. That means a
 * sidebar click both navigates to AND opens the section — the two
 * surfaces stay in sync.
 */
export function CollapsibleSection({
  id,
  eyebrow,
  title,
  score,
  children,
  defaultOpen = false,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  score?: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Keep a ref around so a sidebar-triggered open can also re-scroll if
  // the user is already near the section — the sidebar scrolls once, but
  // the expand reflow can leave the target slightly off-screen.
  const anchorRef = useRef<HTMLDivElement>(null);

  // External "open this section" trigger (fired by the sidebar).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (!detail || detail.id !== id) return;
      setOpen(true);
    };
    window.addEventListener("rf-section-open", handler as EventListener);
    return () =>
      window.removeEventListener("rf-section-open", handler as EventListener);
  }, [id]);

  // Open the section whose id matches the current URL hash on first mount,
  // so a deep link like /r/abc#homepage lands with Homepage already expanded.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (hash && hash === id) setOpen(true);
  }, [id]);

  return (
    <section
      id={id}
      className="reveal"
      style={{ scrollMarginTop: 96 }}
      ref={anchorRef}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        className="flex w-full cursor-pointer select-none items-center gap-3 border-0 px-6 py-5 text-left transition-shadow"
        style={{
          background: "var(--s-lowest)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--e1)",
        }}
      >
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div
              className="text-[11px] font-bold tracking-widest uppercase"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {eyebrow}
            </div>
          )}
          <div
            className="mt-1 text-[18px] font-semibold leading-tight tracking-tight sm:text-[20px]"
            style={{ color: "var(--on-surface)" }}
          >
            {title}
          </div>
        </div>
        {typeof score === "number" && (
          <span className="flex-none">
            <RatingChip score={score} size="sm" />
          </span>
        )}
        <ChevronDown
          className={`size-5 flex-none transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--on-surface-variant)" }}
          aria-hidden="true"
        />
      </button>
      {/* grid-rows transition pattern (same one action-stack uses) animates
          height from 0 → auto without JS measuring. */}
      <div
        id={`${id}-body`}
        className="grid transition-[grid-template-rows] duration-300"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
