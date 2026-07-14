import { json, fail } from '../../_lib/http.js';
import { requireAdmin } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const [orders, revenue, pending, active, completed, recent] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS total FROM orders').first(),
      env.DB.prepare("SELECT COALESCE(SUM(verified_amount),0) AS total FROM payments WHERE status = 'verified'").first(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM payments WHERE status = 'pending'").first(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM orders WHERE status IN ('payment_verified','in_progress','awaiting_review','revision')").first(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM orders WHERE status = 'completed'").first(),
      env.DB.prepare(`
        SELECT o.id, o.order_code, o.status, o.total_amount, o.created_at,
               c.name AS customer_name, i.invoice_number, i.status AS invoice_status
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        JOIN invoices i ON i.order_id = o.id
        ORDER BY o.created_at DESC LIMIT 8
      `).all(),
    ]);

    const { results: monthly } = await env.DB.prepare(`
      SELECT substr(verified_at, 1, 7) AS month, COALESCE(SUM(verified_amount),0) AS revenue
      FROM payments
      WHERE status = 'verified' AND verified_at IS NOT NULL
      GROUP BY substr(verified_at, 1, 7)
      ORDER BY month DESC LIMIT 6
    `).all();

    return json({
      ok: true,
      metrics: {
        total_orders: Number(orders.total),
        verified_revenue: Number(revenue.total),
        pending_payments: Number(pending.total),
        active_projects: Number(active.total),
        completed_orders: Number(completed.total),
      },
      recent_orders: recent.results,
      monthly_revenue: monthly.reverse(),
    });
  } catch (error) {
    return fail('Dashboard gagal dimuat.', 500, { error: error.message });
  }
}
