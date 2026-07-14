import { json, fail, safeText, asInt } from '../../../_lib/http.js';
import { requireAdmin } from '../../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const url = new URL(request.url);
    const status = safeText(url.searchParams.get('status'), 40);
    const search = safeText(url.searchParams.get('search'), 120);
    const limit = Math.min(Math.max(asInt(url.searchParams.get('limit'), 100), 1), 200);
    const conditions = [];
    const bindings = [];
    if (status && status !== 'all') {
      conditions.push('o.status = ?');
      bindings.push(status);
    }
    if (search) {
      conditions.push('(o.order_code LIKE ? OR i.invoice_number LIKE ? OR c.name LIKE ? OR c.whatsapp LIKE ?)');
      const term = `%${search}%`;
      bindings.push(term, term, term, term);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { results } = await env.DB.prepare(`
      SELECT
        o.id, o.order_code, o.tracking_token, o.status, o.payment_mode,
        o.total_amount, o.paid_amount, o.expires_at, o.created_at, o.updated_at,
        c.name AS customer_name, c.whatsapp, c.email,
        i.invoice_number, i.status AS invoice_status, i.minimum_due, i.paid_amount AS invoice_paid_amount,
        (SELECT COUNT(*) FROM payments p WHERE p.order_id = o.id AND p.status = 'pending') AS pending_payments
      FROM orders o
      JOIN customers c ON c.id = o.customer_id
      JOIN invoices i ON i.order_id = o.id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT ?
    `).bind(...bindings, limit).all();
    return json({ ok: true, orders: results });
  } catch (error) {
    return fail('Daftar pesanan gagal dimuat.', 500, { error: error.message });
  }
}
