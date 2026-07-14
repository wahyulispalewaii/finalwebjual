const encoder = new TextEncoder();

export function randomId() {
  return crypto.randomUUID();
}

export function randomToken(bytes = 32) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);

  return Array.from(
    array,
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(String(value)),
  );

  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function hashPassword(
  password,
  saltHex = randomToken(16),
  iterations = 100000,
) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    {
      name: 'PBKDF2',
    },
    false,
    ['deriveBits'],
  );

  const saltParts = saltHex.match(/.{1,2}/g);

  if (!saltParts) {
    throw new Error('Format salt password tidak valid.');
  }

  const salt = new Uint8Array(
    saltParts.map((hex) => Number.parseInt(hex, 16)),
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    key,
    256,
  );

  const hash = Array.from(
    new Uint8Array(bits),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');

  return {
    hash,
    salt: saltHex,
    iterations,
  };
}

export async function verifyPassword(
  password,
  salt,
  iterations,
  expectedHash,
) {
  if (
    typeof expectedHash !== 'string' ||
    expectedHash.length === 0
  ) {
    return false;
  }

  const result = await hashPassword(
    password,
    salt,
    Number(iterations),
  );

  if (result.hash.length !== expectedHash.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < result.hash.length; index += 1) {
    difference |=
      result.hash.charCodeAt(index) ^
      expectedHash.charCodeAt(index);
  }

  return difference === 0;
}
