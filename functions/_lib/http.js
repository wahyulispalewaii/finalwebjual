export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function fail(message, status = 400, details = undefined) {
  return json({ ok: false, message, ...(details ? { details } : {}) }, status);
}

export async function readJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    throw new Error('Content-Type harus application/json.');
  }
  return request.json();
}

export function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '';
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function normalizePhone(value) {
  let phone = String(value || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
  if (!phone.startsWith('62')) phone = `62${phone}`;
  return phone;
}

export function asInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function safeText(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function methodNotAllowed(allowed = ['GET']) {
  return fail('Metode tidak diizinkan.', 405, { allowed });
}
