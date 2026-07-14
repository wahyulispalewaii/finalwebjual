import { json, fail } from '../../_lib/http.js';
import { getSettings, publicOrderStatusLabel } from '../../_lib/db.js';

export async function onRequestGet({ env, params }) {
  try {
    const token = String(params.token || '').trim();
    if (!token) return fail('Token pesanan tidak valid.', 400);
    const order = await env.DB.prepare(`
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
      WHERE o.tracking_token = ?
      LIMIT 1
    `).bind(token).first();
    if (!order) return fail('Pesanan tidak ditemukan.', 404);

    const [{ results: items }, { results: payments }, { results: history }, settings] = await Promise.all([
      env.DB.prepare(`
        SELECT oi.*, GROUP_CONCAT(oia.addon_name_snapshot, '||') AS addon_names
        FROM order_items oi
        LEFT JOIN order_item_addons oia ON oia.order_item_id = oi.id
        WHERE oi.order_id = ?
        GROUP BY oi.id
        ORDER BY oi.created_at
      `).bind(order.id).all(),
      env.DB.prepare(`
        SELECT id, payment_type, declared_amount, verified_amount, status,
               payer_name, customer_note, rejection_reason, created_at, verified_at
        FROM payments WHERE order_id = ? ORDER BY created_at DESC
      `).bind(order.id).all(),
      env.DB.prepare(`
        SELECT status, note, created_at FROM order_status_logs
        WHERE order_id = ? ORDER BY created_at ASC
      `).bind(order.id).all(),
      getSettings(env.DB),
    ]);

    let invoiceStatus = order.invoice_status;
    const hasPayment = payments.some((payment) => ['pending', 'verified'].includes(payment.status));
    if (!hasPayment && ['issued', 'payment_review'].includes(invoiceStatus) && order.invoice_expires_at && new Date(order.invoice_expires_at) < new Date()) {
      invoiceStatus = 'expired';
      await env.DB.prepare("UPDATE invoices SET status = 'expired' WHERE id = ? AND status IN ('issued','payment_review')").bind(order.invoice_id).run();
    }

    const verifiedPaid = payments
      .filter((payment) => payment.status === 'verified')
      .reduce((sum, payment) => sum + Number(payment.verified_amount ?? payment.declared_amount), 0);
    const pendingPaid = payments
      .filter((payment) => payment.status === 'pending')
      .reduce((sum, payment) => sum + Number(payment.declared_amount), 0);
    const remaining = Math.max(0, Number(order.total_amount) - verifiedPaid);

    return json({
      ok: true,
      order: {
        ...order,
        status_label: publicOrderStatusLabel(order.status),
        invoice_status: invoiceStatus,
        verified_paid: verifiedPaid,
        pending_paid: pendingPaid,
        remaining_amount: remaining,
        items: items.map((item) => ({
          ...item,
          addons: item.addon_names ? item.addon_names.split('||') : [],
        })),
        payments,
        history,
      },
      settings: {
        business: settings.business,
        payment: {
          qris_active: Boolean(settings.payment.qris_active),
          merchant_name: settings.payment.merchant_name,
          provider_name: settings.payment.provider_name,
          nmid: settings.payment.nmid,
          payment_instructions: settings.payment.payment_instructions,
          dp_percentage: settings.payment.dp_percentage,
          payment_timeout_minutes: settings.payment.payment_timeout_minutes,
        },
      },
    });
  } catch (error) {
    return fail('Data pesanan gagal dimuat.', 500, { error: error.message });
  }
}
