import { Flame } from "lucide-react";
import { heatOf } from "@/lib/review-view";
import { cn } from "@/lib/utils";

/**
 * Portfolio heat gauge — five flames, filled up to `score`.
 *
 * Sits next to the RatingChip on the review page. Distinct from the user's
 * chosen delivery `heatLevel` (chill/honest/spicy); this reads the portfolio's
 * *current* heat from the overall score.
 */
export function HeatMeter({
  score,
  size = "md",
  showLabel = true,
  className,
}: {
  /** 1–5 overall score. */
  score: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const { filled, label } = heatOf(score);
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1",
        size === "sm" ? "text-[10.5px]" : "text-[11.5px]",
        className,
      )}
      style={{
        borderColor: "var(--rt-flame-border, var(--outline-variant))",
        background: "var(--rt-flame-bg, var(--s-container))",
        color: "var(--rt-flame-fg, var(--on-surface-variant))",
        fontFamily: "var(--font-jetbrains, monospace)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
      aria-label={`Heat rating: ${label}, ${filled} out of 5`}
    >
      <span className="inline-flex items-center gap-[2px]">
        {[1, 2, 3, 4, 5].map((i) => {
          const on = i <= filled;
          return (
            <Flame
              key={i}
              width={iconSize}
              height={iconSize}
              strokeWidth={on ? 2 : 1.5}
              style={{
                color: on
                  ? "var(--rt-flame-on, #CC785C)"
                  : "var(--rt-flame-off, #DBD3C0)",
                fill: on ? "var(--rt-flame-on, #CC785C)" : "transparent",
              }}
            />
          );
        })}
      </span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}
