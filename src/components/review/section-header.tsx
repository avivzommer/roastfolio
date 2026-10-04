/**
 * Lightweight eyebrow + h2 header used to open each top-level section on
 * the Summary / Homepage / Case-study review pages. Keeps spacing and
 * typography consistent now that sub-pages render multiple sections
 * rather than one monolithic card.
 */
export function SectionHeader({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow: string;
  title: string;
  /** Optional trailing content on the same baseline as the title (e.g. a RatingChip). */
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <span className="m3-eyebrow">{eyebrow}</span>
        <h2
          className="mt-1.5 text-[22px] font-bold leading-tight tracking-tight sm:text-[24px]"
          style={{ color: "var(--on-surface)" }}
        >
          {title}
        </h2>
      </div>
      {trailing && <div className="flex-none">{trailing}</div>}
    </div>
  );
}
