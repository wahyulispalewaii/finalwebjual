import { json, fail, readJson, safeText, asInt } from '../../../_lib/http.js';
import { requireAdmin, requireCsrf } from '../../../_lib/auth.js';
import { randomId } from '../../../_lib/crypto.js';
import { logActivity } from '../../../_lib/db.js';

export async function onRequestPatch({ request, env, params }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const csrfError = requireCsrf(request, auth.session);
    if (csrfError) return csrfError;
    const payload = await readJson(request);
    const current = await env.DB.prepare('SELECT * FROM service_packages WHERE id = ?').bind(params.id).first();
    if (!current) return fail('Paket tidak ditemukan.', 404);
    await env.DB.prepare(`
      UPDATE service_packages SET
        name = ?, slug = ?, description = ?, price = ?, price_label = ?, is_featured = ?,
        estimated_days_min = ?, estimated_days_max = ?, revision_limit = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `).bind(
      payload.name === undefined ? current.name : safeText(payload.name, 120),
      payload.slug === undefined ? current.slug : safeText(payload.slug, 120).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      payload.description === undefined ? current.description : safeText(payload.description, 1000) || null,
      payload.price === undefined ? current.price : Math.max(0, asInt(payload.price, 0)),
      payload.price_label === undefined ? current.price_label : safeText(payload.price_label, 80) || null,
      payload.is_featured === undefined ? current.is_featured : (payload.is_featured ? 1 : 0),
      payload.estimated_days_min === undefined ? current.estimated_days_min : asInt(payload.estimated_days_min, 1),
      payload.estimated_days_max === undefined ? current.estimated_days_max : asInt(payload.estimated_days_max, 7),
      payload.revision_limit === undefined ? current.revision_limit : (payload.revision_limit === null ? null : asInt(payload.revision_limit, 1)),
      payload.sort_order === undefined ? current.sort_order : asInt(payload.sort_order, 0),
      payload.is_active === undefined ? current.is_active : (payload.is_active ? 1 : 0),
      params.id,
    ).run();
    if (Array.isArray(payload.features)) {
      await env.DB.prepare('DELETE FROM package_features WHERE package_id = ?').bind(params.id).run();
      const features = payload.features.map((feature) => safeText(feature, 300)).filter(Boolean).slice(0, 20);
      if (features.length) {
        await env.DB.batch(features.map((feature, index) => env.DB.prepare(`
          INSERT INTO package_features (id, package_id, feature_text, sort_order) VALUES (?, ?, ?, ?)
        `).bind(randomId(), params.id, feature, (index + 1) * 10)));
      }
    }
    await logActivity(env.DB, request, auth.session.admin_id, 'package_updated', 'package', params.id, current.name);
    return json({ ok: true });
  } catch (error) {
    return fail('Paket gagal diperbarui.', 500, { error: error.message });
  }
}
