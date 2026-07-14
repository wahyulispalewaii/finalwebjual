(function () {
  'use strict';
  const D = window.Dibantu;
  let session = null;

  async function adminApi(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const method = String(options.method || 'GET').toUpperCase();
    if (!['GET', 'HEAD'].includes(method) && session?.csrf_token) headers.set('x-csrf-token', session.csrf_token);
    return D.api(path, { ...options, headers });
  }

  function navItem(href, icon, label, active, key) {
    return `<a href="${href}" class="${active === key ? 'active' : ''}"><i class="fa-solid ${icon}"></i><span>${label}</span></a>`;
  }

  async function init(options = {}) {
    try {
      session = await D.api('/api/admin/me');
    } catch (error) {
      if (error.status === 401) {
        const next = encodeURIComponent(location.pathname + location.search);
        location.href = `/admin/login/?next=${next}`;
        return null;
      }
      throw error;
    }
    const root = document.getElementById('adminShell');
    root.innerHTML = `
      <div class="admin-shell">
        <aside class="admin-sidebar" data-admin-sidebar>
          <div class="admin-sidebar-logo"><a href="/admin/"><img src="/assets/img/LOGO_DIBANTU.ID.png" alt="dibantu.id"></a><button class="icon-button" data-close-sidebar><i class="fa-solid fa-xmark"></i></button></div>
          <nav class="admin-nav">
            ${navItem('/admin/', 'fa-chart-line', 'Dashboard', options.active, 'dashboard')}
            ${navItem('/admin/pesanan/', 'fa-bag-shopping', 'Pesanan', options.active, 'orders')}
            ${navItem('/admin/pembayaran/', 'fa-money-check-dollar', 'Pembayaran', options.active, 'payments')}
            ${navItem('/admin/layanan/', 'fa-layer-group', 'Layanan & Paket', options.active, 'services')}
            ${navItem('/admin/pengaturan/', 'fa-gear', 'Pengaturan', options.active, 'settings')}
            <a href="/" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i><span>Lihat Website</span></a>
          </nav>
        </aside>
        <section class="admin-main">
          <header class="admin-topbar"><div class="admin-topbar-left"><button class="icon-button" data-open-sidebar><i class="fa-solid fa-bars"></i></button><b>${D.escapeHtml(options.title || 'Admin')}</b></div><div class="admin-topbar-right"><button class="icon-button" data-theme-toggle><i class="fa-solid fa-circle-half-stroke"></i></button><span class="status-pill info">${D.escapeHtml(session.admin.name)}</span><button class="icon-button" data-logout title="Keluar"><i class="fa-solid fa-right-from-bracket"></i></button></div></header>
          <main id="adminPage" class="admin-page"></main>
        </section>
      </div>`;
    const sidebar = root.querySelector('[data-admin-sidebar]');
    root.querySelector('[data-open-sidebar]').addEventListener('click', () => sidebar.classList.add('open'));
    root.querySelector('[data-close-sidebar]').addEventListener('click', () => sidebar.classList.remove('open'));
    root.querySelector('[data-theme-toggle]').addEventListener('click', D.toggleTheme);
    root.querySelector('[data-logout]').addEventListener('click', async () => {
      try { await adminApi('/api/admin/logout', { method: 'POST' }); } finally { location.href = '/admin/login/'; }
    });
    return { page: document.getElementById('adminPage'), admin: session.admin };
  }

  function modal(title, content) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `<div class="modal"><div class="modal-head"><h2>${D.escapeHtml(title)}</h2><button class="icon-button" data-modal-close><i class="fa-solid fa-xmark"></i></button></div><div data-modal-body>${content}</div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (event) => { if (event.target === wrap) wrap.remove(); });
    wrap.querySelector('[data-modal-close]').addEventListener('click', () => wrap.remove());
    return wrap;
  }

  window.DibantuAdmin = { init, api: adminApi, modal, get session() { return session; } };
})();
