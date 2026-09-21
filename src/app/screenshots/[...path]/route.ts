import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * Explicit screenshot route handler.
 *
 * On Railway, screenshots are written to a mounted volume at
 * /app/public/screenshots/<id>/<file>.png. Next.js's built-in public/ serving
 * does not consistently surface files written *after* build, especially when a
 * volume is mounted on top of the directory. This route reads the bytes from
 * disk on each request and is therefore decoupled from Next.js's public/
 * scanning behavior.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;

  // Path-traversal guard: reject any segment containing "..", "/", or "\".
  if (
    !segments?.length ||
    segments.some((s) => s.includes("..") || s.includes("/") || s.includes("\\"))
  ) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const filePath = path.join(
    process.cwd(),
    "public",
    "screenshots",
    ...segments,
  );

  try {
    const buf = await readFile(filePath);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
