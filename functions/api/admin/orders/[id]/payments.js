import { json, fail, readJson, asInt, safeText } from '../../../../_lib/http.js';
import { requireAdmin, requireCsrf } from '../../../../_lib/auth.js';
import { randomId } from '../../../../_lib/crypto.js';
import { logActivity } from '../../../../_lib/db.js';

const PAYMENT_TYPES = new Set(['full', 'dp', 'balance', 'other']);

export async function onRequestPost({ request, env, params }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const csrfError = requireCsrf(request, auth.session);
    if (csrfError) return csrfError;

    const payload = await readJson(request);
    const order = await env.DB.prepare(`
      SELECT o.id, o.order_code, o.status, o.total_amount,
             i.id AS invoice_id, i.status AS invoice_status
      FROM orders o
      JOIN invoices i ON i.order_id = o.id
      WHERE o.id = ?
      LIMIT 1
    `).bind(params.id).first();

    if (!order) return fail('Pesanan tidak ditemukan.', 404);
    if (['cancelled', 'completed'].includes(order.status) || order.invoice_status === 'cancelled') {
      return fail('Pesanan ini tidak menerima pembayaran baru.', 409);
    }

    const paymentType = PAYMENT_TYPES.has(String(payload.payment_type)) ? String(payload.payment_type) : 'other';
    const amount = asInt(payload.amount, 0);
    const payerName = safeText(payload.payer_name, 120);
    const customerNote = safeText(payload.customer_note, 1000) || 'Bukti pembayaran diterima melalui WhatsApp.';

    const totals = await env.DB.prepare(`
      SELECT COALESCE(SUM(COALESCE(verified_amount, declared_amount)), 0) AS paid
      FROM payments
      WHERE order_id = ? AND status = 'verified'
    `).bind(order.id).first();

    const paidBefore = Number(totals.paid || 0);
    const remaining = Math.max(0, Number(order.total_amount) - paidBefore);
    if (remaining <= 0) return fail('Invoice ini sudah lunas.', 409);
    if (amount <= 0) return fail('Nominal pembayaran wajib lebih dari nol.', 422);
    if (amount > remaining) return fail(`Nominal melebihi sisa tagihan sebesar Rp${remaining.toLocaleString('id-ID')}.`, 422);

    const paymentId = randomId();
    const paidAmount = paidBefore + amount;
    const invoiceStatus = paidAmount >= Number(order.total_amount) ? 'paid' : 'partially_paid';
    const orderStatus = ['awaiting_confirmation', 'awaiting_quote', 'awaiting_payment', 'payment_review'].includes(order.status)
      ? 'payment_verified'
      : order.status;
    const logNote = `Pembayaran manual Rp${amount.toLocaleString('id-ID')} dicatat. Bukti diterima melalui WhatsApp.`;

    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO payments (
          id, order_id, invoice_id, payment_type, declared_amount, verified_amount,
          status, proof_object_key, proof_original_name, proof_mime_type, proof_size,
          payer_name, customer_note, verified_by, verified_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'verified', NULL, NULL, NULL, NULL, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        paymentId,
        order.id,
        order.invoice_id,
        paymentType,
        amount,
        amount,
        payerName || null,
        customerNote,
        auth.session.admin_id,
      ),
      env.DB.prepare('UPDATE invoices SET paid_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(paidAmount, invoiceStatus, order.invoice_id),
      env.DB.prepare('UPDATE orders SET paid_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(paidAmount, orderStatus, order.id),
      env.DB.prepare(`
        INSERT INTO order_status_logs (id, order_id, status, note, changed_by_admin_id)
        VALUES (?, ?, ?, ?, ?)
      `).bind(randomId(), order.id, orderStatus, logNote, auth.session.admin_id),
    ]);

    await logActivity(
      env.DB,
      request,
      auth.session.admin_id,
      'manual_payment_recorded',
      'payment',
      paymentId,
      `Pesanan ${order.order_code}, nominal ${amount}`,
    );

    return json({
      ok: true,
      message: 'Pembayaran manual berhasil dicatat.',
      payment_id: paymentId,
      paid_amount: paidAmount,
      remaining_amount: Math.max(0, Number(order.total_amount) - paidAmount),
      invoice_status: invoiceStatus,
      order_status: orderStatus,
    }, 201);
  } catch (error) {
    return fail('Pembayaran manual gagal dicatat.', 500, { error: error.message });
  }
}
