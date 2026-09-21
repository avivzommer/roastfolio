"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Eye, ExternalLink, X, ImageOff } from "lucide-react";

/**
 * Screenshot with hover "View full" affordance and click-to-zoom lightbox.
 */
export function ShotPreview({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
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
        }}
      >
        <ImageOff className="mr-2 size-4" />
        Screenshot unavailable
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View full screenshot: ${alt}`}
        className="group relative block h-[248px] w-full cursor-zoom-in overflow-hidden border-0 p-0"
        style={{ background: "var(--s-high)" }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="block h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          style={{ objectPosition: "50% 38%" }}
        />
        <span
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 60%, rgba(28,27,30,.18) 100%)",
          }}
        />
        {caption && (
          <span
            className="absolute bottom-[15px] left-4 z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap"
            style={{
              background: "var(--m3-primary-container)",
              color: "var(--m3-on-primary-container)",
              borderRadius: "var(--r-full)",
            }}
          >
            <ExternalLink className="size-3" />
            {caption} · live capture
          </span>
        )}
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
              <figcaption className="flex items-center gap-2 text-xs font-medium" style={{ color: "rgba(255,255,255,.9)" }}>
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
