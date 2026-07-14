import { json, fail, readJson, safeText } from '../../../_lib/http.js';
import { requireAdmin, requireCsrf } from '../../../_lib/auth.js';
import { randomId } from '../../../_lib/crypto.js';
import { logActivity } from '../../../_lib/db.js';

const ALLOWED_STATUSES = new Set([
  'awaiting_confirmation','awaiting_quote','awaiting_payment','payment_review',
  'payment_verified','in_progress','awaiting_review','revision','completed','cancelled',
]);

async function loadOrder(db, id) {
  const order = await db.prepare(`
    SELECT
      o.*, c.name AS customer_name, c.whatsapp, c.email, c.business_name,
      i.id AS invoice_id, i.invoice_number, i.status AS invoice_status,
      i.minimum_due, i.paid_amount AS invoice_paid_amount, i.issued_at,
      i.expires_at AS invoice_expires_at,
      b.project_title, b.description AS brief_description, b.references_text,
      b.desired_deadline, b.additional_notes
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN invoices i ON i.order_id = o.id
    LEFT JOIN project_briefs b ON b.order_id = o.id
    WHERE o.id = ? LIMIT 1
  `).bind(id).first();
  if (!order) return null;
  const [{ results: items }, { results: payments }, { results: history }] = await Promise.all([
    db.prepare(`
      SELECT oi.*, GROUP_CONCAT(oia.addon_name_snapshot, '||') AS addon_names
      FROM order_items oi
      LEFT JOIN order_item_addons oia ON oia.order_item_id = oi.id
      WHERE oi.order_id = ? GROUP BY oi.id ORDER BY oi.created_at
    `).bind(id).all(),
    db.prepare(`SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC`).bind(id).all(),
    db.prepare(`
      SELECT l.*, a.name AS admin_name FROM order_status_logs l
      LEFT JOIN admins a ON a.id = l.changed_by_admin_id
      WHERE l.order_id = ? ORDER BY l.created_at DESC
    `).bind(id).all(),
  ]);
  return {
    ...order,
    items: items.map((item) => ({ ...item, addons: item.addon_names ? item.addon_names.split('||') : [] })),
    payments,
    history,
  };
}

export async function onRequestGet({ request, env, params }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const order = await loadOrder(env.DB, params.id);
    if (!order) return fail('Pesanan tidak ditemukan.', 404);
    return json({ ok: true, order });
  } catch (error) {
    return fail('Detail pesanan gagal dimuat.', 500, { error: error.message });
  }
}

export async function onRequestPatch({ request, env, params }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const csrfError = requireCsrf(request, auth.session);
    if (csrfError) return csrfError;
    const payload = await readJson(request);
    const current = await env.DB.prepare('SELECT id, status FROM orders WHERE id = ?').bind(params.id).first();
    if (!current) return fail('Pesanan tidak ditemukan.', 404);
    const status = payload.status ? safeText(payload.status, 40) : current.status;
    if (!ALLOWED_STATUSES.has(status)) return fail('Status pesanan tidak valid.', 422);
    const notes = safeText(payload.internal_notes, 3000);
    const logNote = safeText(payload.status_note, 1000);

    const statements = [
      env.DB.prepare('UPDATE orders SET status = ?, internal_notes = ? WHERE id = ?').bind(status, notes || null, params.id),
    ];
    if (status !== current.status) {
      statements.push(env.DB.prepare(`
        INSERT INTO order_status_logs (id, order_id, status, note, changed_by_admin_id)
        VALUES (?, ?, ?, ?, ?)
      `).bind(randomId(), params.id, status, logNote || `Status diubah menjadi ${status}.`, auth.session.admin_id));
    }
    if (status === 'cancelled') {
      statements.push(env.DB.prepare("UPDATE invoices SET status = 'cancelled' WHERE order_id = ? AND status <> 'paid'").bind(params.id));
    }
    await env.DB.batch(statements);
    await logActivity(env.DB, request, auth.session.admin_id, 'order_update', 'order', params.id, `Status: ${status}`);
    const order = await loadOrder(env.DB, params.id);
    return json({ ok: true, order });
  } catch (error) {
    return fail('Pesanan gagal diperbarui.', 500, { error: error.message });
  }
}
