"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, Layers } from "lucide-react";

export interface ReviewTabsCaseItem {
  id: string;
  name: string;
}

export interface ReviewTabsProps {
  reviewId: string;
  cases: ReviewTabsCaseItem[];
}

/**
 * Horizontal pill rail across the top of the review doc card.
 * - Summary / Homepage / Case 1..N
 * - Active pill via usePathname()
 * - Mobile: -mx-4 overflow-x-auto so it scrolls instead of overflowing
 *   (same pattern as the admin header's peer-nav rail).
 */
export function ReviewTabs({ reviewId, cases }: ReviewTabsProps) {
  const pathname = usePathname();

  const tabs: Array<{
    href: string;
    label: string;
    short?: string;
    icon: React.ReactNode;
    match: (p: string) => boolean;
  }> = [
    {
      href: `/r/${reviewId}`,
      label: "Summary",
      icon: <FileText className="size-4" />,
      match: (p) => p === `/r/${reviewId}`,
    },
    {
      href: `/r/${reviewId}/homepage`,
      label: "Homepage",
      icon: <Home className="size-4" />,
      match: (p) => p === `/r/${reviewId}/homepage`,
    },
    ...cases.map((cs) => ({
      href: `/r/${reviewId}/case/${cs.id}`,
      label: truncateCaseName(cs.name),
      short: cs.name,
      icon: <Layers className="size-4" />,
      match: (p: string) => p === `/r/${reviewId}/case/${cs.id}`,
    })),
  ];

  return (
    <nav
      aria-label="Review sections"
      className="-mx-4 overflow-x-auto pb-1 sm:mx-0"
    >
      <div className="flex min-w-max items-center gap-2 px-4 sm:px-0">
        {tabs.map((t) => {
          const isActive = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              title={t.short || t.label}
              aria-current={isActive ? "page" : undefined}
              className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors"
              style={
                isActive
                  ? {
                      background: "var(--ink)",
                      color: "var(--white, #FFFFFF)",
                    }
                  : {
                      background: "var(--s-container)",
                      color: "var(--on-surface)",
                    }
              }
            >
              {t.icon}
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function truncateCaseName(name: string): string {
  if (name.length <= 22) return name;
  return name.slice(0, 20).trimEnd() + "…";
}
