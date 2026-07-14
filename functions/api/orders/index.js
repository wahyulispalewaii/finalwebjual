import { json, fail, readJson, normalizeEmail, normalizePhone, isValidEmail, safeText, asInt } from '../../_lib/http.js';
import { randomId } from '../../_lib/crypto.js';
import { addMinutesIso, freshTrackingToken, generateCodes, getSettings } from '../../_lib/db.js';

function validateCustomer(customer) {
  const name = safeText(customer?.name, 120);
  const whatsapp = normalizePhone(customer?.whatsapp);
  const email = normalizeEmail(customer?.email);
  const businessName = safeText(customer?.business_name, 160);
  if (name.length < 2) return { error: 'Nama pelanggan wajib diisi.' };
  if (whatsapp.length < 10 || whatsapp.length > 16) return { error: 'Nomor WhatsApp tidak valid.' };
  if (email && !isValidEmail(email)) return { error: 'Alamat email tidak valid.' };
  return { name, whatsapp, email, businessName };
}

async function getPackages(db, ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await db.prepare(`
    SELECT
      p.id, p.service_id, p.name AS package_name, p.description,
      p.price, p.is_active, s.name AS service_name, s.is_active AS service_active
    FROM service_packages p
    JOIN services s ON s.id = p.service_id
    WHERE p.id IN (${placeholders})
  `).bind(...ids).all();
  return results;
}

async function getAddons(db, ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await db.prepare(`
    SELECT id, service_id, name, price, is_active
    FROM service_addons
    WHERE id IN (${placeholders})
  `).bind(...ids).all();
  return results;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return fail('Database belum dikonfigurasi.', 503);
    const payload = await readJson(request);
    const customer = validateCustomer(payload.customer || {});
    if (customer.error) return fail(customer.error, 422);

    const itemsInput = Array.isArray(payload.items) ? payload.items.slice(0, 10) : [];
    if (!itemsInput.length) return fail('Keranjang masih kosong.', 422);
    const packageIds = [...new Set(itemsInput.map((item) => safeText(item.package_id, 80)).filter(Boolean))];
    const packages = await getPackages(env.DB, packageIds);
    const packageMap = new Map(packages.map((pkg) => [pkg.id, pkg]));

    const addonIds = [...new Set(itemsInput.flatMap((item) => Array.isArray(item.addon_ids) ? item.addon_ids : []).map((id) => safeText(id, 80)).filter(Boolean))];
    const addons = await getAddons(env.DB, addonIds);
    const addonMap = new Map(addons.map((addon) => [addon.id, addon]));

    const normalizedItems = [];
    let subtotal = 0;
    for (const item of itemsInput) {
      const pkg = packageMap.get(safeText(item.package_id, 80));
      if (!pkg || !pkg.is_active || !pkg.service_active) return fail('Salah satu paket tidak tersedia.', 422);
      const quantity = Math.max(1, Math.min(asInt(item.quantity, 1), 10));
      const selectedAddons = [];
      let addonsTotal = 0;
      for (const addonId of Array.isArray(item.addon_ids) ? item.addon_ids : []) {
        const addon = addonMap.get(String(addonId));
        if (!addon || !addon.is_active || addon.service_id !== pkg.service_id) continue;
        selectedAddons.push(addon);
        addonsTotal += Number(addon.price);
      }
      const unitPrice = Number(pkg.price) + addonsTotal;
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      normalizedItems.push({ pkg, quantity, selectedAddons, unitPrice, lineTotal });
    }

    if (subtotal <= 0) return fail('Total pesanan tidak valid.', 422);
    const brief = payload.brief || {};
    const description = safeText(brief.description, 5000);
    if (description.length < 10) return fail('Brief proyek perlu dijelaskan minimal 10 karakter.', 422);
    if (payload.terms_accepted !== true) return fail('Syarat pemesanan perlu disetujui.', 422);

    const { business, payment } = await getSettings(env.DB);
    const requestedMode = payload.payment_mode === 'dp' ? 'dp' : 'full';
    const paymentMode = requestedMode === 'dp' && payment.allow_dp_payment ? 'dp' : 'full';
    const dpPercentage = Number(payment.dp_percentage || 50);
    const initialDue = paymentMode === 'dp' ? Math.ceil(subtotal * dpPercentage / 100) : subtotal;
    const expiresAt = addMinutesIso(Number(payment.payment_timeout_minutes || 60));
    const { invoiceNumber, orderCode } = await generateCodes(env.DB, business.timezone || 'Asia/Makassar');

    let customerId = null;
    const existing = await env.DB.prepare(`
      SELECT id FROM customers
      WHERE whatsapp = ? OR (? <> '' AND email = ?)
      ORDER BY created_at DESC LIMIT 1
    `).bind(customer.whatsapp, customer.email, customer.email).first();
    customerId = existing?.id || randomId();

    const orderId = randomId();
    const invoiceId = randomId();
    const briefId = randomId();
    const trackingToken = freshTrackingToken();
    const statements = [];

    if (existing) {
      statements.push(env.DB.prepare(`
        UPDATE customers SET name = ?, email = ?, business_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(customer.name, customer.email || null, customer.businessName || null, customerId));
    } else {
      statements.push(env.DB.prepare(`
        INSERT INTO customers (id, name, whatsapp, email, business_name)
        VALUES (?, ?, ?, ?, ?)
      `).bind(customerId, customer.name, customer.whatsapp, customer.email || null, customer.businessName || null));
    }

    statements.push(env.DB.prepare(`
      INSERT INTO orders (
        id, order_code, tracking_token, customer_id, status, payment_mode,
        subtotal, total_amount, initial_due_amount, expires_at, customer_notes
      ) VALUES (?, ?, ?, ?, 'awaiting_payment', ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId, orderCode, trackingToken, customerId, paymentMode,
      subtotal, subtotal, initialDue, expiresAt, safeText(payload.customer_notes, 2000) || null,
    ));

    for (const item of normalizedItems) {
      const itemId = randomId();
      statements.push(env.DB.prepare(`
        INSERT INTO order_items (
          id, order_id, service_id, package_id, service_name_snapshot,
          package_name_snapshot, description_snapshot, unit_price, quantity, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId, orderId, item.pkg.service_id, item.pkg.id, item.pkg.service_name,
        item.pkg.package_name, item.pkg.description || null, item.unitPrice, item.quantity, item.lineTotal,
      ));
      for (const addon of item.selectedAddons) {
        statements.push(env.DB.prepare(`
          INSERT INTO order_item_addons (id, order_item_id, addon_id, addon_name_snapshot, addon_price)
          VALUES (?, ?, ?, ?, ?)
        `).bind(randomId(), itemId, addon.id, addon.name, addon.price));
      }
    }

    statements.push(env.DB.prepare(`
      INSERT INTO project_briefs (
        id, order_id, project_title, description, references_text, desired_deadline, additional_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      briefId, orderId, safeText(brief.project_title, 200) || null, description,
      safeText(brief.references_text, 3000) || null, safeText(brief.desired_deadline, 40) || null,
      safeText(brief.additional_notes, 3000) || null,
    ));

    statements.push(env.DB.prepare(`
      INSERT INTO invoices (
        id, invoice_number, order_id, status, total_amount, minimum_due,
        paid_amount, issued_at, expires_at
      ) VALUES (?, ?, ?, 'issued', ?, ?, 0, ?, ?)
    `).bind(invoiceId, invoiceNumber, orderId, subtotal, initialDue, new Date().toISOString(), expiresAt));

    statements.push(env.DB.prepare(`
      INSERT INTO order_status_logs (id, order_id, status, note)
      VALUES (?, ?, 'awaiting_payment', 'Pesanan dibuat oleh pelanggan.')
    `).bind(randomId(), orderId));

    await env.DB.batch(statements);

    return json({
      ok: true,
      order: {
        order_code: orderCode,
        tracking_token: trackingToken,
        invoice_number: invoiceNumber,
        payment_mode: paymentMode,
        total_amount: subtotal,
        initial_due_amount: initialDue,
        expires_at: expiresAt,
      },
    }, 201);
  } catch (error) {
    return fail('Pesanan gagal dibuat.', 500, { error: error.message });
  }
}
