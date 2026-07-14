import { json, fail, readJson, normalizeEmail } from '../../_lib/http.js';
import { verifyPassword } from '../../_lib/crypto.js';
import { createAdminSession } from '../../_lib/auth.js';
import { logActivity } from '../../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    const payload = await readJson(request);
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || '');
    const admin = await env.DB.prepare('SELECT * FROM admins WHERE email = ? LIMIT 1').bind(email).first();
    if (!admin || !admin.is_active) return fail('Email atau password salah.', 401);
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return fail('Akun sementara dikunci karena terlalu banyak percobaan. Coba lagi nanti.', 423);
    }

    const valid = await verifyPassword(password, admin.password_salt, Number(admin.password_iterations), admin.password_hash);
    if (!valid) {
      const attempts = Number(admin.failed_attempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null;
      await env.DB.prepare('UPDATE admins SET failed_attempts = ?, locked_until = ? WHERE id = ?').bind(attempts >= 5 ? 0 : attempts, lockedUntil, admin.id).run();
      return fail('Email atau password salah.', 401);
    }

    await env.DB.prepare(`
      UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(admin.id).run();
    await env.DB.prepare('DELETE FROM admin_sessions WHERE admin_id = ? AND expires_at <= ?').bind(admin.id, new Date().toISOString()).run();
    const session = await createAdminSession(env.DB, request, admin.id);
    await logActivity(env.DB, request, admin.id, 'admin_login', 'admin', admin.id, 'Admin masuk ke dashboard.');
    return json({
      ok: true,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      csrf_token: session.csrfToken,
    }, 200, { 'set-cookie': session.cookie });
  } catch (error) {
    return fail('Login gagal diproses.', 500, { error: error.message });
  }
}
