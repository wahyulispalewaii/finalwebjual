(function () {
  'use strict';
  const D = window.Dibantu;
  const root = document.getElementById('paymentRoot');
  const token = new URLSearchParams(location.search).get('token');

  function normalizeWhatsapp(value) {
    let number = String(value || '').replace(/\D/g, '');
    if (number.startsWith('0')) number = `62${number.slice(1)}`;
    if (!number.startsWith('62') && number) number = `62${number}`;
    return number;
  }

  if (!token) {
    root.innerHTML = '<div class="alert alert-danger">Token pesanan tidak tersedia.</div>';
    return;
  }

  D.api(`/api/orders/${encodeURIComponent(token)}`).then(({ order, settings }) => {
    const payment = settings.payment;
    const business = settings.business;
    const whatsapp = normalizeWhatsapp(business.whatsapp);
    const amountDefault = order.payment_mode === 'dp' && Number(order.verified_paid) === 0
      ? Number(order.minimum_due)
      : Number(order.remaining_amount);

    if (Number(order.remaining_amount) <= 0) {
      root.innerHTML = `<div class="panel" style="text-align:center"><div style="font-size:3rem;color:#86efac"><i class="fa-solid fa-circle-check"></i></div><h2 class="panel-title">Invoice sudah lunas</h2><p class="panel-subtitle">Tidak ada sisa pembayaran pada pesanan ini.</p><a class="primary-action" href="/pesanan/?token=${encodeURIComponent(token)}">Kembali ke Pesanan</a></div>`;
      return;
    }

    root.innerHTML = `
      <div class="checkout-layout">
        <section class="panel qris-card">
          <h2 class="panel-title">QRIS dibantu.id</h2>
          ${payment.qris_active ? `
            <img class="qris-image" src="/assets/img/qris.png" alt="QRIS dibantu.id">
            <p><b>${D.escapeHtml(payment.merchant_name || 'dibantu.id')}</b><br><span class="help-text">${D.escapeHtml(payment.provider_name || '')}</span></p>
            <p class="panel-subtitle">${D.escapeHtml(payment.payment_instructions || 'Pindai QRIS dan lakukan pembayaran sesuai tagihan.')}</p>
          ` : `
            <div class="alert alert-warning">QRIS belum diaktifkan admin. Hubungi admin melalui WhatsApp untuk memperoleh instruksi pembayaran.</div>
          `}
          <div style="margin-top:1rem"><span class="help-text">Batas pembayaran awal</span><div id="paymentCountdown" class="countdown">--:--:--</div><div class="help-text">${D.formatDate(order.invoice_expires_at)}</div></div>
        </section>

        <form id="paymentForm" class="panel">
          <h2 class="panel-title">Konfirmasi melalui WhatsApp</h2>
          <p class="panel-subtitle">Setelah membayar, buka WhatsApp lalu lampirkan tangkapan layar atau foto bukti pembayaran secara manual.</p>
          <div class="meta-list" style="margin-bottom:1rem">
            <div class="meta-item"><span>Kode Pesanan</span><b>${D.escapeHtml(order.order_code)}</b></div>
            <div class="meta-item"><span>Total</span><b>${D.formatCurrency(order.total_amount)}</b></div>
            <div class="meta-item"><span>Sisa</span><b>${D.formatCurrency(order.remaining_amount)}</b></div>
          </div>
          <div class="form-grid two">
            <div class="form-field"><label>Jenis pembayaran</label><select name="payment_type"><option value="${order.payment_mode === 'dp' && Number(order.verified_paid) === 0 ? 'DP' : 'Pelunasan / Sisa'}">${order.payment_mode === 'dp' && Number(order.verified_paid) === 0 ? 'DP' : 'Pelunasan / Sisa'}</option><option value="Lunas">Lunas</option><option value="Lainnya">Lainnya</option></select></div>
            <div class="form-field"><label>Nominal dibayar</label><input name="amount" type="number" min="1" max="${Number(order.total_amount) * 2}" required value="${amountDefault}"></div>
          </div>
          <div class="form-field"><label>Nama pembayar</label><input name="payer_name" maxlength="120" value="${D.escapeHtml(order.customer_name || '')}" placeholder="Nama pada akun pembayaran"></div>
          <div class="form-field"><label>Catatan</label><textarea name="note" maxlength="1000" placeholder="Opsional"></textarea></div>
          <div class="alert alert-info"><b>Penting:</b> tautan WhatsApp hanya menyiapkan pesan. Bukti pembayaran tetap perlu dilampirkan sendiri dari galeri atau dokumen perangkat Anda.</div>
          <button id="sendWhatsapp" class="primary-action" type="submit" ${whatsapp ? '' : 'disabled'}><i class="fa-brands fa-whatsapp"></i>${whatsapp ? 'Kirim Bukti melalui WhatsApp' : 'Nomor WhatsApp Admin Belum Diatur'}</button>
        </form>
      </div>`;

    D.startCountdown(order.invoice_expires_at, document.getElementById('paymentCountdown'));
    const form = document.getElementById('paymentForm');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!whatsapp) {
        D.toast('Nomor WhatsApp admin belum tersedia.', 'error', 5000);
        return;
      }

      const data = new FormData(form);
      const amount = Number(data.get('amount') || 0);
      if (amount <= 0) {
        D.toast('Nominal pembayaran tidak valid.', 'error', 5000);
        return;
      }

      const message = [
        `Halo Admin ${business.business_name || 'dibantu.id'},`,
        '',
        'Saya ingin mengonfirmasi pembayaran.',
        '',
        `Kode pesanan: ${order.order_code}`,
        `Nama pelanggan: ${order.customer_name || '-'}`,
        `Nama pembayar: ${String(data.get('payer_name') || '-').trim() || '-'}`,
        `Jenis pembayaran: ${String(data.get('payment_type') || '-')}`,
        `Nominal dibayar: ${D.formatCurrency(amount)}`,
        `Sisa tagihan sebelum verifikasi: ${D.formatCurrency(order.remaining_amount)}`,
        String(data.get('note') || '').trim() ? `Catatan: ${String(data.get('note')).trim()}` : '',
        '',
        'Berikut saya lampirkan bukti pembayarannya.',
      ].filter(Boolean).join('\n');

      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    });
  }).catch((error) => {
    root.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`;
  });
})();
