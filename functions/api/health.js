import { json, fail } from '../_lib/http.js';

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) return fail('Binding D1 DB belum dikonfigurasi.', 503);
    const row = await env.DB.prepare('SELECT 1 AS ok').first();
    return json({ ok: true, database: row?.ok === 1, timestamp: new Date().toISOString() });
  } catch (error) {
    return fail('Pemeriksaan sistem gagal.', 500, { error: error.message });
  }
}
