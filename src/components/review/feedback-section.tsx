"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, Check, Pencil, ArrowUp } from "lucide-react";
import { submitFeedback } from "@/lib/actions";

const SENTIMENTS = [
  { id: "helpful", label: "Spot on", emoji: "🎯" },
  { id: "mostly", label: "Mostly useful", emoji: "👍" },
  { id: "somewhat", label: "Somewhat", emoji: "🤔" },
  { id: "off", label: "Missed the mark", emoji: "😕" },
];

const SENTIMENT_TO_HELPFUL: Record<string, boolean> = {
  helpful: true,
  mostly: true,
  somewhat: false,
  off: false,
};

/**
 * Feedback section — sentiment pills + textarea + submit.
 * Saves a Feedback row to the DB; tracks state in localStorage per browser.
 */
export function FeedbackSection({ reviewId }: { reviewId: string }) {
  const FB_KEY = `pr_feedback_${reviewId}`;
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FB_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.sentiment) setSentiment(d.sentiment);
      if (d.text) setText(d.text);
      if (d.submitted) setSubmitted(true);
    } catch {}
  }, [FB_KEY]);

  useEffect(() => {
    if (submitted) return;
    try {
      localStorage.setItem(
        FB_KEY,
        JSON.stringify({ sentiment, text, submitted: false }),
      );
    } catch {}
  }, [sentiment, text, submitted, FB_KEY]);

  const canSubmit = text.trim().length > 0 || sentiment !== null;

  const onSubmit = () => {
    if (!canSubmit || pending) return;
    const helpful = sentiment ? SENTIMENT_TO_HELPFUL[sentiment] : true;
    const comment = `[${sentiment ?? "no-sentiment"}] ${text}`.trim();
    startTransition(async () => {
      await submitFeedback(reviewId, helpful, comment);
      try {
        localStorage.setItem(
          FB_KEY,
          JSON.stringify({
            sentiment,
            text,
            submitted: true,
            ts: new Date().toISOString(),
          }),
        );
      } catch {}
      setSubmitted(true);
    });
  };

  const onReset = () => {
    setSubmitted(false);
    setSentiment(null);
    setText("");
    try {
      localStorage.removeItem(FB_KEY);
    } catch {}
  };

  return (
    <section id="feedback" className="reveal">
      <div
        className="relative overflow-hidden px-9 pt-8.5 pb-9"
        style={{
          background: "var(--s-container)",
          color: "var(--on-surface)",
          borderRadius: "var(--r-xl)",
        }}
      >
        {!submitted ? (
          <div className="relative">
            <span
              className="inline-flex h-[34px] items-center gap-2 pr-4 pl-3.5 text-xs font-bold tracking-widest uppercase whitespace-nowrap"
              style={{
                background: "var(--pop-pink)",
                color: "var(--pop-pink-ink)",
                borderRadius: "var(--r-full)",
              }}
            >
              <Sparkles className="size-3.5" />
              Your turn
            </span>
            <h2
              className="mt-5 max-w-[18ch] text-balance text-[36px] font-bold leading-[1.08] tracking-tight"
              style={{ color: "var(--on-surface)" }}
            >
              Was this review on point?
            </h2>
            <p
              className="mt-3.5 max-w-[62ch] text-[16px] leading-[1.55]"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Tell us what landed and what didn&rsquo;t.{" "}
              <b style={{ color: "var(--on-surface)" }}>
                Your notes directly shape how the next review is written
              </b>{" "}
              — this is the fastest way to make these reports sharper.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5" role="group" aria-label="Overall rating">
              {SENTIMENTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSentiment(sentiment === s.id ? null : s.id)}
                  aria-pressed={sentiment === s.id}
                  className="inline-flex h-11 cursor-pointer items-center gap-2.5 border px-5 text-sm font-semibold transition-colors whitespace-nowrap"
                  style={{
                    background:
                      sentiment === s.id ? "var(--m3-primary)" : "var(--s-lowest)",
                    borderColor:
                      sentiment === s.id
                        ? "var(--m3-primary)"
                        : "var(--outline-variant)",
                    color:
                      sentiment === s.id ? "var(--m3-on-primary)" : "var(--on-surface)",
                    borderRadius: "var(--r-full)",
                  }}
                >
                  <span className="text-base leading-none">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-5.5">
              <label
                htmlFor="fb-text"
                className="mb-3 block text-[11px] font-bold tracking-wide uppercase"
                style={{ color: "var(--on-surface-variant)" }}
              >
                What would make this review more useful?
              </label>
              <textarea
                id="fb-text"
                maxLength={1200}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. The action priorities were clear, but I'd love more detail on how to phrase the 'why this, not that' paragraph…"
                className="block w-full min-h-[124px] resize-y border px-4.5 py-4 text-[15px] leading-[1.6] outline-none transition-colors"
                style={{
                  background: "var(--s-lowest)",
                  borderColor: "var(--outline-variant)",
                  color: "var(--on-surface)",
                  borderRadius: "var(--r-lg)",
                }}
              />
              <div className="mt-2 flex justify-end">
                <span
                  className="text-[11.5px] font-medium"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  {text.length}/1200
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit || pending}
                className="m3-btn m3-btn--primary m3-btn--lg"
              >
                <ArrowUp className="size-4" />
                {pending ? "Sending…" : "Send feedback"}
              </button>
              <span
                className="text-[13px]"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Recorded on this review.
              </span>
            </div>
          </div>
        ) : (
          <div className="relative flex items-start gap-4.5">
            <span
              className="flex size-[52px] flex-none items-center justify-center rounded-full"
              style={{
                background: "var(--rt-strong-bg)",
                color: "var(--rt-strong)",
              }}
            >
              <Check className="size-5" />
            </span>
            <div className="min-w-0">
              <h2
                className="text-[36px] font-bold leading-[1.08] tracking-tight"
                style={{ color: "var(--on-surface)" }}
              >
                Thank you — feedback recorded.
              </h2>
              <p
                className="mt-3.5 text-[16px] leading-[1.55]"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {sentiment ? (
                  <>
                    You rated this review{" "}
                    <b style={{ color: "var(--on-surface)" }}>
                      &ldquo;{SENTIMENTS.find((s) => s.id === sentiment)?.label}&rdquo;
                    </b>
                    .{" "}
                  </>
                ) : null}
                We use every note to tune the next report.
              </p>
              {text.trim() && (
                <blockquote
                  className="mt-4.5 p-4.5 italic"
                  style={{
                    background: "var(--s-lowest)",
                    borderLeft: "3px solid var(--m3-primary)",
                    borderRadius: "var(--r-lg)",
                    color: "var(--on-surface)",
                    fontSize: 15,
                    lineHeight: 1.6,
                    overflowWrap: "anywhere",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {text.trim()}
                </blockquote>
              )}
              <button
                type="button"
                onClick={onReset}
                className="m3-btn mt-5"
                style={{ height: 44, padding: "0 18px", fontSize: 13.5 }}
              >
                <Pencil className="size-3.5" />
                Edit response
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
