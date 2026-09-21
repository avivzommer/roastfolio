import { ratingOf } from "@/lib/review-view";
import { cn } from "@/lib/utils";

/**
 * Text-tier rating display — replaces the old StarRating.
 *
 * Maps a 1-5 score to a four-tier label: Strong / Good / Developing / Needs work.
 * Renders as an M3 pill with a colored dot.
 */
export function RatingChip({
  score,
  size = "md",
  className,
}: {
  /** 1–5. */
  score: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const { label, tone } = ratingOf(score);
  return (
    <span
      className={cn(
        "rating-chip",
        `rating-chip--${tone}`,
        size === "sm" && "sm",
        className,
      )}
    >
      <span className="rating-chip__dot" />
      {label}
    </span>
  );
}
