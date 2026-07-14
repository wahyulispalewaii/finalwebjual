(function () {
  'use strict';

  const CART_KEY = 'dibantu_cart_v1';
  const THEME_KEY = 'dibantu-theme';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function formatDate(value, withTime = true) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      dateStyle: 'medium',
      ...(withTime ? { timeStyle: 'short' } : {}),
    }).format(date) + (withTime ? ' WITA' : '');
  }

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !(options.body instanceof FormData) && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    const response = await fetch(path, { credentials: 'same-origin', ...options, headers });
    const type = response.headers.get('content-type') || '';
    const data = type.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      const error = new Error(data?.message || `Permintaan gagal (${response.status}).`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function readCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
    window.dispatchEvent(new CustomEvent('dibantu:cart', { detail: cart }));
  }

  const cart = {
    get: readCart,
    add(item) {
      const items = readCart();
      const existing = items.find((entry) => entry.package_id === item.package_id);
      if (existing) existing.quantity = Math.min(10, Number(existing.quantity || 1) + 1);
      else items.push({ ...item, quantity: 1, addon_ids: item.addon_ids || [] });
      writeCart(items);
      return items;
    },
    remove(packageId) {
      const items = readCart().filter((item) => item.package_id !== packageId);
      writeCart(items);
      return items;
    },
    setQuantity(packageId, quantity) {
      const items = readCart();
      const target = items.find((item) => item.package_id === packageId);
      if (target) target.quantity = Math.max(1, Math.min(10, Number(quantity || 1)));
      writeCart(items);
      return items;
    },
    clear() { writeCart([]); },
    count() { return readCart().reduce((sum, item) => sum + Number(item.quantity || 1), 0); },
    total() { return readCart().reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0); },
  };

  function updateCartBadge() {
    document.querySelectorAll('[data-cart-count]').forEach((node) => {
      const count = cart.count();
      node.textContent = String(count);
      node.hidden = count < 1;
    });
  }

  function restoreTheme() {
    if (localStorage.getItem(THEME_KEY) === 'light') document.documentElement.setAttribute('data-theme', 'light');
  }

  function toggleTheme() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    if (light) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }

  function renderHeader(active = '') {
    const root = document.querySelector('[data-app-header]');
    if (!root) return;
    root.innerHTML = `
      <header class="app-header">
        <div class="container app-header-inner">
          <a class="app-brand" href="/"><img src="/assets/img/LOGO_DIBANTU.ID.png" alt="dibantu.id"></a>
          <nav class="app-nav" aria-label="Navigasi aplikasi">
            <a class="${active === 'services' ? 'active' : ''}" href="/layanan/">Layanan</a>
            <a class="${active === 'track' ? 'active' : ''}" href="/lacak/">Lacak Pesanan</a>
            <a href="/#portfolio">Portofolio</a>
            <a href="/#contact">Kontak</a>
          </nav>
          <div class="app-actions">
            <button class="icon-button" type="button" data-theme-toggle aria-label="Ganti tema"><i class="fa-solid fa-circle-half-stroke"></i></button>
            <a class="icon-button" href="/checkout/" aria-label="Keranjang"><i class="fa-solid fa-cart-shopping"></i><span class="cart-count" data-cart-count hidden>0</span></a>
            <button class="icon-button app-menu-toggle" type="button" data-menu-toggle aria-label="Buka menu"><i class="fa-solid fa-bars"></i></button>
          </div>
        </div>
      </header>
      <nav class="app-mobile-menu" data-mobile-menu>
        <a href="/layanan/">Layanan</a>
        <a href="/lacak/">Lacak Pesanan</a>
        <a href="/checkout/">Keranjang</a>
        <a href="/#portfolio">Portofolio</a>
        <a href="/#contact">Kontak</a>
      </nav>`;
    root.querySelector('[data-theme-toggle]').addEventListener('click', toggleTheme);
    root.querySelector('[data-menu-toggle]').addEventListener('click', () => root.querySelector('[data-mobile-menu]').classList.toggle('open'));
    updateCartBadge();
  }

  function renderFooter() {
    const root = document.querySelector('[data-app-footer]');
    if (!root) return;
    root.innerHTML = `
      <footer class="app-footer">
        <div class="container app-footer-inner">
          <div><img src="/assets/img/LOGO_DIBANTU.ID.png" alt="dibantu.id"><p>Solusi digital dan kreatif untuk pelajar, UMKM, dan startup.</p></div>
          <p>© ${new Date().getFullYear()} dibantu.id · Marioriwawo, Soppeng.</p>
        </div>
      </footer>`;
  }

  function toast(message, type = 'info', timeout = 3500) {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.textContent = message;
    stack.appendChild(node);
    window.setTimeout(() => node.remove(), timeout);
  }

  function setButtonLoading(button, loading, label = 'Memproses...') {
    if (!button) return;
    if (loading) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="loading"><span class="spinner"></span>${escapeHtml(label)}</span>`;
    } else {
      button.disabled = false;
      if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    }
  }

  function statusClass(status) {
    if (['paid', 'verified', 'payment_verified', 'completed'].includes(status)) return 'success';
    if (['cancelled', 'rejected', 'expired'].includes(status)) return 'danger';
    if (['payment_review', 'pending', 'partially_paid', 'in_progress', 'awaiting_review', 'revision'].includes(status)) return 'info';
    return 'pending';
  }

  function invoiceStatusLabel(status) {
    const labels = {
      draft: 'Draft', issued: 'Diterbitkan', payment_review: 'Verifikasi Pembayaran',
      partially_paid: 'Dibayar Sebagian', paid: 'Lunas', expired: 'Jatuh Tempo', cancelled: 'Dibatalkan',
    };
    return labels[status] || status;
  }

  function paymentStatusLabel(status) {
    const labels = { pending: 'Menunggu Verifikasi', verified: 'Terverifikasi', rejected: 'Ditolak', refunded: 'Dikembalikan' };
    return labels[status] || status;
  }

  function startCountdown(target, element, onExpire) {
    if (!target || !element) return null;
    const tick = () => {
      const remaining = new Date(target).getTime() - Date.now();
      if (remaining <= 0) {
        element.textContent = '00:00:00';
        if (onExpire) onExpire();
        return false;
      }
      const hours = Math.floor(remaining / 3_600_000);
      const minutes = Math.floor((remaining % 3_600_000) / 60_000);
      const seconds = Math.floor((remaining % 60_000) / 1000);
      element.textContent = [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
      return true;
    };
    tick();
    const interval = window.setInterval(() => { if (!tick()) window.clearInterval(interval); }, 1000);
    return interval;
  }

  restoreTheme();
  document.addEventListener('DOMContentLoaded', () => {
    renderHeader(document.body.dataset.active || '');
    renderFooter();
    updateCartBadge();
  });

  window.Dibantu = {
    api, cart, escapeHtml, formatCurrency, formatDate, toast, setButtonLoading,
    statusClass, invoiceStatusLabel, paymentStatusLabel, startCountdown, toggleTheme,
  };
})();
