import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { submitReview } from "@/lib/actions";

// ============================================================================
// Roastfolio — v2 (Claude / Anthropic aesthetic)
// ----------------------------------------------------------------------------
// Warm cream surface + a single coral accent + Tiempos-adjacent serif. The
// signature element is a hand-drawn coral underline arc swept beneath one
// key phrase in the hero — used exactly once on the page.
// ============================================================================

const TOKENS: React.CSSProperties = {
  // Color
  "--bg": "#F5F1E8",
  "--surface": "#FCF9F1",
  "--surface-2": "#EFE9D9",
  "--ink": "#1C1B17",
  "--ink-soft": "#5A574E",
  "--ink-mute": "#8E8A7D",
  "--rule": "#DBD3C0",
  "--coral": "#CC785C",
  "--coral-soft": "#F0D3C5",
  "--moss": "#4F7B5A",
  // Type
  "--f-display": "var(--font-source-serif), 'Iowan Old Style', Georgia, serif",
  "--f-body": "var(--font-inter), system-ui, sans-serif",
  "--f-mono": "var(--font-jetbrains), ui-monospace, monospace",
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

export default async function LandingPageV2({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retry?: string }>;
}) {
  const sp = await searchParams;
  const errorMessage = formatLandingError(sp.error, sp.retry);

  return (
    <div
      style={{
        ...TOKENS,
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "var(--f-body)",
        minHeight: "100vh",
      }}
    >
      {/* ─── Topbar ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 flex h-[72px] items-center px-6 sm:px-12"
        style={{
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "saturate(180%) blur(14px)",
          WebkitBackdropFilter: "saturate(180%) blur(14px)",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <Link href="/v2" className="flex items-baseline gap-2.5">
          {/* Small coral asterisk mark */}
          <span
            aria-hidden
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 22,
              color: "var(--coral)",
              lineHeight: 1,
              transform: "translateY(2px)",
            }}
          >
            ✻
          </span>
          <span
            style={{
              fontFamily: "var(--f-display)",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.012em",
              color: "var(--ink)",
              lineHeight: 1,
            }}
          >
            Roastfolio
          </span>
        </Link>
        <div className="flex-1" />
        <nav
          className="flex items-center gap-7 text-[14px]"
          style={{ color: "var(--ink-soft)" }}
        >
          <a href="#sample" className="hidden hover:text-[var(--ink)] sm:inline">
            What you get
          </a>
          <a href="#process" className="hidden hover:text-[var(--ink)] sm:inline">
            How it works
          </a>
          <a href="#about" className="hover:text-[var(--ink)]">
            About
          </a>
          <Link
            href="/"
            className="text-[12px]"
            style={{
              fontFamily: "var(--f-mono)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--coral)",
              borderBottom: "1px solid var(--coral)",
              paddingBottom: 1,
            }}
          >
            &larr; v1
          </Link>
        </nav>
      </header>

      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          minHeight: "calc(100vh - 72px)",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(204,120,92,0.06) 0%, transparent 55%), linear-gradient(180deg, var(--bg) 0%, #EFE9D9 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1000px] px-6 py-20 sm:px-12">
          {/* Eyebrow */}
          <div className="flex justify-center">
            <span
              style={{
                fontFamily: "var(--f-mono)",
                fontSize: 12,
                letterSpacing: "0.16em",
                color: "var(--coral)",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 1,
                  background: "var(--coral)",
                }}
              />
              A portfolio review service
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 1,
                  background: "var(--coral)",
                }}
              />
            </span>
          </div>

          {/* Headline with coral underline arc on the key phrase */}
          <h1
            className="mt-10 text-center text-balance"
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 500,
              fontSize: "clamp(46px, 6.6vw, 88px)",
              lineHeight: 1.04,
              letterSpacing: "-0.022em",
              color: "var(--ink)",
            }}
          >
            An honest read
            <br />
            on{" "}
            <span style={{ position: "relative", display: "inline-block" }}>
              your portfolio.
              {/* SIGNATURE — hand-drawn coral underline arc, used ONCE on the page */}
              <svg
                aria-hidden
                viewBox="0 0 460 26"
                preserveAspectRatio="none"
                className="absolute"
                style={{
                  left: 0,
                  right: 0,
                  bottom: -10,
                  width: "100%",
                  height: 22,
                }}
              >
                <path
                  d="M6 14 C 80 4, 200 -2, 312 8 S 432 22, 454 18"
                  fill="none"
                  stroke="var(--coral)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          {/* Subhead */}
          <p
            className="mx-auto mt-12 max-w-[60ch] text-center"
            style={{
              fontFamily: "var(--f-display)",
              fontSize: "clamp(18px, 1.6vw, 21px)",
              lineHeight: 1.5,
              color: "var(--ink-soft)",
            }}
          >
            See your portfolio the way a recruiter or hiring manager would —
            what&rsquo;s working, what isn&rsquo;t, and the one move that
            will change how it lands. In about ninety seconds.
          </p>

          {/* Form */}
          <form
            action={submitReview}
            className="mx-auto mt-12 flex w-full flex-col gap-3"
            style={{ maxWidth: 680 }}
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
              className="w-full outline-none transition-all focus:shadow-[0_0_0_4px_rgba(204,120,92,0.18)]"
              style={{
                fontFamily: "var(--f-body)",
                fontSize: 17,
                color: "var(--ink)",
                background: "var(--surface)",
                border: "1px solid var(--rule)",
                borderRadius: 12,
                paddingInline: 22,
                paddingBlock: 22,
              }}
            />

            {/* Heat dial — how do you want the review delivered? */}
            <style>{`
              .rf-heat-v2 {
                color: var(--ink-soft);
                background: var(--surface);
                border: 1px solid var(--rule);
              }
              .rf-heat-v2:hover { border-color: var(--coral); }
              .rf-heat-v2:has(input:checked) {
                background: var(--coral);
                color: #FFFCF5;
                border-color: var(--coral);
              }
            `}</style>
            <fieldset className="mt-1 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <legend
                className="sm:sr-only"
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "var(--ink-mute)",
                  textTransform: "uppercase",
                }}
              >
                Heat level
              </legend>
              <span
                className="hidden sm:inline"
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: "var(--ink-mute)",
                  textTransform: "uppercase",
                  marginRight: 4,
                }}
              >
                Heat
              </span>
              <div className="inline-flex gap-2">
                {(
                  [
                    { value: "chill", label: "Chill", hint: "warmer" },
                    { value: "honest", label: "Honest", hint: "default" },
                    { value: "spicy", label: "Spicy", hint: "blunt" },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="rf-heat-v2 cursor-pointer transition-all"
                    style={{
                      fontFamily: "var(--f-body)",
                      fontSize: 13,
                      fontWeight: 500,
                      borderRadius: 999,
                      paddingInline: 16,
                      paddingBlock: 9,
                    }}
                    title={`${opt.label} — ${opt.hint}`}
                  >
                    <input
                      type="radio"
                      name="heatLevel"
                      value={opt.value}
                      defaultChecked={opt.value === "honest"}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                name="targetSeniority"
                defaultValue="auto"
                className="outline-none"
                style={{
                  fontFamily: "var(--f-body)",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--ink)",
                  background: "var(--surface)",
                  border: "1px solid var(--rule)",
                  borderRadius: 12,
                  paddingInline: 20,
                  paddingBlock: 18,
                  cursor: "pointer",
                  appearance: "none",
                  paddingRight: 44,
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%231C1B17' d='M0 0l5 6 5-6z'/></svg>\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 18px center",
                }}
              >
                <option value="auto">Auto-detect seniority</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
              </select>
              <button
                type="submit"
                className="group inline-flex flex-1 items-center justify-center gap-2.5 transition-all hover:-translate-y-[1px]"
                style={{
                  fontFamily: "var(--f-body)",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--bg)",
                  background: "var(--coral)",
                  border: "1px solid var(--coral)",
                  borderRadius: 12,
                  paddingInline: 28,
                  paddingBlock: 18,
                  cursor: "pointer",
                  boxShadow: "0 10px 30px -14px rgba(204,120,92,0.6)",
                }}
              >
                Roast it
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </form>

          {errorMessage && (
            <div
              className="mx-auto mt-4 max-w-[680px] px-4 py-3 text-[14px]"
              style={{
                background: "var(--coral-soft)",
                color: "#7A1E0C",
                border: "1px solid var(--coral)",
                borderRadius: 10,
              }}
            >
              {errorMessage}
            </div>
          )}

          <p
            className="mx-auto mt-6 text-center text-[13px]"
            style={{
              color: "var(--ink-mute)",
              fontFamily: "var(--f-body)",
            }}
          >
            About 90&ndash;120 seconds &middot; reviewed against real hiring
            signals &middot; no sign-up
          </p>
        </div>
      </section>

      <main
        className="mx-auto grid max-w-[1100px] grid-cols-12 px-6 pt-32 pb-32 sm:px-12"
        style={{ rowGap: 128 }}
      >
        {/* ─── Sample ────────────────────────────────────────────────── */}
        <section id="sample" className="col-span-12">
          <SectionEyebrow>What you&rsquo;ll get</SectionEyebrow>
          <h2
            className="mt-5 max-w-[24ch] text-balance"
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 500,
              fontSize: "clamp(32px, 4.6vw, 52px)",
              lineHeight: 1.06,
              letterSpacing: "-0.018em",
            }}
          >
            One thoughtful page. The signals a hiring manager would notice.
          </h2>

          <article
            className="mt-12"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--rule)",
              borderRadius: 16,
              padding: "clamp(28px, 4vw, 48px)",
              boxShadow:
                "0 1px 0 0 var(--rule), 0 30px 70px -50px rgba(28,27,23,0.22)",
            }}
          >
            {/* Header */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 pb-5"
              style={{ borderBottom: "1px solid var(--rule)" }}
            >
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  color: "var(--ink-mute)",
                }}
              >
                review · jane-doe.design
              </span>
              <span
                style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  color: "var(--ink-mute)",
                }}
              >
                94 seconds
              </span>
            </div>

            <div className="mt-9 flex flex-wrap items-baseline gap-4">
              <BlockLabel>Current signal</BlockLabel>
              <SignalPill>Strong</SignalPill>
            </div>
            <p
              className="mt-5 max-w-[60ch]"
              style={{
                fontFamily: "var(--f-display)",
                fontSize: "clamp(20px, 2.2vw, 26px)",
                lineHeight: 1.4,
                color: "var(--ink)",
              }}
            >
              Your portfolio&rsquo;s doing a lot right. The homepage{" "}
              <CoralUnderline>
                reads as product designer on the first pass
              </CoralUnderline>{" "}
              — and your case studies open with the problem, not the brief.
            </p>

            <Divider />

            <BlockLabel>Main growth lever</BlockLabel>
            <p
              className="mt-3 max-w-[60ch] text-[16px] leading-[1.65]"
              style={{ color: "var(--ink-soft)" }}
            >
              Tighten the visual hierarchy on case studies 1 and 3. The
              problem framing is solid, but a reader has to work to find the
              outcome. Pulling the result into the first scroll will change
              the first-pass impression entirely.
            </p>

            <Divider />

            <BlockLabel>Three concrete next moves</BlockLabel>
            <ol className="mt-4 flex flex-col gap-4">
              {[
                "Reframe case study 1's opening with the actual problem statement, not the brief.",
                "Add a measurable outcome to case study 3 — anything quantitative beats nothing.",
                "Cut the skills grid on the homepage. It dilutes the role focus.",
              ].map((move, i) => (
                <li
                  key={i}
                  className="flex gap-4 text-[15.5px] leading-[1.6]"
                  style={{ color: "var(--ink)" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--f-mono)",
                      fontSize: 12.5,
                      color: "var(--coral)",
                      paddingTop: 4,
                      minWidth: 18,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{move}</span>
                </li>
              ))}
            </ol>
          </article>
        </section>

        {/* ─── Process ───────────────────────────────────────────────── */}
        <section id="process" className="col-span-12">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2
            className="mt-5 max-w-[22ch] text-balance"
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 500,
              fontSize: "clamp(32px, 4.6vw, 52px)",
              lineHeight: 1.06,
              letterSpacing: "-0.018em",
            }}
          >
            Three steps. About a minute and a half of your day.
          </h2>

          <ol className="mt-12 flex flex-col">
            {[
              {
                step: "01",
                title: "Paste your URL",
                body: "Framer, Webflow, Notion, custom — anything that loads in a browser is welcome. Pick the seniority you're aiming for, or let us auto-detect.",
              },
              {
                step: "02",
                title: "Reviewed the way a recruiter would",
                body: "We open your portfolio in a real browser and read the way a hiring lead would — homepage clarity, case study depth, problem framing, visual craft, outcomes. The same rubric they use in calibration meetings.",
              },
              {
                step: "03",
                title: "Get clarity, not just feedback",
                body: "One page back: current signal, what's already working, the single growth lever that matters most, and three concrete next moves you can act on this week.",
              },
            ].map((s) => (
              <li
                key={s.step}
                className="grid grid-cols-12"
                style={{
                  gap: 32,
                  paddingBlock: "clamp(28px, 4vw, 44px)",
                  borderTop: "1px solid var(--rule)",
                }}
              >
                <span
                  className="col-span-2 sm:col-span-1"
                  style={{
                    fontFamily: "var(--f-display)",
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: "clamp(34px, 4.4vw, 52px)",
                    lineHeight: 1,
                    color: "var(--coral)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {s.step}
                </span>
                <div className="col-span-10 sm:col-span-11">
                  <h3
                    style={{
                      fontFamily: "var(--f-display)",
                      fontWeight: 500,
                      fontSize: "clamp(22px, 2.6vw, 28px)",
                      lineHeight: 1.2,
                      letterSpacing: "-0.012em",
                      color: "var(--ink)",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="mt-3 max-w-[64ch] text-[15.5px] leading-[1.65]"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
            <li style={{ borderTop: "1px solid var(--rule)", height: 0 }} />
          </ol>
        </section>

        {/* ─── About ─────────────────────────────────────────────────── */}
        <section id="about" className="col-span-12">
          <div className="grid grid-cols-12" style={{ gap: 40 }}>
            <div className="col-span-12 lg:col-span-4">
              <SectionEyebrow>About</SectionEyebrow>
              <h2
                className="mt-5 text-balance"
                style={{
                  fontFamily: "var(--f-display)",
                  fontWeight: 500,
                  fontStyle: "italic",
                  fontSize: "clamp(30px, 3.8vw, 42px)",
                  lineHeight: 1.06,
                  letterSpacing: "-0.015em",
                  color: "var(--ink)",
                }}
              >
                A side project, not a startup.
              </h2>
            </div>

            <div className="col-span-12 lg:col-span-7 lg:col-start-6">
              <p
                style={{
                  fontFamily: "var(--f-display)",
                  fontWeight: 400,
                  fontSize: "clamp(19px, 1.7vw, 22px)",
                  lineHeight: 1.55,
                  color: "var(--ink)",
                }}
              >
                Roastfolio was built by{" "}
                <a
                  href="https://www.linkedin.com/in/avivzommer/"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--coral)",
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                    textDecorationThickness: 1,
                  }}
                >
                  Aviv Zommer
                </a>
                , a product designer and mentor who&rsquo;s spent years
                reviewing portfolios, helping designers improve how they
                present their work, and supporting career moves.
              </p>
              <p
                className="mt-5 max-w-[60ch] text-[15.5px] leading-[1.7]"
                style={{ color: "var(--ink-soft)" }}
              >
                Most portfolio feedback is hard to get, expensive,
                inconsistent, or slow. Roastfolio is an attempt to close that
                gap &mdash; not to replace mentors, but to make a real read
                available to more designers, faster. If it&rsquo;s useful,
                share it. If it&rsquo;s wrong, tell me.
              </p>
              <p
                className="mt-8"
                style={{
                  fontFamily: "var(--f-display)",
                  fontStyle: "italic",
                  fontSize: 18,
                  color: "var(--coral)",
                }}
              >
                &mdash; Aviv
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--rule)",
          background: "var(--surface-2)",
        }}
      >
        <div
          className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4 px-6 py-7 sm:px-12"
          style={{
            fontFamily: "var(--f-mono)",
            fontSize: 12,
            letterSpacing: "0.06em",
            color: "var(--ink-mute)",
            textTransform: "uppercase",
          }}
        >
          <span>Roastfolio &middot; 2026</span>
          <span>One designer &middot; helping others</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "var(--f-mono)",
        fontSize: 12,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--coral)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 22,
          height: 1,
          background: "var(--coral)",
        }}
      />
      {children}
    </span>
  );
}

function BlockLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--f-mono)",
        fontSize: 11.5,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--ink-mute)",
      }}
    >
      {children}
    </span>
  );
}

function SignalPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--f-body)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "var(--moss)",
        background: "#E1ECE2",
        border: "1px solid var(--moss)",
        padding: "5px 11px",
        borderRadius: 999,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--moss)",
        }}
      />
      {children}
    </span>
  );
}

function Divider() {
  return (
    <div
      style={{
        margin: "32px 0",
        height: 1,
        background: "var(--rule)",
      }}
    />
  );
}

/**
 * Soft coral underline behind text — used for emphasis without the loud
 * yellow highlighter feel. Sits beneath the line, like a hand-drawn mark.
 */
function CoralUnderline({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline",
        background:
          "linear-gradient(180deg, transparent 0%, transparent 70%, var(--coral-soft) 70%, var(--coral-soft) 100%)",
        padding: "0 2px",
      }}
    >
      {children}
    </span>
  );
}
