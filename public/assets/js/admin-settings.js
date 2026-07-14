(async function () {
  'use strict';
  const D = window.Dibantu;
  const A = window.DibantuAdmin;
  const ctx = await A.init({ active: 'settings', title: 'Pengaturan' });
  if (!ctx) return;
  ctx.page.innerHTML = '<span class="loading"><span class="spinner"></span>Memuat pengaturan...</span>';

  try {
    const data = await A.api('/api/admin/settings');
    const business = data.business;
    const payment = data.payment;

    ctx.page.innerHTML = `
      <div class="admin-page-head"><div><h1>Pengaturan Bisnis</h1><p>Data ini digunakan pada invoice, pembayaran QRIS, dan pesan WhatsApp pelanggan.</p></div></div>
      <form id="settingsForm" class="admin-grid detail-grid">
        <section class="panel">
          <h2 class="panel-title">Identitas Bisnis</h2>
          <div class="form-grid">
            <div class="form-field"><label>Nama bisnis</label><input name="business_name" required value="${D.escapeHtml(business.business_name || '')}"></div>
            <div class="form-field"><label>Nama pemilik</label><input name="owner_name" value="${D.escapeHtml(business.owner_name || '')}"></div>
            <div class="form-field"><label>Alamat</label><textarea name="address">${D.escapeHtml(business.address || '')}</textarea></div>
            <div class="form-grid two"><div class="form-field"><label>WhatsApp admin</label><input name="whatsapp" required value="${D.escapeHtml(business.whatsapp || '')}" placeholder="Contoh: 6281234567890"><span class="help-text">Nomor ini menjadi tujuan pengiriman bukti pembayaran pelanggan.</span></div><div class="form-field"><label>Email</label><input name="email" type="email" value="${D.escapeHtml(business.email || '')}"></div></div>
            <div class="form-field"><label>Zona waktu</label><input name="timezone" value="${D.escapeHtml(business.timezone || 'Asia/Makassar')}"></div>
            <div class="form-field"><label>Footer invoice</label><textarea name="invoice_footer">${D.escapeHtml(business.invoice_footer || '')}</textarea></div>
          </div>
        </section>

        <section class="panel">
          <h2 class="panel-title">Aturan Pembayaran</h2>
          <div class="form-grid">
            <div class="form-grid two"><div class="form-field"><label>DP (%)</label><input name="dp_percentage" type="number" min="1" max="99" value="${payment.dp_percentage}"></div><div class="form-field"><label>Batas pembayaran (menit)</label><input name="payment_timeout_minutes" type="number" min="5" value="${payment.payment_timeout_minutes}"></div></div>
            <label class="check-row"><input type="checkbox" name="allow_full_payment" ${payment.allow_full_payment ? 'checked' : ''}><span>Izinkan pembayaran penuh.</span></label>
            <label class="check-row"><input type="checkbox" name="allow_dp_payment" ${payment.allow_dp_payment ? 'checked' : ''}><span>Izinkan pembayaran DP.</span></label>
            <label class="check-row"><input type="checkbox" name="qris_active" ${payment.qris_active ? 'checked' : ''}><span>Aktifkan QRIS statis pada invoice dan halaman pembayaran.</span></label>
            <div class="form-field"><label>Nama merchant</label><input name="merchant_name" value="${D.escapeHtml(payment.merchant_name || '')}" placeholder="Nama yang tampil pada QRIS"></div>
            <div class="form-field"><label>Penyedia QRIS</label><input name="provider_name" value="${D.escapeHtml(payment.provider_name || '')}"></div>
            <div class="form-field"><label>NMID</label><input name="nmid" value="${D.escapeHtml(payment.nmid || '')}"></div>
            <div class="form-field"><label>Instruksi pembayaran</label><textarea name="payment_instructions">${D.escapeHtml(payment.payment_instructions || '')}</textarea></div>
          </div>
        </section>

        <div style="grid-column:1/-1"><button id="saveSettings" class="primary-action" type="submit">Simpan Pengaturan</button></div>
      </form>

      <section class="panel" style="margin-top:1rem">
        <h2 class="panel-title">Gambar QRIS Statis</h2>
        <p class="panel-subtitle">Versi ini tidak menggunakan R2. Gambar QRIS berasal dari file project dan tidak dapat diunggah melalui dashboard.</p>
        <div class="detail-grid" style="margin-top:1rem">
          <div><img class="qris-image" src="/assets/img/qris.png" alt="Pratinjau QRIS statis" style="max-width:280px"></div>
          <div class="alert alert-info"><b>Cara mengganti QRIS:</b><br>1. Siapkan gambar QRIS asli dalam format PNG.<br>2. Ubah namanya menjadi <code>qris.png</code>.<br>3. Ganti file <code>public/assets/img/qris.png</code> pada repository.<br>4. Deploy ulang Cloudflare Pages.<br>5. Aktifkan pilihan QRIS di atas setelah gambar benar.</div>
        </div>
      </section>`;

    document.getElementById('settingsForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const button = document.getElementById('saveSettings');
      try {
        D.setButtonLoading(button, true, 'Menyimpan...');
        await A.api('/api/admin/settings', {
          method: 'PATCH',
          body: JSON.stringify({
            business: {
              business_name: form.get('business_name'),
              owner_name: form.get('owner_name'),
              address: form.get('address'),
              whatsapp: form.get('whatsapp'),
              email: form.get('email'),
              timezone: form.get('timezone'),
              invoice_footer: form.get('invoice_footer'),
            },
            payment: {
              dp_percentage: Number(form.get('dp_percentage')),
              payment_timeout_minutes: Number(form.get('payment_timeout_minutes')),
              allow_full_payment: form.get('allow_full_payment') === 'on',
              allow_dp_payment: form.get('allow_dp_payment') === 'on',
              qris_active: form.get('qris_active') === 'on',
              merchant_name: form.get('merchant_name'),
              provider_name: form.get('provider_name'),
              nmid: form.get('nmid'),
              payment_instructions: form.get('payment_instructions'),
            },
          }),
        });
        D.toast('Pengaturan berhasil disimpan.', 'success');
        D.setButtonLoading(button, false);
      } catch (error) {
        D.toast(error.message, 'error', 6000);
        D.setButtonLoading(button, false);
      }
    });
  } catch (error) {
    ctx.page.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`;
  }
})();
