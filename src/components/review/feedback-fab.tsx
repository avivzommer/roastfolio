"use client";

import { Sparkles } from "lucide-react";

/**
 * Floating "Give feedback" FAB — scrolls to feedback section and focuses textarea.
 */
export function FeedbackFab() {
  const onClick = () => {
    const el = document.getElementById("feedback");
    if (!el) return;
    window.scrollTo({ top: el.offsetTop - 84, behavior: "smooth" });
    setTimeout(() => {
      const ta = document.getElementById("fb-text") as HTMLTextAreaElement | null;
      if (ta) ta.focus({ preventScroll: true });
    }, 600);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Give feedback"
      className="fixed right-7 bottom-7 z-[45] inline-flex h-[60px] cursor-pointer items-center gap-3 border-0 px-6 text-[15px] font-bold transition-transform whitespace-nowrap hover:-translate-y-[3px] hover:scale-[1.02] active:translate-y-0 active:scale-[.98]"
      style={{
        background: "var(--pop-pink)",
        color: "var(--pop-pink-ink)",
        borderRadius: "var(--r-md)",
        boxShadow: "var(--e3)",
      }}
    >
      <Sparkles className="size-[22px]" />
      <span>Give feedback</span>
    </button>
  );
}
