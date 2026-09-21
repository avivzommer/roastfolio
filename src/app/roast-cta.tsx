"use client";

import { useState } from "react";

/**
 * "Roast it" submit button + hover-triggered fire.svg.
 *
 * The fire is remounted each time hover starts (via a bumping key) so its
 * one-shot CSS animations in fire.svg play from the start every time.
 * Fire lives above the button so flames appear to rise from the CTA.
 */
export function RoastCTA() {
  const [hoverKey, setHoverKey] = useState(0);
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className="rf-cta"
      onMouseEnter={() => {
        setHovered(true);
        setHoverKey((k) => k + 1);
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        setHovered(true);
        setHoverKey((k) => k + 1);
      }}
      onBlur={() => setHovered(false)}
    >
      {hovered && (
        <img
          key={hoverKey}
          src="/fire.svg"
          alt=""
          aria-hidden="true"
          className="rf-fire"
        />
      )}
      <button
        type="submit"
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
