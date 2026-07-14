(function () {
  'use strict';
  const D = window.Dibantu;
  const root = document.getElementById('successRoot');
  const token = new URLSearchParams(location.search).get('token');
  if (!token) { root.innerHTML = '<div class="alert alert-danger">Token pesanan tidak ditemukan.</div>'; return; }
  D.api(`/api/orders/${encodeURIComponent(token)}`).then(({ order }) => {
    root.innerHTML = `
      <div style="text-align:center;max-width:760px;margin:auto;padding:1rem 0">
        <div style="width:72px;height:72px;margin:0 auto 1.25rem;border-radius:50%;display:grid;place-items:center;background:rgba(34,197,94,.12);color:#86efac;font-size:2rem"><i class="fa-solid fa-check"></i></div>
        <p class="page-kicker">Pesanan berhasil dibuat</p><h1 class="page-title" style="font-size:clamp(2rem,6vw,3rem)">${D.escapeHtml(order.order_code)}</h1>
        <p class="page-subtitle" style="margin:1rem auto">Simpan token pelacakan berikut. Token ini berfungsi sebagai akses privat ke detail pesanan dan invoice.</p>
        <div class="panel" style="text-align:left;margin:1.5rem 0"><div class="meta-list"><div class="meta-item"><span>Invoice</span><b>${D.escapeHtml(order.invoice_number)}</b></div><div class="meta-item"><span>Total</span><b>${D.formatCurrency(order.total_amount)}</b></div><div class="meta-item"><span>Tagihan Awal</span><b>${D.formatCurrency(order.minimum_due)}</b></div></div><div class="form-field" style="margin-top:1rem"><label>Token Pelacakan</label><input id="tokenCopy" readonly value="${D.escapeHtml(token)}"></div></div>
        <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap"><button id="copyToken" class="secondary-action"><i class="fa-regular fa-copy"></i>Salin Token</button><a class="primary-action" href="/pembayaran/?token=${encodeURIComponent(token)}"><i class="fa-solid fa-qrcode"></i>Lanjut Pembayaran</a><a class="secondary-action" href="/pesanan/?token=${encodeURIComponent(token)}">Lihat Pesanan</a></div>
      </div>`;
    document.getElementById('copyToken').addEventListener('click', async () => { await navigator.clipboard.writeText(token); D.toast('Token berhasil disalin.', 'success'); });
  }).catch((error) => { root.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`; });
})();
