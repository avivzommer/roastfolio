import { submitWaitlist } from "@/lib/actions";

/**
 * Two-input waitlist form shown on the homepage when the monthly API budget
 * is exhausted. Same visual language as the roast form so the closed state
 * still feels like Roastfolio, just off. Server-side action, no client JS.
 */
export function WaitlistForm() {
  return (
    <form
      action={submitWaitlist}
      className="rf-enter rf-enter-4 mt-9 flex w-full flex-col gap-3"
      style={{ maxWidth: 560 }}
    >
      <input
        name="portfolioUrl"
        type="text"
        inputMode="url"
        placeholder="your-portfolio.com"
        required
        autoComplete="url"
        spellCheck={false}
        autoCapitalize="off"
        className="min-w-0 flex-1 outline-none focus:border-[var(--ink)]"
        style={{
          fontFamily: "var(--f-body)",
          fontSize: 16,
          color: "var(--ink)",
          background: "var(--white)",
          border: "1.5px solid var(--rule)",
          borderRadius: 12,
          paddingInline: 20,
          paddingBlock: 18,
          textAlign: "left",
        }}
      />
      <input
        name="email"
        type="email"
        inputMode="email"
        placeholder="you@email.com"
        required
        autoComplete="email"
        spellCheck={false}
        autoCapitalize="off"
        className="min-w-0 flex-1 outline-none focus:border-[var(--ink)]"
        style={{
          fontFamily: "var(--f-body)",
          fontSize: 16,
          color: "var(--ink)",
          background: "var(--white)",
          border: "1.5px solid var(--rule)",
          borderRadius: 12,
          paddingInline: 20,
          paddingBlock: 18,
          textAlign: "left",
        }}
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center whitespace-nowrap transition-transform hover:-translate-y-[1px]"
        style={{
          fontFamily: "var(--f-body)",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--white)",
          background: "var(--ink)",
          border: "1.5px solid var(--ink)",
          borderRadius: 12,
          paddingInline: 30,
          paddingBlock: 18,
          cursor: "pointer",
        }}
      >
        Join the waitlist
      </button>
    </form>
  );
}
