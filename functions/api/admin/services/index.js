import { json, fail, readJson, safeText, asInt } from '../../../_lib/http.js';
import { requireAdmin, requireCsrf } from '../../../_lib/auth.js';
import { randomId } from '../../../_lib/crypto.js';
import { logActivity } from '../../../_lib/db.js';
import { loadServices } from '../../../_lib/services.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const services = await loadServices(env.DB, true);
    const { results: categories } = await env.DB.prepare('SELECT * FROM service_categories ORDER BY sort_order, name').all();
    return json({ ok: true, services, categories });
  } catch (error) {
    return fail('Data layanan gagal dimuat.', 500, { error: error.message });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const csrfError = requireCsrf(request, auth.session);
    if (csrfError) return csrfError;
    const payload = await readJson(request);
    const name = safeText(payload.name, 140);
    const slug = safeText(payload.slug, 140).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const categoryId = safeText(payload.category_id, 80);
    if (name.length < 2 || !slug || !categoryId) return fail('Nama, slug, dan kategori wajib diisi.', 422);
    const category = await env.DB.prepare('SELECT id FROM service_categories WHERE id = ?').bind(categoryId).first();
    if (!category) return fail('Kategori tidak ditemukan.', 422);
    const id = randomId();
    await env.DB.prepare(`
      INSERT INTO services (
        id, category_id, name, slug, short_description, description,
        pricing_type, estimated_days_min, estimated_days_max, revision_note,
        sort_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, categoryId, name, slug, safeText(payload.short_description, 500) || null,
      safeText(payload.description, 4000) || null,
      ['fixed', 'starting_from', 'consultation'].includes(payload.pricing_type) ? payload.pricing_type : 'starting_from',
      asInt(payload.estimated_days_min, 1), asInt(payload.estimated_days_max, 7),
      safeText(payload.revision_note, 500) || null, asInt(payload.sort_order, 0), payload.is_active === false ? 0 : 1,
    ).run();
    await logActivity(env.DB, request, auth.session.admin_id, 'service_created', 'service', id, name);
    return json({ ok: true, id }, 201);
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) return fail('Slug layanan sudah digunakan.', 409);
    return fail('Layanan gagal dibuat.', 500, { error: error.message });
  }
}
