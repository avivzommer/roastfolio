import { Zap } from "lucide-react";
import { splitGrowthLever } from "@/lib/review-view";

/**
 * Growth lever — M3 light card with pink eyebrow, big statement, supporting body.
 */
export function GrowthLeverCallout({ text }: { text: string }) {
  if (!text) return null;
  const { statement, body } = splitGrowthLever(text);
  return (
    <section id="lever" className="reveal" style={{ scrollMarginTop: 96 }}>
      <div
        className="relative overflow-hidden px-9 pt-8.5 pb-9"
        style={{
          background: "var(--s-container)",
          borderRadius: "var(--r-xl)",
          color: "var(--on-surface)",
        }}
      >
        <div
          className="relative inline-flex h-[34px] items-center gap-2.5 pr-4 pl-3.5"
          style={{
            background: "var(--pop-pink)",
            color: "var(--pop-pink-ink)",
            borderRadius: "var(--r-full)",
          }}
        >
          <Zap className="size-3.5" fill="currentColor" />
          <span className="text-xs font-bold tracking-widest uppercase">
            Main growth lever
          </span>
        </div>
        <p
          className="relative mt-5 max-w-[18ch] text-balance text-[40px] font-bold leading-[1.08] tracking-tight"
          style={{ color: "var(--on-surface)" }}
        >
          {statement}
        </p>
        {body && (
          <p
            className="relative mt-5 max-w-[64ch] text-[16px] leading-[1.62]"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {body}
          </p>
        )}
      </div>
    </section>
  );
}
