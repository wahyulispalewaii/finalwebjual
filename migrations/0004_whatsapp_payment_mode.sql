-- Menyesuaikan instalasi lama dari penyimpanan R2 ke QRIS statis + WhatsApp.
UPDATE payment_settings
SET
  qris_active = 0,
  qris_object_key = NULL,
  qris_mime_type = NULL,
  payment_instructions = CASE
    WHEN payment_instructions IS NULL
      OR payment_instructions LIKE '%unggah bukti%'
      OR payment_instructions LIKE '%upload bukti%'
    THEN 'Pindai QRIS, bayar sesuai tagihan, lalu kirim bukti pembayaran melalui WhatsApp.'
    ELSE payment_instructions
  END,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 1;
