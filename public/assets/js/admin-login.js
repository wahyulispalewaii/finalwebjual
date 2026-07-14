(function () {
  'use strict';
  const D = window.Dibantu;
  const form = document.getElementById('loginForm');
  D.api('/api/admin/me').then(() => { location.href = '/admin/'; }).catch(() => {});
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const button = document.getElementById('loginButton');
    try {
      D.setButtonLoading(button, true, 'Memeriksa akun...');
      await D.api('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) });
      const next = new URLSearchParams(location.search).get('next');
      location.href = next && next.startsWith('/admin') ? next : '/admin/';
    } catch (error) { D.toast(error.message, 'error', 6000); D.setButtonLoading(button, false); }
  });
})();
