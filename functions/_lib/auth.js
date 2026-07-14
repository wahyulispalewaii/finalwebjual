import { randomId, randomToken, sha256Hex } from './crypto.js';
import { clientIp, fail } from './http.js';

const COOKIE_NAME = 'dibantu_session';
const SESSION_SECONDS = 60 * 60 * 12;

export function parseCookies(request) {
  const header = request.headers.get('cookie') || '';
  return Object.fromEntries(
    header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
      const index = part.indexOf('=');
      return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
    }),
  );
}

export async function createAdminSession(db, request, adminId) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const csrfToken = randomToken(24);
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await db.prepare(`
    INSERT INTO admin_sessions (
      id, admin_id, token_hash, csrf_token, user_agent, ip_address, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    randomId(),
    adminId,
    tokenHash,
    csrfToken,
    (request.headers.get('user-agent') || '').slice(0, 500),
    clientIp(request),
    expiresAt,
  ).run();
  return {
    token,
    csrfToken,
    cookie: `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`,
  };
}

export async function getAdminSession(db, request) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await db.prepare(`
    SELECT
      s.id AS session_id,
      s.csrf_token,
      s.expires_at,
      a.id AS admin_id,
      a.name,
      a.email,
      a.role,
      a.is_active
    FROM admin_sessions s
    JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND a.is_active = 1
    LIMIT 1
  `).bind(tokenHash, new Date().toISOString()).first();
  if (!row) return null;
  await db.prepare('UPDATE admin_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').bind(row.session_id).run();
  return row;
}

export async function requireAdmin(db, request) {
  const session = await getAdminSession(db, request);
  if (!session) return { error: fail('Sesi admin tidak valid atau telah berakhir.', 401) };
  return { session };
}

export function requireCsrf(request, session) {
  const token = request.headers.get('x-csrf-token') || '';
  if (!token || token !== session.csrf_token) {
    return fail('Token keamanan tidak valid. Muat ulang halaman dan coba lagi.', 403);
  }
  return null;
}

export async function destroyAdminSession(db, request) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (token) {
    const tokenHash = await sha256Hex(token);
    await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).run();
  }
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
