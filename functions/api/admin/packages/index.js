import { json, fail, readJson, safeText, asInt } from '../../../_lib/http.js';
import { requireAdmin, requireCsrf } from '../../../_lib/auth.js';
import { randomId } from '../../../_lib/crypto.js';
import { logActivity } from '../../../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const csrfError = requireCsrf(request, auth.session);
    if (csrfError) return csrfError;
    const payload = await readJson(request);
    const serviceId = safeText(payload.service_id, 80);
    const service = await env.DB.prepare('SELECT id FROM services WHERE id = ?').bind(serviceId).first();
    if (!service) return fail('Layanan tidak ditemukan.', 422);
    const name = safeText(payload.name, 120);
    const slug = safeText(payload.slug || name, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!name || !slug) return fail('Nama paket wajib diisi.', 422);
    const id = randomId();
    await env.DB.prepare(`
      INSERT INTO service_packages (
        id, service_id, name, slug, description, price, price_label, is_featured,
        estimated_days_min, estimated_days_max, revision_limit, sort_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, serviceId, name, slug, safeText(payload.description, 1000) || null,
      Math.max(0, asInt(payload.price, 0)), safeText(payload.price_label, 80) || null,
      payload.is_featured ? 1 : 0, asInt(payload.estimated_days_min, 1), asInt(payload.estimated_days_max, 7),
      payload.revision_limit === null ? null : asInt(payload.revision_limit, 1), asInt(payload.sort_order, 0),
      payload.is_active === false ? 0 : 1,
    ).run();
    const features = Array.isArray(payload.features) ? payload.features.slice(0, 20) : [];
    if (features.length) {
      await env.DB.batch(features.map((feature, index) => env.DB.prepare(`
        INSERT INTO package_features (id, package_id, feature_text, sort_order) VALUES (?, ?, ?, ?)
      `).bind(randomId(), id, safeText(feature, 300), (index + 1) * 10)));
    }
    await logActivity(env.DB, request, auth.session.admin_id, 'package_created', 'package', id, name);
    return json({ ok: true, id }, 201);
  } catch (error) {
    return fail('Paket gagal dibuat.', 500, { error: error.message });
  }
}
