import { json, fail, safeText } from '../../../_lib/http.js';
import { requireAdmin } from '../../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const url = new URL(request.url);
    const status = safeText(url.searchParams.get('status'), 30) || 'pending';
    const where = status === 'all' ? '' : 'WHERE p.status = ?';
    const statement = env.DB.prepare(`
      SELECT
        p.*, o.order_code, o.tracking_token, o.total_amount,
        i.invoice_number, c.name AS customer_name, c.whatsapp
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN invoices i ON i.id = p.invoice_id
      JOIN customers c ON c.id = o.customer_id
      ${where}
      ORDER BY p.created_at DESC LIMIT 200
    `);
    const { results } = status === 'all' ? await statement.all() : await statement.bind(status).all();
    return json({ ok: true, payments: results });
  } catch (error) {
    return fail('Daftar pembayaran gagal dimuat.', 500, { error: error.message });
  }
}
