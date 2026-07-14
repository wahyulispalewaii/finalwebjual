(function () {
  'use strict';
  const D = window.Dibantu;
  const root = document.getElementById('servicesRoot');

  function packageCard(service, pkg) {
    const features = (pkg.features || []).map((item) => `<li><i class="fa-solid fa-check"></i><span>${D.escapeHtml(item)}</span></li>`).join('');
    const meta = pkg.estimated_days_min ? `${pkg.estimated_days_min}${pkg.estimated_days_max && pkg.estimated_days_max !== pkg.estimated_days_min ? `–${pkg.estimated_days_max}` : ''} hari` : 'Estimasi dikonfirmasi admin';
    return `
      <article class="package-card ${pkg.is_featured ? 'featured' : ''}">
        ${pkg.is_featured ? '<span class="package-badge">Paling Laris</span>' : ''}
        <h3>${D.escapeHtml(pkg.name)}</h3>
        <p class="package-desc">${D.escapeHtml(pkg.description || '')}</p>
        <div class="package-price">${D.escapeHtml(pkg.price_label || D.formatCurrency(pkg.price))}</div>
        <div class="package-meta"><i class="fa-regular fa-clock"></i> ${D.escapeHtml(meta)}</div>
        <ul class="package-features">${features}</ul>
        <button class="primary-action" type="button" data-add-package="${D.escapeHtml(pkg.id)}">Pilih Paket <i class="fa-solid fa-arrow-right"></i></button>
      </article>`;
  }

  function render(services) {
    if (!services.length) {
      root.innerHTML = '<div class="empty-state"><i class="fa-solid fa-box-open"></i><h3>Belum ada layanan aktif</h3><p>Admin belum mengaktifkan katalog.</p></div>';
      return;
    }
    root.innerHTML = services.map((service) => `
      <section class="catalog-service">
        <div class="catalog-service-head">
          <div class="catalog-service-media">${service.image_url ? `<img src="${D.escapeHtml(service.image_url)}" alt="${D.escapeHtml(service.name)}">` : `<div><span class="status-pill info">${D.escapeHtml(service.category_name)}</span></div>`}</div>
          <div class="catalog-service-copy"><p class="page-kicker">${D.escapeHtml(service.category_name)}</p><h2>${D.escapeHtml(service.name)}</h2><p>${D.escapeHtml(service.description || service.short_description || '')}</p></div>
        </div>
        <div class="package-grid">${service.packages.map((pkg) => packageCard(service, pkg)).join('')}</div>
      </section>`).join('');

    const packageMap = new Map();
    services.forEach((service) => service.packages.forEach((pkg) => packageMap.set(pkg.id, { service, pkg })));
    root.querySelectorAll('[data-add-package]').forEach((button) => {
      button.addEventListener('click', () => {
        const entry = packageMap.get(button.dataset.addPackage);
        if (!entry) return;
        D.cart.add({
          package_id: entry.pkg.id,
          service_id: entry.service.id,
          service_name: entry.service.name,
          package_name: entry.pkg.name,
          description: entry.pkg.description,
          price: Number(entry.pkg.price),
          price_label: entry.pkg.price_label,
        });
        D.toast(`${entry.service.name} · ${entry.pkg.name} ditambahkan ke keranjang.`, 'success');
        button.innerHTML = '<i class="fa-solid fa-check"></i>Ditambahkan';
        window.setTimeout(() => { button.innerHTML = 'Pilih Paket <i class="fa-solid fa-arrow-right"></i>'; }, 1200);
      });
    });
  }

  D.api('/api/services').then((data) => render(data.services || [])).catch((error) => {
    root.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)} Pastikan binding D1 dan migration telah dikonfigurasi.</div>`;
  });
})();
