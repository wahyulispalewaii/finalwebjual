import { json, fail, readJson, normalizeEmail, isValidEmail, safeText } from '../../_lib/http.js';
import { hashPassword, randomId } from '../../_lib/crypto.js';
import { createAdminSession } from '../../_lib/auth.js';
import { logActivity } from '../../_lib/db.js';

export async function onRequestGet({ env }) {
  try {
    const row = await env.DB.prepare('SELECT COUNT(*) AS total FROM admins').first();
    return json({ ok: true, setup_required: Number(row.total) === 0 });
  } catch (error) {
    return fail('Status setup gagal diperiksa.', 500, { error: error.message });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const count = await env.DB.prepare('SELECT COUNT(*) AS total FROM admins').first();
    if (Number(count.total) > 0) return fail('Setup admin sudah dikunci.', 409);
    const payload = await readJson(request);
    const name = safeText(payload.name, 100);
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || '');
    if (name.length < 2) return fail('Nama admin tidak valid.', 422);
    if (!isValidEmail(email)) return fail('Email admin tidak valid.', 422);
    if (password.length < 10) return fail('Password minimal 10 karakter.', 422);
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return fail('Password harus memuat huruf besar, huruf kecil, dan angka.', 422);
    }

    const adminId = randomId();
    const passwordData = await hashPassword(password);
    await env.DB.prepare(`
      INSERT INTO admins (
        id, name, email, password_hash, password_salt, password_iterations, role
      ) VALUES (?, ?, ?, ?, ?, ?, 'owner')
    `).bind(adminId, name, email, passwordData.hash, passwordData.salt, passwordData.iterations).run();

    const session = await createAdminSession(env.DB, request, adminId);
    await logActivity(env.DB, request, adminId, 'admin_setup', 'admin', adminId, 'Akun pemilik pertama dibuat.');
    return json({ ok: true, admin: { id: adminId, name, email, role: 'owner' }, csrf_token: session.csrfToken }, 201, {
      'set-cookie': session.cookie,
    });
  } catch (error) {
    return fail('Setup admin gagal.', 500, { error: error.message });
  }
}
