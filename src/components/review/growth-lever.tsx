import { Zap } from "lucide-react";
import { splitGrowthLever } from "@/lib/review-view";

/**
 * Growth lever — M3 light card with pink eyebrow, big statement, supporting
 * body.
 *
 * The statement font scales down with length so a longer one-sentence
 * diagnosis doesn't render as a 40px wall. The original ~40px display
 * only fires for genuinely short statements (a short-term goal that
 * our newer prompt rarely produces, but older stored reviews rely on).
 */
export function GrowthLeverCallout({ text }: { text: string }) {
  if (!text) return null;
  const { statement, body } = splitGrowthLever(text);

  const statementWords = statement.split(/\s+/).filter(Boolean).length;
  // Three tiers. The thresholds mirror what reads cleanly on the ~720px
  // doc column at desktop and still breathe on 375px mobile.
  const tier =
    statementWords > 24
      ? {
          size: "text-[22px] sm:text-[24px]",
          leading: "leading-[1.32]",
          maxW: "max-w-[48ch]",
        }
      : statementWords > 14
        ? {
            size: "text-[26px] sm:text-[30px]",
            leading: "leading-[1.22]",
            maxW: "max-w-[32ch]",
          }
        : {
            size: "text-[32px] sm:text-[40px]",
            leading: "leading-[1.08]",
            maxW: "max-w-[18ch]",
          };

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
          className={`relative mt-5 text-balance font-bold tracking-tight ${tier.size} ${tier.leading} ${tier.maxW}`}
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
