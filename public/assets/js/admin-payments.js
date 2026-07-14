(async function () {
  'use strict';
  const D = window.Dibantu;
  const A = window.DibantuAdmin;
  const ctx = await A.init({ active: 'payments', title: 'Pembayaran' });
  if (!ctx) return;

  ctx.page.innerHTML = `
    <div class="admin-page-head"><div><h1>Riwayat Pembayaran</h1><p>Pembayaran baru dicatat dari detail pesanan setelah bukti diterima melalui WhatsApp.</p></div></div>
    <div class="filter-bar"><select id="paymentStatus"><option value="verified">Terverifikasi</option><option value="pending">Menunggu Verifikasi (data lama)</option><option value="rejected">Ditolak</option><option value="all">Semua</option></select><button id="refreshPayments" class="secondary-action"><i class="fa-solid fa-rotate"></i>Muat Ulang</button></div>
    <div id="paymentsContent"></div>`;
  const content = document.getElementById('paymentsContent');

  async function load() {
    content.innerHTML = '<span class="loading"><span class="spinner"></span>Memuat pembayaran...</span>';
    try {
      const status = document.getElementById('paymentStatus').value;
      const data = await A.api(`/api/admin/payments?status=${encodeURIComponent(status)}`);
      const rows = data.payments.length ? data.payments.map((payment) => `
        <tr>
          <td><b>${D.escapeHtml(payment.order_code)}</b><br><span class="help-text">${D.escapeHtml(payment.invoice_number)}</span></td>
          <td>${D.escapeHtml(payment.customer_name)}<br><span class="help-text">+${D.escapeHtml(payment.whatsapp)}</span></td>
          <td><b>${D.formatCurrency(payment.verified_amount ?? payment.declared_amount)}</b><br><span class="help-text">${D.escapeHtml(payment.payment_type)}</span></td>
          <td><span class="status-pill ${D.statusClass(payment.status)}">${D.escapeHtml(D.paymentStatusLabel(payment.status))}</span></td>
          <td>${payment.payer_name ? D.escapeHtml(payment.payer_name) : '-'}<br><span class="help-text">${payment.proof_object_key ? 'Data bukti versi lama' : 'Bukti via WhatsApp'}</span></td>
          <td>${D.formatDate(payment.created_at)}</td>
          <td><div class="table-actions">${payment.status === 'pending' ? `<button class="mini-btn success" data-verify="${D.escapeHtml(payment.id)}" data-amount="${payment.declared_amount}">Verifikasi</button><button class="mini-btn danger" data-reject="${D.escapeHtml(payment.id)}">Tolak</button>` : ''}<a class="mini-btn" href="/admin/pesanan/?id=${encodeURIComponent(payment.order_id)}">Pesanan</a></div></td>
        </tr>`).join('') : '<tr><td colspan="7">Tidak ada pembayaran.</td></tr>';
      content.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Nominal</th><th>Status</th><th>Sumber</th><th>Dicatat</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      content.querySelectorAll('[data-verify]').forEach((button) => button.addEventListener('click', () => verifyPayment(button.dataset.verify, button.dataset.amount)));
      content.querySelectorAll('[data-reject]').forEach((button) => button.addEventListener('click', () => rejectPayment(button.dataset.reject)));
    } catch (error) {
      content.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`;
    }
  }

  async function verifyPayment(id, amount) {
    const modal = A.modal('Verifikasi Pembayaran Lama', `<form id="verifyForm" class="form-grid"><div class="alert alert-warning">Gunakan data ini hanya bila bukti pembayaran sudah diperiksa melalui WhatsApp atau arsip lama.</div><div class="form-field"><label>Nominal yang diverifikasi</label><input name="verified_amount" type="number" min="1" required value="${D.escapeHtml(amount)}"></div><button class="primary-action" type="submit">Setujui Pembayaran</button></form>`);
    modal.querySelector('#verifyForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button');
      const form = new FormData(event.currentTarget);
      try {
        D.setButtonLoading(button, true, 'Memverifikasi...');
        await A.api(`/api/admin/payments/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'verify', verified_amount: Number(form.get('verified_amount')) }),
        });
        D.toast('Pembayaran berhasil diverifikasi.', 'success');
        modal.remove();
        load();
      } catch (error) {
        D.toast(error.message, 'error', 6000);
        D.setButtonLoading(button, false);
      }
    });
  }

  async function rejectPayment(id) {
    const modal = A.modal('Tolak Pembayaran', `<form id="rejectForm" class="form-grid"><div class="form-field"><label>Alasan penolakan</label><textarea name="rejection_reason" required minlength="5" placeholder="Contoh: Nominal tidak sesuai atau bukti tidak terbaca."></textarea></div><button class="danger-action" type="submit">Tolak Pembayaran</button></form>`);
    modal.querySelector('#rejectForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button');
      const form = new FormData(event.currentTarget);
      try {
        D.setButtonLoading(button, true, 'Memproses...');
        await A.api(`/api/admin/payments/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ action: 'reject', rejection_reason: form.get('rejection_reason') }),
        });
        D.toast('Pembayaran ditolak.', 'success');
        modal.remove();
        load();
      } catch (error) {
        D.toast(error.message, 'error', 6000);
        D.setButtonLoading(button, false);
      }
    });
  }

  document.getElementById('paymentStatus').addEventListener('change', load);
  document.getElementById('refreshPayments').addEventListener('click', load);
  load();
})();
