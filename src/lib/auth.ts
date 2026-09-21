/**
 * Admin auth for V1: HMAC-signed cookie session.
 *
 * No DB sessions table — the cookie is self-validating. Restart-proof,
 * one-user, single password (set via ADMIN_PASSWORD env). The signing key
 * lives in ADMIN_SECRET. A leaked secret means anyone can forge sessions,
 * so it stays in .env.local only.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SECRET is not set. Add it to .env.local before using admin auth.",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

/** Returns the cookie value to set on successful login. */
export function makeSessionToken(now: number = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = String(expiresAt);
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

/** Validates a cookie value. Returns true iff well-formed, not expired, signed correctly. */
export function verifySessionToken(
  token: string | undefined,
  now: number = Date.now(),
): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  // Constant-time compare on the signature.
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;
  return expiresAt > now;
}

/** Server-only: reads the cookie via next/headers and verifies it. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

/** Server-only: sets the signed admin cookie. */
export async function setAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, makeSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

/** Server-only: clears the admin cookie. */
export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
