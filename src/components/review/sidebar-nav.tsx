"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RatingChip } from "./rating-chip";

export interface NavItem {
  id: string;
  name: string;
  icon?: ReactNode;
  score?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Sticky sidebar with scroll spy. Highlights the active section as the
 * user scrolls; clicking an item smooth-scrolls to that anchor.
 */
export function SidebarNav({ groups }: { groups: NavGroup[] }) {
  const ids = groups.flatMap((g) => g.items.map((i) => i.id));
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY + window.innerHeight * 0.28;
      let cur = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= top) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids.join(",")]);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 84, behavior: "smooth" });
  };

  return (
    <aside
      className="sticky hidden self-start overflow-y-auto px-4 py-4 lg:block"
      style={{ top: 72, height: "calc(100vh - 72px)" }}
    >
      {groups.map((g, gi) => (
        <div key={g.label} className={cn(gi > 0 && "mt-5")}>
          <div
            className="px-4 pt-3 pb-2 text-[11px] font-bold tracking-widest uppercase"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {g.label}
          </div>
          {g.items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              onClick={(e) => go(e, it.id)}
              className={cn(
                "relative my-0.5 flex h-[52px] w-full items-center gap-3 overflow-hidden rounded-full px-4 text-sm font-semibold transition-colors",
                "hover:bg-[var(--s-high)]/60",
              )}
              style={{
                color:
                  active === it.id
                    ? "var(--m3-on-secondary-container)"
                    : "var(--on-surface-variant)",
                background: active === it.id ? "var(--m3-secondary-container)" : "transparent",
              }}
            >
              {it.icon && (
                <span className="flex size-[22px] flex-none items-center justify-center">
                  {it.icon}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">{it.name}</span>
              {typeof it.score === "number" && (
                <RatingChip score={it.score} size="sm" />
              )}
            </a>
          ))}
        </div>
      ))}
    </aside>
  );
}

/**
 * Top-of-page progress bar that grows as the user scrolls.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div
      className="fixed left-0 top-0 z-50 h-[3px] rounded-r-full"
      style={{
        width: `${progress * 100}%`,
        background: "var(--m3-primary)",
        transition: "width 0.1s linear",
      }}
    />
  );
}
