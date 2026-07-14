import { json, fail, readJson, asInt, safeText } from '../../../_lib/http.js';
import { requireAdmin, requireCsrf } from '../../../_lib/auth.js';
import { randomId } from '../../../_lib/crypto.js';
import { logActivity } from '../../../_lib/db.js';

export async function onRequestPatch({ request, env, params }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const csrfError = requireCsrf(request, auth.session);
    if (csrfError) return csrfError;
    const payload = await readJson(request);
    const action = String(payload.action || '');
    const payment = await env.DB.prepare(`
      SELECT p.*, o.total_amount, o.status AS order_status, i.status AS invoice_status
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      JOIN invoices i ON i.id = p.invoice_id
      WHERE p.id = ? LIMIT 1
    `).bind(params.id).first();
    if (!payment) return fail('Pembayaran tidak ditemukan.', 404);
    if (payment.status !== 'pending') return fail('Pembayaran ini sudah diproses.', 409);

    if (action === 'verify') {
      const verifiedAmount = asInt(payload.verified_amount, Number(payment.declared_amount));
      if (verifiedAmount <= 0 || verifiedAmount > Number(payment.total_amount) * 2) return fail('Nominal verifikasi tidak valid.', 422);
      await env.DB.prepare(`
        UPDATE payments SET status = 'verified', verified_amount = ?, verified_by = ?,
          verified_at = CURRENT_TIMESTAMP, rejection_reason = NULL
        WHERE id = ?
      `).bind(verifiedAmount, auth.session.admin_id, payment.id).run();

      const paid = await env.DB.prepare(`
        SELECT COALESCE(SUM(COALESCE(verified_amount, declared_amount)),0) AS total
        FROM payments WHERE order_id = ? AND status = 'verified'
      `).bind(payment.order_id).first();
      const paidAmount = Number(paid.total);
      const invoiceStatus = paidAmount >= Number(payment.total_amount) ? 'paid' : 'partially_paid';
      const orderStatus = ['awaiting_payment', 'payment_review'].includes(payment.order_status) ? 'payment_verified' : payment.order_status;
      await env.DB.batch([
        env.DB.prepare('UPDATE invoices SET paid_amount = ?, status = ? WHERE id = ?').bind(paidAmount, invoiceStatus, payment.invoice_id),
        env.DB.prepare('UPDATE orders SET paid_amount = ?, status = ? WHERE id = ?').bind(paidAmount, orderStatus, payment.order_id),
        env.DB.prepare(`
          INSERT INTO order_status_logs (id, order_id, status, note, changed_by_admin_id)
          VALUES (?, ?, ?, ?, ?)
        `).bind(randomId(), payment.order_id, orderStatus, `Pembayaran Rp${verifiedAmount.toLocaleString('id-ID')} diverifikasi.`, auth.session.admin_id),
      ]);
      await logActivity(env.DB, request, auth.session.admin_id, 'payment_verified', 'payment', payment.id, `Nominal ${verifiedAmount}`);
      return json({ ok: true, message: 'Pembayaran berhasil diverifikasi.', paid_amount: paidAmount, invoice_status: invoiceStatus });
    }

    if (action === 'reject') {
      const reason = safeText(payload.rejection_reason, 1000);
      if (reason.length < 5) return fail('Alasan penolakan wajib diisi.', 422);
      await env.DB.prepare(`
        UPDATE payments SET status = 'rejected', rejection_reason = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(reason, auth.session.admin_id, payment.id).run();
      const remainingPending = await env.DB.prepare("SELECT COUNT(*) AS total FROM payments WHERE order_id = ? AND status = 'pending'").bind(payment.order_id).first();
      const verified = await env.DB.prepare("SELECT COUNT(*) AS total FROM payments WHERE order_id = ? AND status = 'verified'").bind(payment.order_id).first();
      if (Number(remainingPending.total) === 0 && Number(verified.total) === 0) {
        await env.DB.batch([
          env.DB.prepare("UPDATE orders SET status = 'awaiting_payment' WHERE id = ? AND status = 'payment_review'").bind(payment.order_id),
          env.DB.prepare("UPDATE invoices SET status = 'issued' WHERE id = ? AND status = 'payment_review'").bind(payment.invoice_id),
          env.DB.prepare(`
            INSERT INTO order_status_logs (id, order_id, status, note, changed_by_admin_id)
            VALUES (?, ?, 'awaiting_payment', ?, ?)
          `).bind(randomId(), payment.order_id, `Bukti pembayaran ditolak: ${reason}`, auth.session.admin_id),
        ]);
      }
      await logActivity(env.DB, request, auth.session.admin_id, 'payment_rejected', 'payment', payment.id, reason);
      return json({ ok: true, message: 'Pembayaran ditolak.' });
    }

    return fail('Aksi pembayaran tidak valid.', 422);
  } catch (error) {
    return fail('Pembayaran gagal diproses.', 500, { error: error.message });
  }
}
