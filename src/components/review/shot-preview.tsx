"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Eye, ExternalLink, X, ImageOff } from "lucide-react";

/**
 * Screenshot wrapped in a mini browser-mockup frame — a smaller cousin of
 * BrowserShot (traffic-light dots + URL pill in the chrome, rounded
 * container, ink-drop shadow) without the flame overlay. Used at the top
 * of the Homepage sub-page and each Case-study sub-page.
 *
 * Behaves the same as before — click opens a full-size lightbox, Esc
 * closes it. Hover reveals a "View full" affordance in the image area.
 */
export function ShotPreview({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  /** Portfolio host, e.g. "dana-sharoni.vercel.app". Shown in the URL pill. */
  caption?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!src) {
    return (
      <div
        className="flex h-40 w-full items-center justify-center text-xs"
        style={{
          background: "var(--s-high)",
          color: "var(--on-surface-variant)",
          borderRadius: 14,
          border: "1px solid var(--rule)",
        }}
      >
        <ImageOff className="mr-2 size-4" />
        Screenshot unavailable
      </div>
    );
  }

  const host = (caption ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <>
      <div
        className="relative mb-2 select-none"
        style={{
          borderRadius: 14,
          overflow: "hidden",
          background: "#FFFFFF",
          border: "1px solid var(--ink)",
          // Soft offset ink shadow — same aesthetic as the Summary's
          // BrowserShot but reduced from 10/10 to 6/6 so it reads as the
          // smaller sibling.
          boxShadow: "6px 6px 0 var(--ink)",
        }}
      >
        {/* Chrome strip — traffic lights + URL pill in the center. */}
        <div
          className="flex items-center gap-2 px-3.5"
          style={{
            height: 32,
            background: "#F6EDDE",
            borderBottom: "1px solid var(--ink)",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#F17161",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#F2BD41",
              display: "inline-block",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#61C554",
              display: "inline-block",
            }}
          />
          <div
            className="mx-auto flex items-center justify-center truncate"
            style={{
              maxWidth: "62%",
              height: 20,
              padding: "0 12px",
              borderRadius: 999,
              background: "#FFFFFF",
              border: "1px solid var(--rule)",
              fontSize: 11,
              color: "var(--ink-soft)",
              fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
            }}
          >
            <span className="truncate">{host || alt}</span>
          </div>
          <span style={{ width: 30, flex: "none" }} />
        </div>

        {/* Image area — click-to-zoom button, hover reveals "View full". */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`View full screenshot: ${alt}`}
          className="group relative block w-full cursor-zoom-in overflow-hidden border-0 p-0"
          style={{
            height: 320,
            background: "var(--s-high)",
          }}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ objectPosition: "50% 20%" }}
          />
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 65%, rgba(28,27,30,.14) 100%)",
            }}
          />
          <span
            className="absolute right-4 bottom-[15px] z-10 inline-flex translate-y-1.5 items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"
            style={{
              background: "var(--s-lowest)",
              color: "var(--on-surface)",
              borderRadius: "var(--r-full)",
              boxShadow: "var(--e1)",
            }}
          >
            <Eye className="size-3.5" />
            View full
          </span>
        </button>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center p-10"
          style={{
            background: "rgba(28,27,30,.66)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <figure
            className="m-0 flex max-w-[min(1120px,94vw)] cursor-default flex-col items-center gap-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="block h-auto max-h-[80vh] w-full object-contain"
              style={{
                background: "#fff",
                borderRadius: "var(--r-lg)",
                boxShadow: "var(--e3)",
              }}
            />
            {caption && (
              <figcaption
                className="flex items-center gap-2 text-xs font-medium"
                style={{ color: "rgba(255,255,255,.9)" }}
              >
                <ExternalLink className="size-3" />
                {alt} — captured from {caption}
              </figcaption>
            )}
          </figure>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="fixed top-5.5 right-6 flex size-12 cursor-pointer items-center justify-center rounded-full border-0"
            style={{
              background: "var(--s-lowest)",
              color: "var(--on-surface)",
              boxShadow: "var(--e2)",
            }}
          >
            <X className="size-[18px]" />
          </button>
        </div>
      )}
    </>
  );
}
