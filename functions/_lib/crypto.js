const encoder = new TextEncoder();

export function randomId() {
  return crypto.randomUUID();
}

export function randomToken(bytes = 32) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value)));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password, saltHex = randomToken(16), iterations = 120000) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((hex) => Number.parseInt(hex, 16)));
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  );
  const hash = Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt: saltHex, iterations };
}

export async function verifyPassword(password, salt, iterations, expectedHash) {
  const result = await hashPassword(password, salt, iterations);
  if (result.hash.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < result.hash.length; i += 1) {
    diff |= result.hash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}
