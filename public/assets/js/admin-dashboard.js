(async function () {
  'use strict';
  const D = window.Dibantu;
  const A = window.DibantuAdmin;
  const ctx = await A.init({ active: 'dashboard', title: 'Dashboard' });
  if (!ctx) return;
  ctx.page.innerHTML = '<span class="loading"><span class="spinner"></span>Memuat dashboard...</span>';
  try {
    const data = await A.api('/api/admin/dashboard');
    const m = data.metrics;
    const maxRevenue = Math.max(1, ...data.monthly_revenue.map((row) => Number(row.revenue)));
    const bars = data.monthly_revenue.length ? data.monthly_revenue.map((row) => `<div class="bar-item"><div class="bar" style="height:${Math.max(4, Number(row.revenue) / maxRevenue * 100)}%" title="${D.formatCurrency(row.revenue)}"></div><span class="bar-label">${D.escapeHtml(row.month?.slice(5) || '-')}</span></div>`).join('') : '<p class="panel-subtitle">Belum ada pembayaran terverifikasi.</p>';
    const recent = data.recent_orders.length ? data.recent_orders.map((order) => `<tr><td><b>${D.escapeHtml(order.order_code)}</b><br><span class="help-text">${D.escapeHtml(order.invoice_number)}</span></td><td>${D.escapeHtml(order.customer_name)}</td><td><span class="status-pill ${D.statusClass(order.status)}">${D.escapeHtml(order.status)}</span></td><td>${D.formatCurrency(order.total_amount)}</td><td>${D.formatDate(order.created_at)}</td><td><a class="mini-btn primary" href="/admin/pesanan/?id=${encodeURIComponent(order.id)}">Buka</a></td></tr>`).join('') : '<tr><td colspan="6">Belum ada pesanan.</td></tr>';
    ctx.page.innerHTML = `
      <div class="admin-page-head"><div><h1>Ringkasan Bisnis</h1><p>Pantau transaksi dan proyek dibantu.id dari satu dashboard.</p></div><a class="primary-action" href="/admin/pesanan/"><i class="fa-solid fa-bag-shopping"></i>Lihat Pesanan</a></div>
      <section class="admin-grid kpi-grid"><article class="kpi-card"><i class="fa-solid fa-receipt"></i><span>Total Pesanan</span><b>${m.total_orders}</b></article><article class="kpi-card"><i class="fa-solid fa-wallet"></i><span>Pendapatan</span><b>${D.formatCurrency(m.verified_revenue)}</b></article><article class="kpi-card"><i class="fa-solid fa-hourglass-half"></i><span>Pending Lama</span><b>${m.pending_payments}</b></article><article class="kpi-card"><i class="fa-solid fa-pen-ruler"></i><span>Proyek Aktif</span><b>${m.active_projects}</b></article><article class="kpi-card"><i class="fa-solid fa-circle-check"></i><span>Selesai</span><b>${m.completed_orders}</b></article></section>
      <section class="admin-grid detail-grid" style="margin-top:1rem"><article class="panel chart-card"><h2 class="panel-title">Pendapatan 6 Bulan</h2><div class="bars">${bars}</div></article><article class="panel"><h2 class="panel-title">Akses Cepat</h2><div class="form-grid"><a class="secondary-action" href="/admin/pembayaran/"><i class="fa-solid fa-money-check-dollar"></i>Riwayat Pembayaran</a><a class="secondary-action" href="/admin/layanan/"><i class="fa-solid fa-layer-group"></i>Kelola Harga Layanan</a><a class="secondary-action" href="/admin/pengaturan/"><i class="fa-solid fa-qrcode"></i>Atur QRIS</a></div></article></section>
      <section class="panel" style="margin-top:1rem"><h2 class="panel-title">Pesanan Terbaru</h2><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Status</th><th>Total</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody>${recent}</tbody></table></div></section>`;
  } catch (error) { ctx.page.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`; }
})();
