"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminAuthConfigured = isAdminAuthConfigured;
exports.verifyAdminPassphrase = verifyAdminPassphrase;
exports.issueAdminSessionCookie = issueAdminSessionCookie;
exports.clearAdminSessionCookie = clearAdminSessionCookie;
exports.hasValidAdminSession = hasValidAdminSession;
const node_crypto_1 = require("node:crypto");
const ADMIN_SESSION_COOKIE_NAME = 'thegame_admin_session';
const ADMIN_SESSION_PATH = '/api/admin';
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
function isAdminAuthConfigured() {
    return Boolean(process.env.ADMIN_PORTAL_PASSPHRASE?.trim());
}
function verifyAdminPassphrase(passphrase) {
    const expected = process.env.ADMIN_PORTAL_PASSPHRASE?.trim();
    if (!expected) {
        return false;
    }
    return safeEqual(passphrase.trim(), expected);
}
function issueAdminSessionCookie(req, res) {
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
function clearAdminSessionCookie(req, res) {
    res.clearCookie(ADMIN_SESSION_COOKIE_NAME, {
        httpOnly: true,
        path: ADMIN_SESSION_PATH,
        sameSite: 'lax',
        secure: isSecureRequest(req),
    });
}
function hasValidAdminSession(req) {
    const signingKey = process.env.ADMIN_PORTAL_PASSPHRASE?.trim();
    if (!signingKey) {
        return false;
    }
    const token = readCookieValue(req.headers.cookie, ADMIN_SESSION_COOKIE_NAME);
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
function sign(payload, signingKey) {
    return (0, node_crypto_1.createHmac)('sha256', signingKey)
        .update(payload)
        .digest('base64url');
}
function readCookieValue(cookieHeader, cookieName) {
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
function safeEqual(left, right) {
    if (left.length !== right.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(Buffer.from(left), Buffer.from(right));
}
function isSecureRequest(req) {
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
//# sourceMappingURL=auth.js.map