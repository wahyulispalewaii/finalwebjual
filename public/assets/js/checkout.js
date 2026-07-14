(function () {
  'use strict';
  const D = window.Dibantu;
  const root = document.getElementById('checkoutRoot');

  function render() {
    const cart = D.cart.get();
    if (!cart.length) {
      root.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-cart-shopping"></i><h3>Keranjang masih kosong</h3><p>Pilih paket layanan sebelum melanjutkan checkout.</p><a class="primary-action" href="/layanan/">Lihat Katalog</a></div>`;
      return;
    }
    const subtotal = D.cart.total();
    root.innerHTML = `
      <form id="checkoutForm" class="form-grid">
        <section class="panel"><h2 class="panel-title">Identitas pelanggan</h2><p class="panel-subtitle">Gunakan kontak aktif untuk konfirmasi dan komunikasi proyek.</p>
          <div class="form-grid two">
            <div class="form-field"><label>Nama lengkap</label><input name="name" required maxlength="120" autocomplete="name"></div>
            <div class="form-field"><label>Nomor WhatsApp</label><input name="whatsapp" required maxlength="20" inputmode="tel" placeholder="0878..."></div>
            <div class="form-field"><label>Email</label><input name="email" type="email" maxlength="160" autocomplete="email"></div>
            <div class="form-field"><label>Nama bisnis / instansi</label><input name="business_name" maxlength="160" placeholder="Opsional"></div>
          </div>
        </section>
        <section class="panel"><h2 class="panel-title">Brief proyek</h2><p class="panel-subtitle">Detail yang jelas membantu admin menilai ruang lingkup sejak awal.</p>
          <div class="form-grid two">
            <div class="form-field"><label>Judul proyek</label><input name="project_title" maxlength="200" placeholder="Contoh: Katalog Produk UMKM"></div>
            <div class="form-field"><label>Target selesai</label><input name="desired_deadline" type="date"></div>
          </div>
          <div class="form-field"><label>Deskripsi kebutuhan</label><textarea name="description" required minlength="10" maxlength="5000" placeholder="Jelaskan tujuan, target pengguna, fitur, gaya visual, dan output yang diharapkan."></textarea></div>
          <div class="form-field"><label>Referensi</label><textarea name="references_text" maxlength="3000" placeholder="Tautan atau deskripsi referensi desain."></textarea></div>
          <div class="form-field"><label>Catatan tambahan</label><textarea name="additional_notes" maxlength="3000" placeholder="Informasi tambahan yang perlu diketahui admin."></textarea></div>
        </section>
        <section class="panel"><h2 class="panel-title">Model pembayaran</h2><div class="radio-cards">
          <label class="radio-card"><input type="radio" name="payment_mode" value="full" checked><span><b>Bayar Lunas</b><span>Bayar 100% dari total tagihan.</span></span></label>
          <label class="radio-card"><input type="radio" name="payment_mode" value="dp"><span><b>DP 50%</b><span>Bayar 50% untuk memulai proyek, lalu lunasi sisa pembayaran.</span></span></label>
        </div></section>
        <label class="check-row"><input type="checkbox" name="terms" required><span>Saya memastikan data dan brief sudah benar serta memahami bahwa harga final dapat dikonfirmasi kembali apabila ruang lingkup berubah.</span></label>
        <button id="submitOrder" class="primary-action" type="submit">Buat Pesanan dan Invoice <i class="fa-solid fa-arrow-right"></i></button>
      </form>
      <aside class="checkout-summary"><div class="panel sticky-card"><h2 class="panel-title">Ringkasan pesanan</h2><div id="cartList" class="cart-list"></div><div class="summary-row total"><span>Subtotal</span><b>${D.formatCurrency(subtotal)}</b></div><div class="summary-row due" id="duePreview"><span>Tagihan awal</span><b>${D.formatCurrency(subtotal)}</b></div><p class="help-text">Nominal resmi dihitung ulang oleh server saat pesanan dibuat.</p><a class="secondary-action" href="/layanan/" style="width:100%;margin-top:.75rem"><i class="fa-solid fa-plus"></i>Tambah Layanan</a></div></aside>`;

    const list = document.getElementById('cartList');
    function renderCart() {
      const items = D.cart.get();
      list.innerHTML = items.map((item) => `<div class="cart-item"><div><h4>${D.escapeHtml(item.service_name)}</h4><p>${D.escapeHtml(item.package_name)} · Qty ${Number(item.quantity || 1)}</p><button class="cart-remove" type="button" data-remove="${D.escapeHtml(item.package_id)}">Hapus</button></div><div class="cart-price">${D.formatCurrency(Number(item.price) * Number(item.quantity || 1))}</div></div>`).join('');
      list.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => {
        D.cart.remove(button.dataset.remove);
        if (!D.cart.get().length) render(); else { renderCart(); updateDue(); }
      }));
    }
    function updateDue() {
      const total = D.cart.total();
      const mode = document.querySelector('input[name="payment_mode"]:checked')?.value || 'full';
      document.getElementById('duePreview').innerHTML = `<span>Tagihan awal</span><b>${D.formatCurrency(mode === 'dp' ? Math.ceil(total * .5) : total)}</b>`;
    }
    renderCart();
    document.querySelectorAll('input[name="payment_mode"]').forEach((input) => input.addEventListener('change', updateDue));

    document.getElementById('checkoutForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const button = document.getElementById('submitOrder');
      const form = new FormData(event.currentTarget);
      const payload = {
        customer: {
          name: form.get('name'), whatsapp: form.get('whatsapp'), email: form.get('email'), business_name: form.get('business_name'),
        },
        items: D.cart.get().map((item) => ({ package_id: item.package_id, quantity: Number(item.quantity || 1), addon_ids: item.addon_ids || [] })),
        brief: {
          project_title: form.get('project_title'), description: form.get('description'), references_text: form.get('references_text'),
          desired_deadline: form.get('desired_deadline'), additional_notes: form.get('additional_notes'),
        },
        payment_mode: form.get('payment_mode'), terms_accepted: form.get('terms') === 'on',
      };
      try {
        D.setButtonLoading(button, true, 'Membuat pesanan...');
        const result = await D.api('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
        D.cart.clear();
        sessionStorage.setItem('dibantu_last_order', JSON.stringify(result.order));
        window.location.href = `/pesanan-berhasil/?token=${encodeURIComponent(result.order.tracking_token)}`;
      } catch (error) {
        D.toast(error.message, 'error', 6000);
        D.setButtonLoading(button, false);
      }
    });
  }

  render();
})();
