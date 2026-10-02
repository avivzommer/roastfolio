"use client";

import { useEffect, useState } from "react";

const FIRE_DURATION_MS = 2100;
const AUTOPLAY_DELAY_MS = 1200;

/**
 * "Roast it" submit button + one-shot fire.svg flame.
 *
 * Fire plays once automatically a moment after mount — so keyboard and
 * touch users (who can't hover) still see the flame once. Desktop users
 * can replay it on hover or keyboard focus. The CSS animations inside
 * fire.svg are a one-shot (`2s linear 1`), so we unmount the <img> after
 * the animation finishes instead of letting it linger on its final frame.
 *
 * Safari caches the SVG resource and refuses to restart its internal CSS
 * animations when the same URL is remounted. Appending a per-play query
 * param (`?k=N`) forces Safari to treat each play as a fresh resource and
 * replay the animation.
 */
export function RoastCTA() {
  const [playKey, setPlayKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Auto-play once a short beat after mount. Skipped if the viewer has
  // reduced-motion on, or if they already triggered it via hover/focus
  // before this timer fired.
  useEffect(() => {
    if (hasPlayed) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const t = setTimeout(() => {
      setPlaying(true);
      setHasPlayed(true);
      setPlayKey((k) => k + 1);
    }, AUTOPLAY_DELAY_MS);
    return () => clearTimeout(t);
  }, [hasPlayed]);

  // Unmount the <img> once the one-shot flame animation has finished, so
  // nothing lingers on the final still frame.
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setPlaying(false), FIRE_DURATION_MS);
    return () => clearTimeout(t);
  }, [playing, playKey]);

  const replay = () => {
    setHasPlayed(true);
    setPlaying(true);
    setPlayKey((k) => k + 1);
  };

  return (
    <span
      className="rf-cta"
      onMouseEnter={replay}
      onFocus={replay}
    >
      {playing && (
        <img
          key={playKey}
          src={`/fire.svg?k=${playKey}`}
          alt=""
          aria-hidden="true"
          className="rf-fire"
        />
      )}
      <button
        type="submit"
        onClick={() => setPlaying(false)}
        className="inline-flex items-center justify-center whitespace-nowrap transition-transform hover:-translate-y-[1px]"
        style={{
          fontFamily: "var(--f-body)",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--white)",
          background: "var(--ink)",
          border: "1.5px solid var(--ink)",
          borderRadius: 12,
          paddingInline: 30,
          paddingBlock: 18,
          cursor: "pointer",
        }}
      >
        Roast it
      </button>
    </span>
  );
}
