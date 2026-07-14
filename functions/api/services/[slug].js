import { json, fail } from '../../_lib/http.js';
import { loadServices } from '../../_lib/services.js';

export async function onRequestGet({ env, params }) {
  try {
    const services = await loadServices(env.DB, false);
    const service = services.find((item) => item.slug === params.slug);
    if (!service) return fail('Layanan tidak ditemukan.', 404);
    return json({ ok: true, service }, 200, { 'cache-control': 'public, max-age=60' });
  } catch (error) {
    return fail('Layanan belum dapat dimuat.', 500, { error: error.message });
  }
}
