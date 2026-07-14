export async function hashPassword(
  password,
  saltHex = randomToken(16),
  iterations = 100000
) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g).map(
      (hex) => Number.parseInt(hex, 16)
    )
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
    (byte) => byte.toString(16).padStart(2, '0')
  ).join('');

  return {
    hash,
    salt: saltHex,
    iterations,
  };
}
