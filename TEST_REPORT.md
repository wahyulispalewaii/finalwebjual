# Laporan Pemeriksaan Versi WhatsApp

Versi ini disesuaikan agar dapat berjalan di Cloudflare Pages tanpa Cloudflare R2.

## Pemeriksaan yang dilakukan

- Referensi binding `PAYMENT_FILES` dihapus dari konfigurasi dan script development.
- Endpoint upload QRIS dan bukti pembayaran berbasis R2 dihapus.
- QRIS pada halaman pembayaran dan invoice menggunakan `/assets/img/qris.png`.
- Halaman pembayaran menyiapkan pesan konfirmasi melalui WhatsApp.
- Formulir upload file di sisi pelanggan dihapus.
- Formulir pencatatan pembayaran manual ditambahkan pada detail pesanan admin.
- Pembayaran manual tersimpan sebagai `verified` tanpa `proof_object_key`.
- Total terbayar, sisa tagihan, status invoice, dan status pesanan diperbarui oleh endpoint admin.
- Panduan deployment diperbarui agar hanya membutuhkan binding D1.
- Placeholder QRIS ditambahkan agar admin tidak secara tidak sengaja memakai QRIS palsu.

## Pengujian integrasi lokal yang berhasil

- Pages Functions berhasil dikompilasi oleh Wrangler.
- Semua migration berhasil diterapkan pada database SQLite/D1 lokal.
- Lima layanan seed dapat dimuat dari endpoint publik.
- Pesanan DP sebesar Rp150.000 berhasil dibuat dengan tagihan awal Rp75.000.
- Akun admin pertama berhasil dibuat.
- Endpoint **Catat Pembayaran Manual** berhasil mencatat Rp75.000 sebagai pembayaran terverifikasi.
- Invoice berubah menjadi `partially_paid`.
- Status pesanan berubah menjadi `payment_verified`.
- Halaman publik menghitung Rp75.000 terbayar dan Rp75.000 tersisa.
- Aset QRIS statis dapat dilayani dari `/assets/img/qris.png`.

## Pengujian produksi yang tetap diperlukan

- Binding D1 pada project Cloudflare Pages.
- Penerapan seluruh migration D1.
- Penggantian placeholder dengan QRIS merchant asli.
- Pengaturan nomor WhatsApp admin.
- Pengujian tombol WhatsApp pada ponsel dan desktop.
- Satu transaksi uji dari checkout sampai pembayaran manual tercatat.
