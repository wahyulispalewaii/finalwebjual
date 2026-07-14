PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO business_settings (
  id, business_name, owner_name, address, whatsapp, email, timezone, logo_url, invoice_footer
) VALUES (
  1,
  'dibantu.id',
  'Wahyulis Hersya',
  'Marioriwawo, Soppeng, Sulawesi Selatan',
  '6287858468082',
  'wahyulishersyaa@gmail.com',
  'Asia/Makassar',
  '/assets/img/LOGO_DIBANTU.ID.png',
  'Terima kasih telah mempercayakan proyek Anda kepada dibantu.id.'
);

INSERT OR IGNORE INTO payment_settings (
  id, qris_active, merchant_name, provider_name, nmid, qris_object_key,
  payment_instructions, allow_full_payment, allow_dp_payment, dp_percentage,
  payment_timeout_minutes
) VALUES (
  1, 0, NULL, NULL, NULL, NULL,
  'Pindai QRIS, bayar sesuai tagihan, lalu kirim bukti pembayaran melalui WhatsApp.',
  1, 1, 50, 60
);

INSERT OR IGNORE INTO service_categories (id, name, slug, description, sort_order) VALUES
('cat-web', 'Web Development', 'web-development', 'Website dan aplikasi web untuk personal, UMKM, dan bisnis.', 10),
('cat-brand', 'Branding', 'branding', 'Logo dan sistem identitas visual.', 20),
('cat-academic', 'Academic Support', 'academic-support', 'Penyuntingan, formatting, dan pendampingan akademik.', 30),
('cat-research', 'Research Support', 'research-support', 'Pendampingan struktur proposal dan metodologi penelitian.', 40),
('cat-design', 'Graphic Design', 'graphic-design', 'Desain visual untuk promosi, presentasi, dan media sosial.', 50);

INSERT OR IGNORE INTO services (
  id, category_id, name, slug, short_description, description, image_url,
  pricing_type, estimated_days_min, estimated_days_max, revision_note, sort_order
) VALUES
('svc-web', 'cat-web', 'Web Development', 'web-development',
 'Landing page, company profile, katalog UMKM, dan web app yang responsif.',
 'Pembuatan website dengan desain modern, struktur rapi, responsif, dan siap dikembangkan.',
 '/assets/img/katalog.png', 'starting_from', 3, 14, 'Revisi mengikuti paket yang dipilih.', 10),
('svc-logo', 'cat-brand', 'Logo Design', 'logo-design',
 'Logo modern dan sistem identitas visual untuk bisnis.',
 'Perancangan logo dari konsep sampai file final yang siap digunakan.',
 NULL, 'starting_from', 3, 10, 'Revisi mengikuti paket yang dipilih.', 20),
('svc-academic', 'cat-academic', 'Academic Writing', 'academic-writing',
 'Penyuntingan, formatting, dan pendampingan naskah akademik.',
 'Layanan difokuskan pada penyuntingan, struktur, formatting, dan konsultasi akademik.',
 NULL, 'starting_from', 3, 14, 'Revisi mengikuti paket yang dipilih.', 30),
('svc-research', 'cat-research', 'Research Proposal', 'research-proposal',
 'Pendampingan struktur proposal dan metodologi penelitian.',
 'Pendampingan penyusunan kerangka proposal yang sistematis dan sesuai kebutuhan riset.',
 NULL, 'starting_from', 3, 21, 'Revisi mengikuti paket yang dipilih.', 40),
('svc-graphic', 'cat-design', 'Graphic Design', 'graphic-design',
 'Poster, flyer, banner, carousel, dan presentasi.',
 'Pembuatan aset visual yang konsisten dengan kebutuhan komunikasi brand.',
 NULL, 'starting_from', 2, 14, 'Revisi mengikuti paket yang dipilih.', 50);

INSERT OR IGNORE INTO service_packages (
  id, service_id, name, slug, description, price, price_label, is_featured,
  estimated_days_min, estimated_days_max, revision_limit, sort_order
) VALUES
('pkg-web-essential', 'svc-web', 'Essentials', 'essentials', 'Landing page sederhana, portofolio, atau tugas kuliah.', 150000, 'Rp150rb', 0, 3, 5, 1, 10),
('pkg-web-standard', 'svc-web', 'Standard App', 'standard-app', 'Company profile profesional dengan multi-halaman.', 350000, 'Rp350rb', 1, 7, 10, 3, 20),
('pkg-web-pro', 'svc-web', 'Pro Complex', 'pro-complex', 'Web app custom, e-commerce, atau sistem custom.', 1000000, 'Rp1jt+', 0, 10, 21, NULL, 30),

('pkg-logo-essential', 'svc-logo', 'Essentials', 'essentials', 'Logo simpel, modern, dan minimalis.', 100000, 'Rp100rb', 0, 3, 3, 1, 10),
('pkg-logo-standard', 'svc-logo', 'Standard App', 'standard-app', 'Logo profesional beserta elemen identitas.', 250000, 'Rp250rb', 1, 5, 7, 3, 20),
('pkg-logo-pro', 'svc-logo', 'Pro Complex', 'pro-complex', 'Brand identity kit lengkap untuk startup atau UMKM.', 600000, 'Rp600rb+', 0, 7, 14, NULL, 30),

('pkg-academic-essential', 'svc-academic', 'Essentials', 'essentials', 'Penyuntingan dan proofreading artikel ilmiah.', 100000, 'Rp100rb', 0, 3, 3, 1, 10),
('pkg-academic-standard', 'svc-academic', 'Standard App', 'standard-app', 'Pendampingan struktur dan formatting draft ilmiah.', 250000, 'Rp250rb', 1, 5, 7, 3, 20),
('pkg-academic-pro', 'svc-academic', 'Pro Complex', 'pro-complex', 'Pendampingan komprehensif untuk naskah ilmiah.', 1000000, 'Rp1jt+', 0, 7, 21, NULL, 30),

('pkg-research-essential', 'svc-research', 'Essentials', 'essentials', 'Review topik dan pendampingan struktur pendahuluan.', 200000, 'Rp200rb', 0, 3, 5, 1, 10),
('pkg-research-standard', 'svc-research', 'Standard App', 'standard-app', 'Pendampingan struktur proposal bab 1 sampai 3.', 600000, 'Rp600rb', 1, 7, 14, 3, 20),
('pkg-research-pro', 'svc-research', 'Pro Complex', 'pro-complex', 'Pendampingan proposal hibah riset dan kelengkapannya.', 1500000, 'Rp1,5jt+', 0, 10, 21, NULL, 30),

('pkg-graphic-essential', 'svc-graphic', 'Essentials', 'essentials', 'Satu aset poster, banner, atau flyer.', 100000, 'Rp100rb', 0, 2, 3, 1, 10),
('pkg-graphic-standard', 'svc-graphic', 'Standard App', 'standard-app', 'Carousel, presentasi, atau deck singkat.', 300000, 'Rp300rb', 1, 3, 5, 3, 20),
('pkg-graphic-pro', 'svc-graphic', 'Pro Complex', 'pro-complex', 'Paket desain kampanye atau retainer bulanan.', 1000000, 'Rp1jt+', 0, 7, 14, NULL, 30);

INSERT OR IGNORE INTO package_features (id, package_id, feature_text, sort_order) VALUES
('feat-we-1','pkg-web-essential','1 halaman utama',10),
('feat-we-2','pkg-web-essential','Responsive design',20),
('feat-we-3','pkg-web-essential','1x revisi minor',30),
('feat-we-4','pkg-web-essential','Estimasi 3 sampai 5 hari',40),
('feat-ws-1','pkg-web-standard','Hingga 5 halaman',10),
('feat-ws-2','pkg-web-standard','SEO basic',20),
('feat-ws-3','pkg-web-standard','3x revisi minor',30),
('feat-ws-4','pkg-web-standard','Estimasi 7 sampai 10 hari',40),
('feat-wp-1','pkg-web-pro','Halaman dan fitur custom',10),
('feat-wp-2','pkg-web-pro','Backend dan database',20),
('feat-wp-3','pkg-web-pro','Revisi fleksibel',30),
('feat-wp-4','pkg-web-pro','Full source code',40),

('feat-le-1','pkg-logo-essential','2 alternatif desain logo',10),
('feat-le-2','pkg-logo-essential','1x revisi minor',20),
('feat-le-3','pkg-logo-essential','Format PNG dan JPG',30),
('feat-le-4','pkg-logo-essential','Estimasi 3 hari',40),
('feat-ls-1','pkg-logo-standard','3 alternatif desain logo',10),
('feat-ls-2','pkg-logo-standard','3x revisi minor',20),
('feat-ls-3','pkg-logo-standard','Mockup 3D basic',30),
('feat-ls-4','pkg-logo-standard','Termasuk source file',40),
('feat-lp-1','pkg-logo-pro','Full brand guideline',10),
('feat-lp-2','pkg-logo-pro','Social media templates',20),
('feat-lp-3','pkg-logo-pro','Revisi fleksibel',30),
('feat-lp-4','pkg-logo-pro','Hak penggunaan komersial',40),

('feat-ae-1','pkg-academic-essential','Pengecekan typo dan EYD',10),
('feat-ae-2','pkg-academic-essential','Pengecekan format',20),
('feat-ae-3','pkg-academic-essential','1x revisi minor',30),
('feat-ae-4','pkg-academic-essential','Feedback dan catatan',40),
('feat-as-1','pkg-academic-standard','Penataan struktur',10),
('feat-as-2','pkg-academic-standard','Formatting sitasi dasar',20),
('feat-as-3','pkg-academic-standard','3x revisi minor',30),
('feat-as-4','pkg-academic-standard','Bantuan referensi',40),
('feat-ap-1','pkg-academic-pro','Pendampingan intensif',10),
('feat-ap-2','pkg-academic-pro','Review struktur komprehensif',20),
('feat-ap-3','pkg-academic-pro','Revisi fleksibel',30),
('feat-ap-4','pkg-academic-pro','Persiapan publikasi',40),

('feat-re-1','pkg-research-essential','Review topik',10),
('feat-re-2','pkg-research-essential','Format akademik',20),
('feat-re-3','pkg-research-essential','1x revisi minor',30),
('feat-re-4','pkg-research-essential','Konsultasi teks',40),
('feat-rs-1','pkg-research-standard','Struktur bab 1 sampai 3',10),
('feat-rs-2','pkg-research-standard','Struktur metodologi',20),
('feat-rs-3','pkg-research-standard','3x revisi minor',30),
('feat-rs-4','pkg-research-standard','Bantuan literatur',40),
('feat-rp-1','pkg-research-pro','RAB dan timeline',10),
('feat-rp-2','pkg-research-pro','Analisis justifikasi',20),
('feat-rp-3','pkg-research-pro','Revisi fleksibel',30),
('feat-rp-4','pkg-research-pro','Format pengajuan',40),

('feat-ge-1','pkg-graphic-essential','1 desain aset tunggal',10),
('feat-ge-2','pkg-graphic-essential','1x revisi minor',20),
('feat-ge-3','pkg-graphic-essential','Format high resolution',30),
('feat-ge-4','pkg-graphic-essential','Estimasi 2 sampai 3 hari',40),
('feat-gs-1','pkg-graphic-standard','Hingga 5 slide atau halaman',10),
('feat-gs-2','pkg-graphic-standard','Layout custom',20),
('feat-gs-3','pkg-graphic-standard','3x revisi minor',30),
('feat-gs-4','pkg-graphic-standard','Format lengkap',40),
('feat-gp-1','pkg-graphic-pro','Desain custom',10),
('feat-gp-2','pkg-graphic-pro','Prioritas antrean',20),
('feat-gp-3','pkg-graphic-pro','Revisi fleksibel',30),
('feat-gp-4','pkg-graphic-pro','Full source files',40);

INSERT OR IGNORE INTO portfolio_items (id, title, description, image_url, category, sort_order) VALUES
('port-katalog', 'Katalog Produk UMKM', 'Katalog digital yang menampilkan produk UMKM secara rapi dan mudah dijelajahi.', '/assets/img/katalog.png', 'Web Development', 10),
('port-brand', 'Logo & Identity System', 'Logo, warna, tipografi, dan penerapan visual brand.', NULL, 'Branding', 20),
('port-academic', 'Proposal & Artikel Ilmiah', 'Struktur logis, rapi, dan disesuaikan dengan kebutuhan akademik.', NULL, 'Academic Support', 30);
