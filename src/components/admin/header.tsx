import Link from "next/link";
import {
  ArrowLeft,
  LogOut,
  ListChecks,
  Mail,
  MessageSquare,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";
import { logoutAdmin } from "@/lib/actions";

export type AdminSection =
  | "overview"
  | "history"
  | "waitlist"
  | "feedback"
  | "errors";

const SECTIONS: Array<{
  key: Exclude<AdminSection, "overview">;
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "history", href: "/admin/history", label: "Review history", Icon: ListChecks },
  { key: "waitlist", href: "/admin/waitlist", label: "Waitlist", Icon: Mail },
  { key: "feedback", href: "/admin/feedback", label: "Feedback", Icon: MessageSquare },
  { key: "errors", href: "/admin/errors", label: "Errors", Icon: AlertTriangle },
];

/**
 * Shared admin page header.
 *
 * On desktop: logo + title block on the left, peer-section nav + Home +
 * Sign out on the right, fixed 72px tall and sticky to the top.
 *
 * On mobile: the top row stays logo + title; the peer-section pill rail
 * scrolls horizontally in a second row so the admin never loses access to
 * other surfaces. The header's height is allowed to grow to fit the extra
 * row — the layout is still sticky.
 */
export function AdminHeader({
  section,
  title,
  subtitle,
}: {
  section: AdminSection;
  title: string;
  subtitle: string;
}) {
  const peerSections = SECTIONS.filter((s) => s.key !== section);
  return (
    <header
      className="sticky top-0 z-40 flex flex-col gap-3 px-4 py-3 sm:h-[72px] sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-0"
      style={{
        background: "color-mix(in srgb, var(--s-low) 86%, transparent)",
        backdropFilter: "saturate(150%) blur(16px)",
        WebkitBackdropFilter: "saturate(150%) blur(16px)",
      }}
    >
      <div className="flex items-center gap-4">
        <Link href="/admin" className="flex items-center gap-3.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-base font-bold tracking-wide sm:h-11 sm:w-11"
            style={{
              background: "var(--m3-primary)",
              color: "var(--m3-on-primary)",
            }}
          >
            PR
          </div>
          <div className="min-w-0">
            <div
              className="truncate text-[16px] font-bold leading-tight tracking-tight sm:text-[18px]"
              style={{ color: "var(--on-surface)" }}
            >
              {title}
            </div>
            <div
              className="truncate text-xs"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {subtitle}
            </div>
          </div>
        </Link>
        <div className="sm:flex-1" />
      </div>

      {/* Horizontal pill rail — scrolls when it can't fit all peer links.
          -mx-4 bleeds to the viewport edge on mobile so the first/last pill
          isn't awkwardly indented inside the padded header. */}
      <div className="-mx-4 overflow-x-auto sm:mx-0 sm:ml-auto">
        <div className="flex min-w-max items-center gap-2 px-4 sm:px-0">
          {section !== "overview" && (
            <Link
              href="/admin"
              className="m3-btn"
              aria-label="Admin overview"
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </Link>
          )}
          {peerSections.map((p) => (
            <Link
              key={p.key}
              href={p.href}
              className="m3-btn"
              aria-label={p.label}
            >
              <p.Icon className="size-4" />
              <span>{p.label}</span>
            </Link>
          ))}
          <Link href="/" className="m3-btn" aria-label="Back to home">
            <ArrowLeft className="size-4" />
            <span>Home</span>
          </Link>
          <form action={logoutAdmin}>
            <button type="submit" className="m3-btn" aria-label="Sign out">
              <LogOut className="size-4" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
