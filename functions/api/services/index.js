import { json, fail } from '../../_lib/http.js';
import { loadServices } from '../../_lib/services.js';

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return fail('Database belum dikonfigurasi.', 503);
    const services = await loadServices(env.DB, false);
    return json({ ok: true, services }, 200, { 'cache-control': 'public, max-age=60' });
  } catch (error) {
    return fail('Layanan belum dapat dimuat.', 500, { error: error.message });
  }
}
