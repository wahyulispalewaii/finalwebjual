import { json, fail, readJson, safeText, asInt, normalizeEmail, normalizePhone } from '../../../_lib/http.js';
import { requireAdmin, requireCsrf } from '../../../_lib/auth.js';
import { getSettings, logActivity } from '../../../_lib/db.js';

export async function onRequestGet({ request, env }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const settings = await getSettings(env.DB);
    return json({ ok: true, ...settings });
  } catch (error) {
    return fail('Pengaturan gagal dimuat.', 500, { error: error.message });
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const auth = await requireAdmin(env.DB, request);
    if (auth.error) return auth.error;
    const csrfError = requireCsrf(request, auth.session);
    if (csrfError) return csrfError;
    const payload = await readJson(request);
    const current = await getSettings(env.DB);
    const business = payload.business || {};
    const payment = payload.payment || {};
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE business_settings SET
          business_name = ?, owner_name = ?, address = ?, whatsapp = ?, email = ?,
          timezone = ?, invoice_footer = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).bind(
        business.business_name === undefined ? current.business.business_name : safeText(business.business_name, 160),
        business.owner_name === undefined ? current.business.owner_name : safeText(business.owner_name, 160) || null,
        business.address === undefined ? current.business.address : safeText(business.address, 500) || null,
        business.whatsapp === undefined ? current.business.whatsapp : normalizePhone(business.whatsapp),
        business.email === undefined ? current.business.email : normalizeEmail(business.email),
        business.timezone === undefined ? current.business.timezone : safeText(business.timezone, 80),
        business.invoice_footer === undefined ? current.business.invoice_footer : safeText(business.invoice_footer, 1000) || null,
      ),
      env.DB.prepare(`
        UPDATE payment_settings SET
          qris_active = ?, merchant_name = ?, provider_name = ?, nmid = ?,
          payment_instructions = ?, allow_full_payment = ?, allow_dp_payment = ?,
          dp_percentage = ?, payment_timeout_minutes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).bind(
        payment.qris_active === undefined ? current.payment.qris_active : (payment.qris_active ? 1 : 0),
        payment.merchant_name === undefined ? current.payment.merchant_name : safeText(payment.merchant_name, 160) || null,
        payment.provider_name === undefined ? current.payment.provider_name : safeText(payment.provider_name, 160) || null,
        payment.nmid === undefined ? current.payment.nmid : safeText(payment.nmid, 100) || null,
        payment.payment_instructions === undefined ? current.payment.payment_instructions : safeText(payment.payment_instructions, 1200) || null,
        payment.allow_full_payment === undefined ? current.payment.allow_full_payment : (payment.allow_full_payment ? 1 : 0),
        payment.allow_dp_payment === undefined ? current.payment.allow_dp_payment : (payment.allow_dp_payment ? 1 : 0),
        payment.dp_percentage === undefined ? current.payment.dp_percentage : Math.min(99, Math.max(1, asInt(payment.dp_percentage, 50))),
        payment.payment_timeout_minutes === undefined ? current.payment.payment_timeout_minutes : Math.max(5, asInt(payment.payment_timeout_minutes, 60)),
      ),
    ]);
    await logActivity(env.DB, request, auth.session.admin_id, 'settings_updated', 'settings', '1', 'Pengaturan bisnis dan pembayaran diperbarui.');
    return json({ ok: true, ...(await getSettings(env.DB)) });
  } catch (error) {
    return fail('Pengaturan gagal disimpan.', 500, { error: error.message });
  }
}
