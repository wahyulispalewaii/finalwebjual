(async function () {
  'use strict';
  const D = window.Dibantu;
  const A = window.DibantuAdmin;
  const ctx = await A.init({ active: 'orders', title: 'Pesanan' });
  if (!ctx) return;

  const STATUS_OPTIONS = [
    ['awaiting_confirmation', 'Menunggu Konfirmasi'],
    ['awaiting_quote', 'Menunggu Penawaran'],
    ['awaiting_payment', 'Menunggu Pembayaran'],
    ['payment_review', 'Verifikasi Pembayaran'],
    ['payment_verified', 'Pembayaran Diverifikasi'],
    ['in_progress', 'Sedang Dikerjakan'],
    ['awaiting_review', 'Menunggu Review'],
    ['revision', 'Revisi'],
    ['completed', 'Selesai'],
    ['cancelled', 'Dibatalkan'],
  ];
  const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS);

  ctx.page.innerHTML = `
    <div class="admin-page-head"><div><h1>Manajemen Pesanan</h1><p>Perbarui status, catat pembayaran dari WhatsApp, dan buka invoice pelanggan.</p></div></div>
    <div class="filter-bar"><input id="orderSearch" placeholder="Cari kode, invoice, pelanggan, atau WhatsApp"><select id="orderStatus"><option value="all">Semua status</option>${STATUS_OPTIONS.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select><button id="refreshOrders" class="secondary-action"><i class="fa-solid fa-rotate"></i>Muat Ulang</button></div>
    <div id="ordersContent"><span class="loading"><span class="spinner"></span>Memuat pesanan...</span></div>`;

  const content = document.getElementById('ordersContent');
  let timer;

  async function loadOrders() {
    const search = document.getElementById('orderSearch').value.trim();
    const status = document.getElementById('orderStatus').value;
    content.innerHTML = '<span class="loading"><span class="spinner"></span>Memuat pesanan...</span>';
    try {
      const data = await A.api(`/api/admin/orders?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);
      const rows = data.orders.length ? data.orders.map((order) => `
        <tr>
          <td><b>${D.escapeHtml(order.order_code)}</b><br><span class="help-text">${D.escapeHtml(order.invoice_number)}</span></td>
          <td><b>${D.escapeHtml(order.customer_name)}</b><br><span class="help-text">+${D.escapeHtml(order.whatsapp)}</span></td>
          <td><span class="status-pill ${D.statusClass(order.status)}">${D.escapeHtml(STATUS_LABELS[order.status] || order.status)}</span>${Number(order.pending_payments) ? `<br><span class="help-text" style="color:#fde68a">${order.pending_payments} pembayaran pending</span>` : ''}</td>
          <td>${D.formatCurrency(order.total_amount)}<br><span class="help-text">Dibayar ${D.formatCurrency(order.invoice_paid_amount)}</span></td>
          <td>${D.formatDate(order.created_at)}</td>
          <td><div class="table-actions"><button class="mini-btn primary" data-open-order="${D.escapeHtml(order.id)}">Detail</button><a class="mini-btn" target="_blank" href="/invoice/?token=${encodeURIComponent(order.tracking_token)}">Invoice</a></div></td>
        </tr>`).join('') : '<tr><td colspan="6">Tidak ada pesanan yang sesuai.</td></tr>';
      content.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Status</th><th>Nilai</th><th>Dibuat</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      content.querySelectorAll('[data-open-order]').forEach((button) => button.addEventListener('click', () => openOrder(button.dataset.openOrder)));
    } catch (error) {
      content.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`;
    }
  }

  async function openOrder(id) {
    try {
      const { order } = await A.api(`/api/admin/orders/${encodeURIComponent(id)}`);
      const items = order.items.map((item) => `<div class="detail-row"><div><b>${D.escapeHtml(item.service_name_snapshot)}</b><div class="help-text">${D.escapeHtml(item.package_name_snapshot)} · Qty ${item.quantity}</div></div><b>${D.formatCurrency(item.line_total)}</b></div>`).join('');
      const payments = order.payments.length ? order.payments.map((payment) => `
        <div class="detail-row">
          <div><b>${D.escapeHtml(D.paymentStatusLabel(payment.status))}</b><div class="help-text">${D.formatDate(payment.created_at)} · ${D.escapeHtml(payment.payment_type)}</div>${payment.payer_name ? `<div class="help-text">Pembayar: ${D.escapeHtml(payment.payer_name)}</div>` : ''}${payment.customer_note ? `<div class="help-text">${D.escapeHtml(payment.customer_note)}</div>` : ''}</div>
          <div style="text-align:right"><b>${D.formatCurrency(payment.verified_amount ?? payment.declared_amount)}</b><br><span class="help-text">${payment.proof_object_key ? 'Bukti lama tersimpan' : 'Bukti via WhatsApp'}</span></div>
        </div>`).join('') : '<p class="panel-subtitle">Belum ada pembayaran.</p>';
      const paidAmount = Number(order.invoice_paid_amount || 0);
      const remainingAmount = Math.max(0, Number(order.total_amount || 0) - paidAmount);
      const canRecordPayment = remainingAmount > 0 && !['cancelled', 'completed'].includes(order.status) && order.invoice_status !== 'cancelled';

      const manualPaymentPanel = canRecordPayment ? `
        <form id="manualPaymentForm" class="panel form-grid">
          <h3 class="panel-title">Catat Pembayaran Manual</h3>
          <p class="panel-subtitle">Gunakan setelah bukti pembayaran diterima dan diperiksa melalui WhatsApp. Pembayaran langsung dicatat sebagai terverifikasi.</p>
          <div class="form-grid two">
            <div class="form-field"><label>Jenis pembayaran</label><select name="payment_type"><option value="${paidAmount === 0 ? (order.payment_mode === 'dp' ? 'dp' : 'full') : 'balance'}">${paidAmount === 0 ? (order.payment_mode === 'dp' ? 'DP' : 'Lunas') : 'Pelunasan / Sisa'}</option><option value="other">Lainnya</option></select></div>
            <div class="form-field"><label>Nominal diterima</label><input name="amount" type="number" min="1" max="${remainingAmount}" required value="${remainingAmount}"></div>
          </div>
          <div class="form-field"><label>Nama pembayar</label><input name="payer_name" maxlength="120" value="${D.escapeHtml(order.customer_name || '')}" placeholder="Nama pada akun pembayaran"></div>
          <div class="form-field"><label>Catatan pembayaran</label><textarea name="customer_note" maxlength="1000">Bukti pembayaran diterima melalui WhatsApp.</textarea></div>
          <div class="alert alert-warning">Pastikan nominal dan bukti di WhatsApp sudah benar. Tindakan ini langsung memperbarui total terbayar dan status invoice.</div>
          <button class="primary-action" type="submit"><i class="fa-solid fa-circle-check"></i>Catat Pembayaran</button>
        </form>` : `
        <section class="panel"><h3 class="panel-title">Catat Pembayaran Manual</h3><div class="alert ${remainingAmount <= 0 ? 'alert-success' : 'alert-warning'}">${remainingAmount <= 0 ? 'Invoice sudah lunas.' : 'Pembayaran baru tidak dapat dicatat untuk status pesanan ini.'}</div></section>`;

      const modal = A.modal(`Pesanan ${order.order_code}`, `
        <div class="admin-detail">
          <div class="meta-list"><div class="meta-item"><span>Pelanggan</span><b>${D.escapeHtml(order.customer_name)}</b></div><div class="meta-item"><span>Total</span><b>${D.formatCurrency(order.total_amount)}</b></div><div class="meta-item"><span>Dibayar</span><b>${D.formatCurrency(paidAmount)}</b></div><div class="meta-item"><span>Sisa</span><b>${D.formatCurrency(remainingAmount)}</b></div></div>
          <div class="detail-grid"><section class="panel"><h3 class="panel-title">Layanan</h3>${items}</section><section class="panel"><h3 class="panel-title">Riwayat Pembayaran</h3>${payments}</section></div>
          ${manualPaymentPanel}
          <section class="panel"><h3 class="panel-title">Brief Proyek</h3><p><b>${D.escapeHtml(order.project_title || '-')}</b></p><p style="white-space:pre-wrap;color:var(--text-muted);line-height:1.65">${D.escapeHtml(order.brief_description || '-')}</p><p class="help-text">Target: ${D.escapeHtml(order.desired_deadline || '-')}</p></section>
          <form id="orderUpdateForm" class="panel form-grid"><h3 class="panel-title">Perbarui Pesanan</h3><div class="form-field"><label>Status</label><select name="status">${STATUS_OPTIONS.map(([value, label]) => `<option value="${value}" ${order.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="form-field"><label>Catatan perubahan status</label><input name="status_note" maxlength="1000" placeholder="Contoh: Draft pertama dikirim ke pelanggan."></div><div class="form-field"><label>Catatan internal</label><textarea name="internal_notes" maxlength="3000">${D.escapeHtml(order.internal_notes || '')}</textarea></div><div style="display:flex;gap:.75rem;flex-wrap:wrap"><button class="primary-action" type="submit">Simpan Perubahan</button><a class="secondary-action" target="_blank" href="/invoice/?token=${encodeURIComponent(order.tracking_token)}">Cetak Invoice</a><a class="secondary-action" target="_blank" href="/pesanan/?token=${encodeURIComponent(order.tracking_token)}">Tampilan Pelanggan</a></div></form>
        </div>`);

      const manualForm = modal.querySelector('#manualPaymentForm');
      if (manualForm) {
        manualForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const button = event.currentTarget.querySelector('button[type="submit"]');
          try {
            D.setButtonLoading(button, true, 'Mencatat...');
            await A.api(`/api/admin/orders/${encodeURIComponent(id)}/payments`, {
              method: 'POST',
              body: JSON.stringify({
                payment_type: form.get('payment_type'),
                amount: Number(form.get('amount')),
                payer_name: form.get('payer_name'),
                customer_note: form.get('customer_note'),
              }),
            });
            D.toast('Pembayaran manual berhasil dicatat.', 'success', 5000);
            modal.remove();
            await loadOrders();
            openOrder(id);
          } catch (error) {
            D.toast(error.message, 'error', 6000);
            D.setButtonLoading(button, false);
          }
        });
      }

      modal.querySelector('#orderUpdateForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const button = event.currentTarget.querySelector('button[type="submit"]');
        try {
          D.setButtonLoading(button, true, 'Menyimpan...');
          await A.api(`/api/admin/orders/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({
              status: form.get('status'),
              status_note: form.get('status_note'),
              internal_notes: form.get('internal_notes'),
            }),
          });
          D.toast('Pesanan berhasil diperbarui.', 'success');
          modal.remove();
          loadOrders();
        } catch (error) {
          D.toast(error.message, 'error', 6000);
          D.setButtonLoading(button, false);
        }
      });
    } catch (error) {
      D.toast(error.message, 'error', 6000);
    }
  }

  document.getElementById('refreshOrders').addEventListener('click', loadOrders);
  document.getElementById('orderStatus').addEventListener('change', loadOrders);
  document.getElementById('orderSearch').addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(loadOrders, 350);
  });
  await loadOrders();
  const id = new URLSearchParams(location.search).get('id');
  if (id) openOrder(id);
})();
