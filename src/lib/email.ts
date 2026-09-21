/**
 * Transactional email helpers. Only Resend is wired up.
 *
 * All senders are best-effort: if the required env vars are missing (e.g. in
 * local dev with no key set), they log a warning and no-op instead of
 * throwing. This keeps the app's write paths responsive and un-fragile.
 *
 * Required env for production:
 *   - RESEND_API_KEY         API key from resend.com
 *   - FEEDBACK_NOTIFY_EMAIL  where to send the alert
 *   - EMAIL_FROM             sender (must be on a Resend-verified domain,
 *                            e.g. `Roastfolio <hello@your-domain.com>`)
 */

import { Resend } from "resend";

const SENTIMENT_LABEL: Record<string, { label: string; emoji: string }> = {
  helpful: { label: "Spot on", emoji: "🎯" },
  mostly: { label: "Mostly useful", emoji: "👍" },
  somewhat: { label: "Somewhat", emoji: "🤔" },
  off: { label: "Missed the mark", emoji: "😕" },
};

function parseComment(raw: string | null): { sentiment: string | null; text: string } {
  if (!raw) return { sentiment: null, text: "" };
  const m = raw.match(/^\[([^\]]+)\]\s*(.*)$/s);
  if (!m) return { sentiment: null, text: raw };
  return {
    sentiment: m[1] === "no-sentiment" ? null : m[1],
    text: m[2],
  };
}

export interface FeedbackNotification {
  reviewId: string;
  helpful: boolean;
  comment: string | null;
  portfolioUrl: string;
  siteBaseUrl: string; // e.g. https://roastfolio.up.railway.app
}

/**
 * Send an email to the site owner when a user submits review feedback.
 * Fire-and-forget from the caller — never awaits, never throws upstream.
 */
export async function sendFeedbackNotification(
  data: FeedbackNotification,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_NOTIFY_EMAIL;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !to || !from) {
    console.warn(
      "[email] Skipping feedback notification — RESEND_API_KEY, FEEDBACK_NOTIFY_EMAIL, or EMAIL_FROM is not set.",
    );
    return;
  }

  const { sentiment, text } = parseComment(data.comment);
  const sent = sentiment ? SENTIMENT_LABEL[sentiment] : null;
  const verdictLine = sent
    ? `${sent.emoji} ${sent.label}`
    : data.helpful
      ? "👍 Helpful"
      : "👎 Not helpful";

  const reviewUrl = `${data.siteBaseUrl}/r/${data.reviewId}`;
  const portfolioHost = data.portfolioUrl.replace(/^https?:\/\//, "");

  const subject = `New feedback: ${verdictLine} — ${portfolioHost}`;

  const textBody =
    `${verdictLine}\n\n` +
    (text ? `“${text}”\n\n` : "(no comment)\n\n") +
    `Portfolio: ${data.portfolioUrl}\n` +
    `Review:    ${reviewUrl}\n`;

  const htmlBody = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.55;color:#111;max-width:560px">
      <p style="margin:0 0 12px;font-size:14px;color:#4A4640;text-transform:uppercase;letter-spacing:0.12em;font-weight:600">New review feedback</p>
      <h1 style="margin:0 0 20px;font-size:24px;font-weight:700">${verdictLine}</h1>
      ${text ? `<blockquote style="margin:0 0 20px;padding:14px 18px;background:#FDDDBB;border-left:3px solid #111;border-radius:8px;font-size:15px">${escapeHtml(text)}</blockquote>` : `<p style="margin:0 0 20px;color:#4A4640;font-style:italic">(no comment)</p>`}
      <p style="margin:0 0 4px;font-size:14px"><strong>Portfolio:</strong> <a href="${data.portfolioUrl}" style="color:#111">${portfolioHost}</a></p>
      <p style="margin:0 0 20px;font-size:14px"><strong>Review:</strong> <a href="${reviewUrl}" style="color:#111">Open in Roastfolio →</a></p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
  } catch (err) {
    // Log but never throw — user's feedback submission must still succeed.
    console.error("[email] Failed to send feedback notification:", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
