(function () {
  'use strict';
  const D = window.Dibantu;
  const root = document.getElementById('orderRoot');
  const token = new URLSearchParams(location.search).get('token');
  if (!token) { root.innerHTML = '<div class="alert alert-danger">Token pelacakan tidak tersedia.</div>'; return; }

  function paymentRow(payment) {
    return `<div class="detail-row"><div><b>${D.escapeHtml(D.paymentStatusLabel(payment.status))}</b><div class="help-text">${D.formatDate(payment.created_at)}</div></div><div style="text-align:right"><b>${D.formatCurrency(payment.verified_amount ?? payment.declared_amount)}</b>${payment.rejection_reason ? `<div class="help-text" style="color:#fca5a5">${D.escapeHtml(payment.rejection_reason)}</div>` : ''}</div></div>`;
  }

  D.api(`/api/orders/${encodeURIComponent(token)}`).then(({ order, settings }) => {
    const items = order.items.map((item) => `<div class="cart-item"><div><h4>${D.escapeHtml(item.service_name_snapshot)}</h4><p>${D.escapeHtml(item.package_name_snapshot)} · Qty ${item.quantity}${item.addons?.length ? ` · ${item.addons.map(D.escapeHtml).join(', ')}` : ''}</p></div><div class="cart-price">${D.formatCurrency(item.line_total)}</div></div>`).join('');
    const history = order.history.map((entry) => `<div class="timeline-item"><span class="timeline-dot"></span><b>${D.escapeHtml(entry.status)}</b><small>${D.formatDate(entry.created_at)}</small>${entry.note ? `<p>${D.escapeHtml(entry.note)}</p>` : ''}</div>`).join('');
    const paymentButton = order.remaining_amount > 0 && !['cancelled'].includes(order.status) ? `<a class="primary-action" href="/pembayaran/?token=${encodeURIComponent(token)}"><i class="fa-solid fa-qrcode"></i>Bayar / Konfirmasi WhatsApp</a>` : '';
    root.innerHTML = `
      <div class="order-heading"><div><p class="page-kicker">Detail Pesanan</p><h1 class="order-code">${D.escapeHtml(order.order_code)}</h1></div><span class="status-pill ${D.statusClass(order.status)}">${D.escapeHtml(order.status_label)}</span></div>
      <div class="meta-list"><div class="meta-item"><span>Invoice</span><b>${D.escapeHtml(order.invoice_number)}</b></div><div class="meta-item"><span>Total</span><b>${D.formatCurrency(order.total_amount)}</b></div><div class="meta-item"><span>Sisa Pembayaran</span><b>${D.formatCurrency(order.remaining_amount)}</b></div></div>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin:1.25rem 0"><a class="secondary-action" href="/invoice/?token=${encodeURIComponent(token)}"><i class="fa-solid fa-file-invoice"></i>Lihat Invoice</a>${paymentButton}</div>
      <div class="app-grid two-col">
        <section class="panel"><h2 class="panel-title">Rincian layanan</h2><div class="cart-list">${items}</div><div class="summary-row total"><span>Total</span><b>${D.formatCurrency(order.total_amount)}</b></div></section>
        <section class="panel"><h2 class="panel-title">Brief proyek</h2><div class="detail-list"><div><span class="help-text">Judul</span><p>${D.escapeHtml(order.project_title || '-')}</p></div><div><span class="help-text">Deskripsi</span><p style="white-space:pre-wrap;line-height:1.65">${D.escapeHtml(order.brief_description || '-')}</p></div><div><span class="help-text">Target selesai</span><p>${D.escapeHtml(order.desired_deadline || '-')}</p></div></div></section>
        <section class="panel"><h2 class="panel-title">Riwayat pembayaran</h2>${order.payments.length ? order.payments.map(paymentRow).join('') : '<p class="panel-subtitle">Belum ada pembayaran yang dicatat admin.</p>'}</section>
        <section class="panel"><h2 class="panel-title">Timeline proyek</h2><div class="timeline">${history}</div></section>
      </div>
      <div class="alert alert-info" style="margin-top:1rem">Butuh bantuan? Hubungi WhatsApp dibantu.id di <a href="https://wa.me/${settings.business.whatsapp}" target="_blank" rel="noopener"><b>+${D.escapeHtml(settings.business.whatsapp)}</b></a>.</div>`;
  }).catch((error) => { root.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`; });
})();
