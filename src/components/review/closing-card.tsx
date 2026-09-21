import { Flag, Gauge } from "lucide-react";

/**
 * Closing card — light tonal card with pink eyebrow, closing paragraph, and
 * an optional confidence rationale row at the bottom.
 */
export function ClosingCard({
  closing,
  confidence,
}: {
  closing: string;
  confidence?: string;
}) {
  if (!closing) return null;
  return (
    <section className="reveal">
      <div
        className="px-9 py-8.5"
        style={{
          background: "var(--s-container)",
          borderRadius: "var(--r-xl)",
        }}
      >
        <div
          className="inline-flex h-[34px] items-center gap-2 pr-4 pl-3.5 text-xs font-bold tracking-widest uppercase whitespace-nowrap"
          style={{
            background: "var(--m3-primary)",
            color: "var(--m3-on-primary)",
            borderRadius: "var(--r-full)",
          }}
        >
          <Flag className="size-3" />
          The path forward
        </div>
        <p
          className="mt-5 max-w-[60ch] text-[20px] leading-[1.5] font-semibold tracking-tight text-balance"
          style={{ color: "var(--on-surface)" }}
        >
          {closing}
        </p>
        {confidence && (
          <div
            className="mt-5.5 flex gap-3.5 border-t pt-4.5 text-[13.5px] leading-[1.55]"
            style={{
              borderColor: "var(--outline-variant)",
              color: "var(--on-surface-variant)",
            }}
          >
            <span
              className="flex size-[30px] flex-none items-center justify-center rounded-full"
              style={{
                background: "var(--s-high)",
                color: "var(--on-surface-variant)",
              }}
            >
              <Gauge className="size-3" />
            </span>
            <span>{confidence}</span>
          </div>
        )}
      </div>
    </section>
  );
}
