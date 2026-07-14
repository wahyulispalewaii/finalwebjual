(async function () {
  'use strict';
  const D = window.Dibantu;
  const A = window.DibantuAdmin;
  const ctx = await A.init({ active: 'services', title: 'Layanan & Paket' });
  if (!ctx) return;
  let dataCache = null;

  ctx.page.innerHTML = `
    <div class="admin-page-head"><div><h1>Layanan dan Harga</h1><p>Perubahan harga di katalog tidak mengubah invoice lama karena transaksi memakai snapshot.</p></div><button id="addService" class="primary-action"><i class="fa-solid fa-plus"></i>Tambah Layanan</button></div>
    <div id="servicesContent"><span class="loading"><span class="spinner"></span>Memuat layanan...</span></div>`;
  const content = document.getElementById('servicesContent');

  function serviceCard(service) {
    return `<article class="service-admin-card"><div class="service-admin-head"><div><h3>${D.escapeHtml(service.name)} ${service.is_active ? '' : '<span class="status-pill danger">Nonaktif</span>'}</h3><p class="panel-subtitle">${D.escapeHtml(service.short_description || '')}</p></div><div class="table-actions"><button class="mini-btn primary" data-edit-service="${D.escapeHtml(service.id)}">Edit Layanan</button><button class="mini-btn" data-add-package="${D.escapeHtml(service.id)}">Tambah Paket</button></div></div><div class="admin-package-list">${service.packages.map((pkg) => `<div class="admin-package"><div><div class="admin-package-head"><h4>${D.escapeHtml(pkg.name)}</h4><span class="status-pill ${pkg.is_active ? 'success' : 'danger'}">${pkg.is_active ? 'Aktif' : 'Nonaktif'}</span></div><p>${D.escapeHtml(pkg.description || '')}</p><b>${D.formatCurrency(pkg.price)} ${pkg.price_label ? `· ${D.escapeHtml(pkg.price_label)}` : ''}</b><p>${(pkg.features || []).map(D.escapeHtml).join(' · ')}</p></div><button class="mini-btn primary" data-edit-package="${D.escapeHtml(pkg.id)}">Edit Paket</button></div>`).join('') || '<p class="panel-subtitle">Belum ada paket.</p>'}</div></article>`;
  }

  async function load() {
    content.innerHTML = '<span class="loading"><span class="spinner"></span>Memuat layanan...</span>';
    try {
      dataCache = await A.api('/api/admin/services');
      content.innerHTML = `<div class="admin-grid">${dataCache.services.map(serviceCard).join('')}</div>`;
      content.querySelectorAll('[data-edit-service]').forEach((button) => button.addEventListener('click', () => editService(button.dataset.editService)));
      content.querySelectorAll('[data-edit-package]').forEach((button) => button.addEventListener('click', () => editPackage(button.dataset.editPackage)));
      content.querySelectorAll('[data-add-package]').forEach((button) => button.addEventListener('click', () => addPackage(button.dataset.addPackage)));
    } catch (error) { content.innerHTML = `<div class="alert alert-danger">${D.escapeHtml(error.message)}</div>`; }
  }

  function categoryOptions(selected) {
    return dataCache.categories.map((cat) => `<option value="${D.escapeHtml(cat.id)}" ${cat.id === selected ? 'selected' : ''}>${D.escapeHtml(cat.name)}</option>`).join('');
  }

  function editService(id) {
    const service = dataCache.services.find((item) => item.id === id);
    if (!service) return;
    const modal = A.modal('Edit Layanan', `<form id="serviceForm" class="form-grid"><div class="form-grid two"><div class="form-field"><label>Nama</label><input name="name" required value="${D.escapeHtml(service.name)}"></div><div class="form-field"><label>Slug</label><input name="slug" required value="${D.escapeHtml(service.slug)}"></div><div class="form-field"><label>Kategori</label><select name="category_id">${categoryOptions(service.category_id)}</select></div><div class="form-field"><label>Urutan</label><input name="sort_order" type="number" value="${service.sort_order}"></div></div><div class="form-field"><label>Deskripsi singkat</label><textarea name="short_description">${D.escapeHtml(service.short_description || '')}</textarea></div><label class="check-row"><input type="checkbox" name="is_active" ${service.is_active ? 'checked' : ''}><span>Aktifkan layanan pada katalog publik.</span></label><button class="primary-action" type="submit">Simpan Layanan</button></form>`);
    modal.querySelector('#serviceForm').addEventListener('submit', async (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const button = event.currentTarget.querySelector('button');
      try { D.setButtonLoading(button, true, 'Menyimpan...'); await A.api(`/api/admin/services/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ name: form.get('name'), slug: form.get('slug'), category_id: form.get('category_id'), sort_order: Number(form.get('sort_order')), short_description: form.get('short_description'), is_active: form.get('is_active') === 'on' }) }); D.toast('Layanan diperbarui.', 'success'); modal.remove(); load(); } catch (error) { D.toast(error.message, 'error', 6000); D.setButtonLoading(button, false); }
    });
  }

  function packageFormHtml(pkg = {}) {
    return `<div class="form-grid two"><div class="form-field"><label>Nama paket</label><input name="name" required value="${D.escapeHtml(pkg.name || '')}"></div><div class="form-field"><label>Slug</label><input name="slug" value="${D.escapeHtml(pkg.slug || '')}"></div><div class="form-field"><label>Harga numerik</label><input name="price" type="number" min="0" required value="${Number(pkg.price || 0)}"></div><div class="form-field"><label>Label harga</label><input name="price_label" value="${D.escapeHtml(pkg.price_label || '')}" placeholder="Contoh: Rp1jt+"></div><div class="form-field"><label>Estimasi minimum (hari)</label><input name="estimated_days_min" type="number" min="1" value="${Number(pkg.estimated_days_min || 1)}"></div><div class="form-field"><label>Estimasi maksimum (hari)</label><input name="estimated_days_max" type="number" min="1" value="${Number(pkg.estimated_days_max || 7)}"></div></div><div class="form-field"><label>Deskripsi</label><textarea name="description">${D.escapeHtml(pkg.description || '')}</textarea></div><div class="form-field"><label>Fitur, satu per baris</label><textarea name="features">${D.escapeHtml((pkg.features || []).join('\n'))}</textarea></div><div class="form-grid two"><label class="check-row"><input type="checkbox" name="is_featured" ${pkg.is_featured ? 'checked' : ''}><span>Tandai sebagai paket unggulan.</span></label><label class="check-row"><input type="checkbox" name="is_active" ${pkg.is_active === undefined || pkg.is_active ? 'checked' : ''}><span>Aktifkan paket.</span></label></div>`;
  }

  function editPackage(id) {
    let pkg; dataCache.services.some((service) => { pkg = service.packages.find((item) => item.id === id); return Boolean(pkg); });
    if (!pkg) return;
    const modal = A.modal('Edit Paket', `<form id="packageForm" class="form-grid">${packageFormHtml(pkg)}<button class="primary-action" type="submit">Simpan Paket</button></form>`);
    modal.querySelector('#packageForm').addEventListener('submit', async (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const button = event.currentTarget.querySelector('button');
      try { D.setButtonLoading(button, true, 'Menyimpan...'); await A.api(`/api/admin/packages/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ name: form.get('name'), slug: form.get('slug'), price: Number(form.get('price')), price_label: form.get('price_label'), description: form.get('description'), estimated_days_min: Number(form.get('estimated_days_min')), estimated_days_max: Number(form.get('estimated_days_max')), features: String(form.get('features')).split('\n').map((x)=>x.trim()).filter(Boolean), is_featured: form.get('is_featured') === 'on', is_active: form.get('is_active') === 'on' }) }); D.toast('Paket diperbarui.', 'success'); modal.remove(); load(); } catch (error) { D.toast(error.message, 'error', 6000); D.setButtonLoading(button, false); }
    });
  }

  function addPackage(serviceId) {
    const modal = A.modal('Tambah Paket', `<form id="newPackageForm" class="form-grid">${packageFormHtml({})}<button class="primary-action" type="submit">Buat Paket</button></form>`);
    modal.querySelector('#newPackageForm').addEventListener('submit', async (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const button = event.currentTarget.querySelector('button');
      try { D.setButtonLoading(button, true, 'Membuat...'); await A.api('/api/admin/packages', { method: 'POST', body: JSON.stringify({ service_id: serviceId, name: form.get('name'), slug: form.get('slug'), price: Number(form.get('price')), price_label: form.get('price_label'), description: form.get('description'), estimated_days_min: Number(form.get('estimated_days_min')), estimated_days_max: Number(form.get('estimated_days_max')), features: String(form.get('features')).split('\n').map((x)=>x.trim()).filter(Boolean), is_featured: form.get('is_featured') === 'on', is_active: form.get('is_active') === 'on' }) }); D.toast('Paket dibuat.', 'success'); modal.remove(); load(); } catch (error) { D.toast(error.message, 'error', 6000); D.setButtonLoading(button, false); }
    });
  }

  document.getElementById('addService').addEventListener('click', () => {
    if (!dataCache) return;
    const modal = A.modal('Tambah Layanan', `<form id="newServiceForm" class="form-grid"><div class="form-grid two"><div class="form-field"><label>Nama</label><input name="name" required></div><div class="form-field"><label>Slug</label><input name="slug" placeholder="Otomatis dari nama jika kosong"></div><div class="form-field"><label>Kategori</label><select name="category_id">${categoryOptions('')}</select></div><div class="form-field"><label>Urutan</label><input name="sort_order" type="number" value="0"></div></div><div class="form-field"><label>Deskripsi singkat</label><textarea name="short_description"></textarea></div><button class="primary-action" type="submit">Buat Layanan</button></form>`);
    modal.querySelector('#newServiceForm').addEventListener('submit', async (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const button = event.currentTarget.querySelector('button');
      const name = String(form.get('name')); const slug = String(form.get('slug') || name);
      try { D.setButtonLoading(button, true, 'Membuat...'); await A.api('/api/admin/services', { method: 'POST', body: JSON.stringify({ name, slug, category_id: form.get('category_id'), sort_order: Number(form.get('sort_order')), short_description: form.get('short_description'), is_active: true }) }); D.toast('Layanan dibuat.', 'success'); modal.remove(); load(); } catch (error) { D.toast(error.message, 'error', 6000); D.setButtonLoading(button, false); }
    });
  });

  load();
})();
