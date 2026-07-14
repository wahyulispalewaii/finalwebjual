import { json, fail, readJson, safeText, asInt } from '../../../_lib/http.js';
import { requireAdmin, requireCsrf } from '../../../_lib/auth.js';
import { logActivity } from '../../../_lib/db.js';

export async function onRequestPatch({ request, env, params }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const csrfError = requireCsrf(request, auth.session);
    if (csrfError) return csrfError;
    const payload = await readJson(request);
    const current = await env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(params.id).first();
    if (!current) return fail('Layanan tidak ditemukan.', 404);
    const name = payload.name === undefined ? current.name : safeText(payload.name, 140);
    const slug = payload.slug === undefined ? current.slug : safeText(payload.slug, 140).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const categoryId = payload.category_id === undefined ? current.category_id : safeText(payload.category_id, 80);
    if (!name || !slug || !categoryId) return fail('Nama, slug, dan kategori tidak boleh kosong.', 422);
    await env.DB.prepare(`
      UPDATE services SET
        category_id = ?, name = ?, slug = ?, short_description = ?, description = ?,
        pricing_type = ?, estimated_days_min = ?, estimated_days_max = ?, revision_note = ?,
        sort_order = ?, is_active = ?
      WHERE id = ?
    `).bind(
      categoryId, name, slug,
      payload.short_description === undefined ? current.short_description : safeText(payload.short_description, 500) || null,
      payload.description === undefined ? current.description : safeText(payload.description, 4000) || null,
      payload.pricing_type === undefined ? current.pricing_type : payload.pricing_type,
      payload.estimated_days_min === undefined ? current.estimated_days_min : asInt(payload.estimated_days_min, 1),
      payload.estimated_days_max === undefined ? current.estimated_days_max : asInt(payload.estimated_days_max, 7),
      payload.revision_note === undefined ? current.revision_note : safeText(payload.revision_note, 500) || null,
      payload.sort_order === undefined ? current.sort_order : asInt(payload.sort_order, 0),
      payload.is_active === undefined ? current.is_active : (payload.is_active ? 1 : 0),
      params.id,
    ).run();
    await logActivity(env.DB, request, auth.session.admin_id, 'service_updated', 'service', params.id, name);
    return json({ ok: true });
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return fail('Slug layanan sudah digunakan.', 409);
    return fail('Layanan gagal diperbarui.', 500, { error: error.message });
  }
}
