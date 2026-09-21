import Link from "next/link";
import { ExternalLink, Download, ArrowLeft } from "lucide-react";
import { brandInitials, readableHost, readableDate } from "@/lib/review-view";

/**
 * M3 Expressive top app bar — replaces the old SiteHeader on the review page.
 * Sticky, blurred, with brandmark + designer name + Visit site + Export buttons.
 */
export function ReviewTopBar({
  portfolioUrl,
  createdAt,
  reviewId,
}: {
  portfolioUrl: string;
  createdAt: Date;
  reviewId: string;
}) {
  const initials = brandInitials(portfolioUrl);
  const host = readableHost(portfolioUrl);
  const date = readableDate(createdAt);

  return (
    <header
      className="sticky top-0 z-40 flex h-[72px] items-center gap-4 px-6"
      style={{
        background: "color-mix(in srgb, var(--s-low) 86%, transparent)",
        backdropFilter: "saturate(150%) blur(16px)",
        WebkitBackdropFilter: "saturate(150%) blur(16px)",
      }}
    >
      <div className="flex items-center gap-3.5" style={{ minWidth: "calc(280px - 24px)" }}>
        <Link
          href="/"
          className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold tracking-wide"
          style={{ background: "var(--m3-primary)", color: "var(--m3-on-primary)" }}
          aria-label="Back to landing"
        >
          {initials}
        </Link>
        <div className="min-w-0">
          <div className="truncate text-[18px] font-bold leading-tight tracking-tight" style={{ color: "var(--on-surface)" }}>
            Roastfolio
          </div>
          <div className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {host} · {date}
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="m3-btn"
          style={{ height: 40, padding: "0 16px" }}
          aria-label="New review"
        >
          <ArrowLeft className="size-4" />
          New review
        </Link>
        <a
          className="m3-btn"
          href={portfolioUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="size-4" />
          Visit site
        </a>
        <a
          className="m3-btn m3-btn--primary"
          href={`/r/${reviewId}/download`}
          download
        >
          <Download className="size-4" />
          Export
        </a>
      </div>
    </header>
  );
}
