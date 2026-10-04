"use client";

import { useEffect, useState } from "react";

/**
 * Top-of-page progress bar that grows as the user scrolls.
 * Shared across every review sub-page via the layout.
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
