import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';

const ADMIN_SESSION_COOKIE_NAME = 'thegame_admin_session';
const ADMIN_SESSION_PATH = '/api/admin';
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PORTAL_PASSPHRASE?.trim());
}

export function verifyAdminPassphrase(passphrase: string): boolean {
  const expected = process.env.ADMIN_PORTAL_PASSPHRASE?.trim();
  if (!expected) {
    return false;
  }

  return safeEqual(passphrase.trim(), expected);
}

export function issueAdminSessionCookie(
  req: Request,
  res: Response,
): void {
  const signingKey = process.env.ADMIN_PORTAL_PASSPHRASE?.trim();
  if (!signingKey) {
    throw new Error('Admin auth is not configured');
  }

  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  const payload = `v1.${expiresAt}`;
  const signature = sign(payload, signingKey);

  res.cookie(ADMIN_SESSION_COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    maxAge: ADMIN_SESSION_TTL_MS,
    path: ADMIN_SESSION_PATH,
    sameSite: 'lax',
    secure: isSecureRequest(req),
  });
}

export function clearAdminSessionCookie(
  req: Request,
  res: Response,
): void {
  res.clearCookie(ADMIN_SESSION_COOKIE_NAME, {
    httpOnly: true,
    path: ADMIN_SESSION_PATH,
    sameSite: 'lax',
    secure: isSecureRequest(req),
  });
}

export function hasValidAdminSession(req: Request): boolean {
  const signingKey = process.env.ADMIN_PORTAL_PASSPHRASE?.trim();
  if (!signingKey) {
    return false;
  }

  const token = readCookieValue(
    req.headers.cookie,
    ADMIN_SESSION_COOKIE_NAME,
  );
  if (!token) {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    return false;
  }

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  const payload = `${parts[0]}.${parts[1]}`;
  const expectedSignature = sign(payload, signingKey);

  return safeEqual(parts[2], expectedSignature);
}

function sign(payload: string, signingKey: string) {
  return createHmac('sha256', signingKey)
    .update(payload)
    .digest('base64url');
}

function readCookieValue(
  cookieHeader: string | undefined,
  cookieName: string,
) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name === cookieName) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function isSecureRequest(req: Request): boolean {
  if (req.secure) {
    return true;
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string') {
    return forwardedProto.split(',')[0]?.trim() === 'https';
  }

  if (Array.isArray(forwardedProto)) {
    return forwardedProto[0]?.split(',')[0]?.trim() === 'https';
  }

  return process.env.NODE_ENV === 'production';
}
