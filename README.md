# dibantu.id Sales App — Versi WhatsApp

Aplikasi penjualan jasa full-stack untuk Cloudflare Pages. Backend menggunakan Pages Functions dan Cloudflare D1. Versi ini **tidak menggunakan Cloudflare R2**.

## Alur pembayaran

1. Pelanggan membuka halaman pembayaran dan memindai QRIS statis.
2. Pelanggan menekan tombol **Kirim Bukti melalui WhatsApp**.
3. Sistem menyiapkan pesan berisi kode pesanan, nominal, dan data pembayar.
4. Pelanggan melampirkan bukti pembayaran secara manual di WhatsApp.
5. Admin membuka detail pesanan dan menggunakan formulir **Catat Pembayaran Manual**.
6. Sistem memperbarui pembayaran, nominal terbayar, sisa tagihan, status invoice, dan status pesanan.

## Fitur utama

- Katalog jasa dan paket dinamis dari D1.
- Keranjang lokal dan checkout tanpa akun pelanggan.
- Brief proyek, kode pesanan, token pelacakan, dan invoice otomatis.
- Pembayaran lunas atau DP.
- QRIS statis dari `public/assets/img/qris.png`.
- Konfirmasi bukti pembayaran melalui WhatsApp.
- Pencatatan pembayaran manual oleh admin.
- Pelacakan status proyek oleh pelanggan.
- Invoice A4 yang dapat dicetak atau disimpan sebagai PDF.
- Dashboard admin untuk pesanan, pembayaran, layanan, harga, dan pengaturan.
- Setup admin pertama tanpa password bawaan di source code.

## Stack

- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare D1
- HTML, CSS, dan JavaScript tanpa framework frontend
- Web Crypto API untuk PBKDF2 password hashing

## Sebelum deployment

Ganti file placeholder berikut dengan QRIS asli:

```text
public/assets/img/qris.png
```

Jangan mengaktifkan QRIS dari dashboard sebelum file asli sudah dipasang. Petunjuk singkat tersedia di `GANTI_QRIS.txt`.

Baca `PANDUAN_DEPLOYMENT.md` untuk instalasi lengkap.
