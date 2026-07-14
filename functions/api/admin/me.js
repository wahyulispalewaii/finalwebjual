import { json } from '../../_lib/http.js';
import { requireAdmin } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(env.DB, request);
  if (auth.error) return auth.error;
  const { session } = auth;
  return json({
    ok: true,
    admin: { id: session.admin_id, name: session.name, email: session.email, role: session.role },
    csrf_token: session.csrf_token,
  });
}
