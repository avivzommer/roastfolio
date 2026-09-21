import { Check } from "lucide-react";

/**
 * "What's already working" grid — 2-col tonal cards with check-mark icons.
 */
export function WorkingGrid({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section id="working" className="reveal" style={{ scrollMarginTop: 96 }}>
      <div className="mb-5">
        <span className="m3-eyebrow">What&rsquo;s already working</span>
        <h2
          className="mt-2 text-[30px] font-bold leading-[1.1] tracking-tight"
          style={{ color: "var(--on-surface)" }}
        >
          {items.length === 1
            ? "One signal already landing"
            : `${items.length === 2 ? "Two" : items.length === 3 ? "Three" : items.length === 4 ? "Four" : items.length} signals already landing`}
        </h2>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex gap-3.5 p-5"
            style={{
              background: "var(--s-container)",
              borderRadius: "var(--r-lg)",
            }}
          >
            <span
              className="flex size-[38px] flex-none items-center justify-center rounded-full"
              style={{ background: "var(--rt-strong-bg)", color: "var(--rt-strong)" }}
            >
              <Check className="size-3.5" />
            </span>
            <span
              className="text-[14.5px] leading-[1.5]"
              style={{ color: "var(--on-surface)" }}
            >
              {it}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
