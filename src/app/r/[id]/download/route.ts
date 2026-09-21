import { prisma } from "@/lib/db";
import { buildReviewHtml } from "@/lib/download-html";
import type { ReviewReport } from "@/lib/types";

function safeFilename(rawUrl: string, createdAt: Date): string {
  let host = "portfolio";
  try {
    host = new URL(rawUrl).host.replace(/^www\./, "");
  } catch {
    // keep default
  }
  const slug = host.replace(/[^a-z0-9.-]+/gi, "-").slice(0, 60);
  const date = createdAt.toISOString().slice(0, 10);
  return `portfolio-review-${slug}-${date}.html`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const row = await prisma.review.findUnique({ where: { id } });
  if (!row || row.status !== "completed" || !row.report) {
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>Not available</title><body style="font-family: system-ui; padding: 40px;"><h1>Review not ready</h1><p>This review either doesn't exist or hasn't completed yet.</p></body>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const report = JSON.parse(row.report) as ReviewReport;
  const html = await buildReviewHtml(report, { createdAt: row.createdAt });
  const filename = safeFilename(row.portfolioUrl, row.createdAt);

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
