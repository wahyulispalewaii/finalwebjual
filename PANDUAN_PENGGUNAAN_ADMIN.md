# Panduan Penggunaan Admin

## Setup pertama

Buka `/admin/setup/`, lalu buat akun admin pertama. Setup hanya dapat digunakan ketika tabel `admins` masih kosong.

## Dashboard

Dashboard menampilkan jumlah pesanan, pendapatan terverifikasi, data pembayaran pending dari versi lama, proyek aktif, dan pesanan selesai.

## Pesanan

Menu **Pesanan** digunakan untuk:

- mencari pesanan;
- membuka brief dan rincian layanan;
- mencatat pembayaran yang bukti transfernya diterima melalui WhatsApp;
- mengubah status proyek;
- menyimpan catatan internal;
- membuka tampilan pelanggan dan invoice.

### Mencatat pembayaran dari WhatsApp

1. Periksa bukti pembayaran di WhatsApp.
2. Buka detail pesanan yang sesuai.
3. Isi bagian **Catat Pembayaran Manual**.
4. Pilih jenis pembayaran.
5. Masukkan nominal yang benar.
6. Isi nama pembayar dan catatan bila diperlukan.
7. Tekan **Catat Pembayaran**.

Pembayaran langsung tersimpan sebagai `verified`. Sistem otomatis menghitung total terbayar dan mengubah invoice menjadi `partially_paid` atau `paid`.

Jangan hanya mengubah status pesanan menjadi **Pembayaran Diverifikasi**, karena perubahan status saja tidak menambah nominal pembayaran.

## Pembayaran

Menu **Pembayaran** berfungsi sebagai riwayat pembayaran. Pembayaran baru sebaiknya dibuat melalui detail pesanan.

Data `pending` dapat muncul bila database sebelumnya pernah memakai versi upload bukti. Data lama tersebut masih dapat diverifikasi atau ditolak, tetapi file R2 tidak lagi dapat dibuka dari versi ini.

## Layanan dan paket

Admin dapat mengaktifkan atau menonaktifkan layanan, mengubah deskripsi, harga paket, estimasi pengerjaan, fitur paket, serta menambah layanan dan paket baru.

Harga pada invoice lama tidak berubah ketika harga katalog diperbarui.

## Pengaturan

Menu **Pengaturan** memuat:

- identitas bisnis;
- nomor WhatsApp tujuan;
- aturan DP;
- batas waktu pembayaran;
- data merchant QRIS;
- pengaktifan QRIS statis.

Gambar QRIS berasal dari:

```text
public/assets/img/qris.png
```

Untuk mengganti gambar, ubah file pada repository lalu deploy ulang.

## Invoice PDF

Buka invoice lalu pilih **Cetak / Simpan PDF**. Gunakan ukuran A4, skala 100 persen, dan nonaktifkan header/footer browser agar hasil bersih.
