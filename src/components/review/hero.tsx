/**
 * Hero — big editorial display headline (Bricolage) + body copy.
 * Sits at the top of the report inside the doc card.
 */
export function Hero({
  eyebrow,
  headline,
  body,
}: {
  eyebrow: string;
  headline: string;
  body: string;
}) {
  return (
    <section
      id="signal"
      className="relative reveal"
      style={{ scrollMarginTop: 96 }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--on-surface-variant)",
        }}
      >
        {eyebrow}
      </span>
      <h1
        className="mt-3 text-balance"
        style={{
          fontFamily: "var(--font-bricolage), Inter, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: "clamp(38px, 4.6vw, 60px)",
          lineHeight: 1.02,
          letterSpacing: "-0.028em",
          color: "var(--on-surface)",
          maxWidth: "22ch",
        }}
      >
        {headline}
      </h1>
      <p
        className="mt-6 max-w-[60ch] text-[18px] leading-[1.55]"
        style={{ color: "var(--on-surface-variant)" }}
      >
        {body}
      </p>
    </section>
  );
}
