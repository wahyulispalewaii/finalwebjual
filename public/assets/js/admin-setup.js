(function () {
  'use strict';
  const D = window.Dibantu;
  const form = document.getElementById('setupForm');
  const status = document.getElementById('setupStatus');
  D.api('/api/admin/setup').then((data) => {
    if (!data.setup_required) {
      status.innerHTML = '<div class="alert alert-info">Setup sudah selesai. Silakan masuk melalui halaman login.</div>';
      form.hidden = true;
      window.setTimeout(() => { location.href = '/admin/login/'; }, 1200);
    }
  }).catch((error) => { status.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`; });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const password = String(data.get('password'));
    if (password !== String(data.get('confirm_password'))) { D.toast('Konfirmasi password tidak sama.', 'error'); return; }
    const button = document.getElementById('setupButton');
    try {
      D.setButtonLoading(button, true, 'Membuat akun...');
      await D.api('/api/admin/setup', { method: 'POST', body: JSON.stringify({ name: data.get('name'), email: data.get('email'), password }) });
      D.toast('Akun pemilik berhasil dibuat.', 'success');
      location.href = '/admin/';
    } catch (error) { D.toast(error.message, 'error', 6000); D.setButtonLoading(button, false); }
  });
})();
