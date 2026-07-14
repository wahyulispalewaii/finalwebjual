# Panduan Deployment Cloudflare Pages Tanpa R2

## 1. Siapkan repository GitHub

Unggah seluruh isi folder proyek ke repository baru. Folder `functions` harus berada di root repository.

```text
public/
functions/
migrations/
wrangler.jsonc
package.json
```

## 2. Ganti QRIS placeholder

1. Siapkan gambar QRIS asli dalam format PNG.
2. Ubah nama file menjadi `qris.png`.
3. Ganti file:

```text
public/assets/img/qris.png
```

File bawaan hanya placeholder dan tidak dapat digunakan untuk pembayaran.

## 3. Buat database D1

Pada Cloudflare Dashboard:

1. Buka **Storage & Databases**.
2. Pilih **D1 SQL Database**.
3. Buat database bernama `dibantu-id-db`.
4. Jalankan migration secara berurutan:
   - `migrations/0001_schema.sql`
   - `migrations/0002_seed.sql`
   - `migrations/0003_indexes_and_triggers.sql`
   - `migrations/0004_whatsapp_payment_mode.sql`

Alternatif dengan Wrangler:

```bash
npm install
npx wrangler d1 create dibantu-id-db
npx wrangler d1 execute dibantu-id-db --remote --file=./migrations/0001_schema.sql
npx wrangler d1 execute dibantu-id-db --remote --file=./migrations/0002_seed.sql
npx wrangler d1 execute dibantu-id-db --remote --file=./migrations/0003_indexes_and_triggers.sql
npx wrangler d1 execute dibantu-id-db --remote --file=./migrations/0004_whatsapp_payment_mode.sql
```

Untuk database yang sudah pernah memakai versi R2, cukup terapkan migration `0004_whatsapp_payment_mode.sql` setelah memastikan migration sebelumnya sudah ada.

## 4. Buat project Cloudflare Pages

1. Buka **Workers & Pages**.
2. Pilih **Create application**, lalu **Pages**.
3. Hubungkan repository GitHub.
4. Gunakan konfigurasi:

```text
Framework preset : None
Build command    : kosong
Build output     : public
Root directory   : /
```

Cloudflare akan membaca folder `functions` secara otomatis.

## 5. Tambahkan binding D1

Buka:

```text
Settings > Bindings
```

Tambahkan:

```text
D1 database binding
Variable name : DB
Database      : dibantu-id-db
```

Tidak perlu membuat R2 bucket dan tidak perlu binding `PAYMENT_FILES`.

Tambahkan binding yang sama pada **Production** dan **Preview** bila preview deployment juga harus menggunakan database.

## 6. Uji health endpoint

Buka:

```text
https://NAMA-PROJECT.pages.dev/api/health
```

Respons yang benar:

```json
{
  "ok": true,
  "database": true
}
```

## 7. Buat akun admin pertama

Buka:

```text
https://NAMA-PROJECT.pages.dev/admin/setup/
```

Buat password minimal 10 karakter yang memiliki huruf besar, huruf kecil, dan angka. Setelah akun pertama dibuat, endpoint setup akan terkunci.

## 8. Atur WhatsApp dan aktifkan QRIS

Masuk ke:

```text
/admin/pengaturan/
```

Pastikan:

- nomor WhatsApp menggunakan format internasional, misalnya `6281234567890`;
- nama merchant sudah benar;
- penyedia QRIS dan NMID diisi bila tersedia;
- pratinjau QRIS menampilkan gambar asli;
- pilihan **Aktifkan QRIS statis** dicentang.

Gambar QRIS tidak dapat diunggah dari dashboard. Untuk menggantinya, ubah file di repository dan deploy ulang.

## 9. Uji transaksi

1. Buka `/layanan/`.
2. Tambahkan paket dan lakukan checkout.
3. Buka halaman pembayaran.
4. Pastikan QRIS asli tampil.
5. Tekan **Kirim Bukti melalui WhatsApp**.
6. Pastikan pesan WhatsApp memuat kode pesanan dan nominal.
7. Kirim bukti secara manual di WhatsApp.
8. Masuk ke admin, buka detail pesanan, lalu pilih **Catat Pembayaran Manual**.
9. Pastikan total terbayar, sisa tagihan, dan status invoice berubah.

## Catatan

- Cloudflare R2 tidak diperlukan.
- Bukti pembayaran tidak disimpan di website; bukti tetap berada di percakapan WhatsApp.
- Riwayat dan nominal pembayaran tetap tersimpan di D1.
- Invoice PDF dibuat melalui fitur cetak browser.
