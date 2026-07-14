(function () {
  'use strict';
  const D = window.Dibantu;
  const root = document.getElementById('invoiceRoot');
  const token = new URLSearchParams(location.search).get('token');
  if (!token) { root.innerHTML = '<div class="alert alert-danger">Token invoice tidak tersedia.</div>'; return; }

  D.api(`/api/orders/${encodeURIComponent(token)}`).then(({ order, settings }) => {
    const business = settings.business;
    const payment = settings.payment;
    const rows = order.items.map((item, index) => `<tr><td>${index + 1}</td><td><b>${D.escapeHtml(item.service_name_snapshot)}</b><br><span style="color:#6b7280">${D.escapeHtml(item.package_name_snapshot)}</span></td><td>${item.quantity}</td><td>${D.formatCurrency(item.unit_price)}</td><td>${D.formatCurrency(item.line_total)}</td></tr>`).join('');
    const qris = payment.qris_active ? `<img class="invoice-qris" src="/assets/img/qris.png" alt="QRIS dibantu.id">` : '';
    root.innerHTML = `
      <article class="invoice-paper">
        <header class="invoice-head"><div><img class="invoice-logo" src="${D.escapeHtml(business.logo_url || '/assets/img/LOGO_DIBANTU.ID.png')}" alt="dibantu.id"><p style="color:#6b7280;line-height:1.5;margin:.8rem 0 0">${D.escapeHtml(business.address || '')}<br>${D.escapeHtml(business.email || '')}<br>WhatsApp: +${D.escapeHtml(business.whatsapp || '')}</p></div><div class="invoice-title"><h1>INVOICE</h1><p>${D.escapeHtml(order.invoice_number)}</p><span class="status-pill ${D.statusClass(order.invoice_status)}">${D.escapeHtml(D.invoiceStatusLabel(order.invoice_status))}</span></div></header>
        <section class="invoice-info-grid"><div><h3>Ditagihkan kepada</h3><p><b>${D.escapeHtml(order.customer_name)}</b><br>${D.escapeHtml(order.business_name || '')}<br>${D.escapeHtml(order.email || '')}<br>+${D.escapeHtml(order.whatsapp)}</p></div><div><h3>Informasi invoice</h3><p>Tanggal: ${D.formatDate(order.issued_at, false)}<br>Jatuh tempo: ${D.formatDate(order.invoice_expires_at)}<br>Kode pesanan: ${D.escapeHtml(order.order_code)}<br>Model pembayaran: ${order.payment_mode === 'dp' ? `DP ${payment.dp_percentage}%` : 'Lunas'}</p></div></section>
        <table class="invoice-table"><thead><tr><th>No.</th><th>Layanan</th><th>Qty</th><th>Harga</th><th>Jumlah</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="invoice-totals"><div><span>Subtotal</span><b>${D.formatCurrency(order.subtotal)}</b></div><div><span>Sudah dibayar</span><b>${D.formatCurrency(order.verified_paid)}</b></div><div class="grand"><span>Sisa pembayaran</span><b>${D.formatCurrency(order.remaining_amount)}</b></div><div><span>Tagihan awal</span><b>${D.formatCurrency(order.minimum_due)}</b></div></div>
        <section class="invoice-payment"><div><h3 style="font-family:var(--font-heading);margin:0 0 .5rem">Pembayaran QRIS</h3>${payment.qris_active ? `<p style="color:#4b5563;line-height:1.6;margin:.25rem 0">Merchant: <b>${D.escapeHtml(payment.merchant_name || '-')}</b><br>Penyedia: ${D.escapeHtml(payment.provider_name || '-')}<br>${D.escapeHtml(payment.payment_instructions || '')}</p>` : '<p style="color:#b45309">QRIS belum diaktifkan. Hubungi admin untuk instruksi pembayaran.</p>'}</div>${qris}</section>
        <footer class="invoice-footer-note"><b>Catatan:</b> ${D.escapeHtml(business.invoice_footer || 'Terima kasih telah menggunakan layanan dibantu.id.')}<br>Invoice ini dibuat secara elektronik oleh sistem dibantu.id.</footer>
      </article>`;
  }).catch((error) => { root.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`; });
})();
