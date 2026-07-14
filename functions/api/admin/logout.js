import { json } from '../../_lib/http.js';
import { destroyAdminSession, getAdminSession, requireCsrf } from '../../_lib/auth.js';
import { logActivity } from '../../_lib/db.js';

export async function onRequestPost({ request, env }) {
  const session = await getAdminSession(env.DB, request);
  if (session) {
    const csrfError = requireCsrf(request, session);
    if (csrfError) return csrfError;
    await logActivity(env.DB, request, session.admin_id, 'admin_logout', 'admin', session.admin_id, 'Admin keluar dari dashboard.');
  }
  const cookie = await destroyAdminSession(env.DB, request);
  return json({ ok: true }, 200, { 'set-cookie': cookie });
}
