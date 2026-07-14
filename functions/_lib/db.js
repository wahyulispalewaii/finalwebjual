import { randomId, randomToken } from './crypto.js';
import { clientIp } from './http.js';

export function nowIso() {
  return new Date().toISOString();
}

export function addMinutesIso(minutes) {
  return new Date(Date.now() + Number(minutes) * 60_000).toISOString();
}

export function dateParts(timezone = 'Asia/Makassar') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

export async function nextSequence(db, name) {
  const row = await db.prepare(`
    INSERT INTO sequences (name, current_value, updated_at)
    VALUES (?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(name) DO UPDATE SET
      current_value = current_value + 1,
      updated_at = CURRENT_TIMESTAMP
    RETURNING current_value
  `).bind(name).first();
  return Number(row.current_value);
}

export async function generateCodes(db, timezone = 'Asia/Makassar') {
  const { year, month, day } = dateParts(timezone);
  const invoiceSequence = await nextSequence(db, `invoice_${year}${month}`);
  const orderSequence = await nextSequence(db, `order_${year}${month}${day}`);
  const invoiceNumber = `INV-${year}${month}-${String(invoiceSequence).padStart(4, '0')}`;
  const suffix = randomToken(2).slice(0, 4).toUpperCase();
  const orderCode = `ORD-${String(year).slice(-2)}${month}${day}-${String(orderSequence).padStart(3, '0')}${suffix}`;
  return { invoiceNumber, orderCode };
}

export async function getSettings(db) {
  const [business, payment] = await Promise.all([
    db.prepare('SELECT * FROM business_settings WHERE id = 1').first(),
    db.prepare('SELECT * FROM payment_settings WHERE id = 1').first(),
  ]);
  return { business, payment };
}

export async function logActivity(db, request, adminId, action, entityType = null, entityId = null, description = null) {
  await db.prepare(`
    INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(randomId(), adminId, action, entityType, entityId, description, clientIp(request)).run();
}

export function publicOrderStatusLabel(status) {
  const labels = {
    awaiting_confirmation: 'Menunggu Konfirmasi',
    awaiting_quote: 'Menunggu Penawaran',
    awaiting_payment: 'Menunggu Pembayaran',
    payment_review: 'Pembayaran Sedang Diverifikasi',
    payment_verified: 'Pembayaran Diverifikasi',
    in_progress: 'Sedang Dikerjakan',
    awaiting_review: 'Menunggu Review',
    revision: 'Tahap Revisi',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };
  return labels[status] || status;
}

export function freshTrackingToken() {
  return randomToken(24);
}
