import Link from "next/link";
import { submitReview } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";
import { getMonthlyBudget } from "@/lib/limits";
import { RoastCTA } from "./roast-cta";
import { WaitlistForm } from "./waitlist-form";

const TOKENS: React.CSSProperties = {
  "--peach": "#FDDDBB",
  "--peach-2": "#FCD3A8",
  "--ink": "#111111",
  "--ink-soft": "#4A4640",
  "--rule": "#E9C79C",
  "--white": "#FFFFFF",
  "--f-display": "var(--font-bricolage), Inter, system-ui, sans-serif",
  "--f-body": "var(--font-inter), system-ui, sans-serif",
} as React.CSSProperties;

function formatLandingError(
  code: string | undefined,
  retry: string | undefined,
): string | null {
  if (!code) return null;
  if (code === "budget") {
    return "Monthly capacity reached. New reviews reopen on the 1st of next month.";
  }
  if (code === "rate-limit") {
    return `You've reached the per-hour review limit. Try again ${retry ?? "in less than an hour"}.`;
  }
  return code;
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    retry?: string;
    waitlisted?: string;
    waitlistError?: string;
    closed?: string;
  }>;
}) {
  const sp = await searchParams;
  const errorMessage = formatLandingError(sp.error, sp.retry);
  const waitlistError = sp.waitlistError ?? null;
  const waitlistSuccess = sp.waitlisted === "1";

  const [admin, budget] = await Promise.all([isAdmin(), getMonthlyBudget()]);
  // Dev-only escape hatch — lets the prototype menu jump into the closed
  // state without touching MONTHLY_BUDGET_CENTS. Bypasses the admin check
  // too so signed-in admins can still preview the state.
  const forceClosed =
    process.env.NODE_ENV === "development" && sp.closed === "1";
  const roastfolioClosed = forceClosed || (budget.exhausted && !admin);

  return (
    <div
      style={{
        ...TOKENS,
        background: "var(--peach)",
        color: "var(--ink)",
        fontFamily: "var(--f-body)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Fire rises from the top edge of the CTA on hover.
          Bottom of the fire SVG (its "base" ember + drop shadow) is masked
          to invisibility so only flames appear, and only above the button. */}
      <style>{`
        .rf-cta { position: relative; display: inline-block; }
        .rf-cta button { position: relative; z-index: 2; }
        .rf-fire {
          position: absolute;
          left: 50%;
          bottom: 100%;
          width: 140px;
          height: 140px;
          max-width: none;
          max-height: none;
          transform: translate(-50%, 22%);
          transform-origin: bottom center;
          pointer-events: none;
          z-index: 0;
          -webkit-mask-image: linear-gradient(to top, transparent 22%, black 42%);
          mask-image: linear-gradient(to top, transparent 22%, black 42%);
        }
        @keyframes rf-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rf-enter {
          opacity: 0;
          animation: rf-fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .rf-enter-1 { animation-delay: 0ms; }
        .rf-enter-2 { animation-delay: 140ms; }
        .rf-enter-3 { animation-delay: 260ms; }
        .rf-enter-4 { animation-delay: 380ms; }
        @media (prefers-reduced-motion: reduce) {
          .rf-enter { opacity: 1; animation: none; }
        }
      `}</style>

      <header className="flex h-[72px] items-center px-6 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            roastfolio
          </span>
          <span
            aria-label="Beta"
            style={{
              fontFamily: "var(--f-body)",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink)",
              background: "rgba(17, 17, 17, 0.08)",
              border: "1px solid rgba(17, 17, 17, 0.16)",
              borderRadius: 999,
              padding: "2px 8px",
              lineHeight: 1.3,
            }}
          >
            Beta
          </span>
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero — fills the viewport (minus 72px header) */}
        <section
          className="mx-auto flex w-full max-w-[880px] flex-col items-center px-6 py-8 text-center sm:px-10"
          style={{ minHeight: "calc(100vh - 72px)", justifyContent: "center" }}
        >
          <img
            src="/hero.svg"
            alt=""
            aria-hidden="true"
            className="rf-enter rf-enter-1 mb-10 h-auto w-full select-none"
            style={{ display: "block", maxWidth: 350 }}
          />

          <h1
            className="rf-enter rf-enter-2 text-balance"
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 700,
              fontSize: "clamp(44px, 6vw, 84px)",
              lineHeight: 1.0,
              letterSpacing: "-0.032em",
              color: "var(--ink)",
              maxWidth: 15 + "ch",
            }}
          >
            {waitlistSuccess
              ? "You're on the list."
              : roastfolioClosed
                ? "Roastfolio is fully cooked for the month."
                : "An honest read on your portfolio."}
          </h1>

          <p
            className="rf-enter rf-enter-3 mt-5 text-[18px] leading-[1.5]"
            style={{ color: "var(--ink-soft)", maxWidth: "44ch" }}
          >
            {waitlistSuccess
              ? "We'll email you when Roastfolio reopens on the 1st."
              : roastfolioClosed
                ? "Monthly capacity is used up. Get on the list — we'll reopen you first."
                : "See it the way a recruiter or hiring manager would."}
          </p>

          {!waitlistSuccess &&
            (roastfolioClosed ? (
              <WaitlistForm />
            ) : (
              <form
                action={submitReview}
                className="rf-enter rf-enter-4 mt-9 flex w-full flex-col items-stretch gap-3 sm:flex-row"
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
                <RoastCTA />
              </form>
            ))}

          {errorMessage && !roastfolioClosed && (
            <div
              className="mt-4 w-full px-4 py-3 text-left text-[13px]"
              style={{
                background: "#F8E2DD",
                color: "#7A1E0C",
                border: "1px solid #E8B5AB",
                borderRadius: 10,
                maxWidth: 560,
              }}
            >
              {errorMessage}
            </div>
          )}

          {waitlistError && (
            <div
              className="mt-4 w-full px-4 py-3 text-left text-[13px]"
              style={{
                background: "#F8E2DD",
                color: "#7A1E0C",
                border: "1px solid #E8B5AB",
                borderRadius: 10,
                maxWidth: 560,
              }}
            >
              {waitlistError}
            </div>
          )}
        </section>

        {/* About — appears after scrolling past the hero */}
        <section className="mx-auto w-full max-w-[880px] px-6 py-20 text-left sm:px-10 sm:py-24">
          <div style={{ maxWidth: 560 }}>
          <span
            style={{
              fontFamily: "var(--f-body)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
            }}
          >
            About
          </span>
          <h2
            className="mt-3"
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "var(--ink)",
            }}
          >
            A side project, not a startup.
          </h2>
          <p
            className="mt-3 text-[15px] leading-[1.55]"
            style={{ color: "var(--ink-soft)" }}
          >
            Built by{" "}
            <a
              href="https://avivzommer.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 align-middle"
              style={{
                color: "var(--ink)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              <img
                src="/aviv-portrait.jpeg"
                alt=""
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  objectFit: "cover",
                  objectPosition: "center 30%",
                  display: "inline-block",
                }}
              />
              Aviv Zommer
            </a>
            , a product designer who&rsquo;s spent years reviewing portfolios.
            Made to give more designers an honest read, faster.
          </p>
          </div>
        </section>
      </main>

      <footer
        className="mt-8"
        style={{ borderTop: "1px solid rgba(17, 17, 17, 0.08)" }}
      >
        <div className="mx-auto flex w-full max-w-[880px] flex-wrap items-center justify-between gap-3 px-6 py-6 sm:px-10">
          <span
            style={{
              fontFamily: "var(--f-body)",
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            &copy; 2026 Roastfolio
          </span>
          <span
            className="flex items-center gap-5"
            style={{
              fontFamily: "var(--f-body)",
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            <a
              href="https://avivzommer.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--ink)]"
            >
              avivzommer.com
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
