(function () {
  'use strict';

  const WA_NUMBER = '6287858468082';
  const header = document.getElementById('siteHeader');
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const heroVisual = document.getElementById('heroVisual');
  const pricingTabs = document.getElementById('pricingTabs');
  const pricingCards = document.getElementById('pricingCards');
  const briefForm = document.getElementById('briefForm');
  const year = document.getElementById('year');

  const pricingData = [
    {
      title: 'Web Development',
      packages: [
        { name: 'Essentials', price: 'Rp150rb', desc: 'Landing page sederhana, portofolio, Tugas Kuliah.', features: ['1 Halaman Utama', 'Responsive Design', '1x Minor Revisi', 'Waktu 3-5 Hari'] },
        { name: 'Standard App', price: 'Rp350rb', desc: 'Company profile profesional dengan multi-halaman.', features: ['Hingga 5 Halaman', 'SEO Basic', '3x Revisi Minor', 'Waktu 7-10 Hari', 'Bantuan Setup CMS Lokal'] },
        { name: 'Pro Complex', price: 'Rp1jt+', desc: 'Web app custom, e-commerce, atau sistem custom.', features: ['Halaman & Fitur Custom', 'Backend / Database', 'Revisi Fleksibel', 'Dedicated Support', 'Full Source Code'] }
      ]
    },
    {
      title: 'Logo Design',
      packages: [
        { name: 'Essentials', price: 'Rp100rb', desc: 'Logo simpel, modern, dan minimalis.', features: ['2 Alternatif Desain Logo', '1x Minor Revisi', 'Format PNG/JPG', 'Waktu 3 Hari', 'Tanpa Source File'] },
        { name: 'Standard App', price: 'Rp250rb', desc: 'Logo profesional beserta elemen identitas.', features: ['3 Alternatif Desain Logo', '3x Revisi Minor', 'Waktu 5-7 Hari', 'Mockup 3D Basic', 'Termasuk Source File'] },
        { name: 'Pro Complex', price: 'Rp600rb+', desc: 'Brand identity kit lengkap untuk startup/UMKM.', features: ['Full Brand Guideline', 'Desain Kop/Kartu', 'Revisi Fleksibel', 'Social Media Templates', 'Hak Milik Komersial'] }
      ]
    },
    {
      title: 'Academic Writing',
      packages: [
        { name: 'Essentials', price: 'Rp100rb', desc: 'Penyuntingan & proofreading artikel ilmiah.', features: ['Pengecekan Typo & EYD', 'Pengecekan Format', '1x Minor Revisi', 'Waktu 3 Hari', 'Feedback & Catatan'] },
        { name: 'Standard App', price: 'Rp250rb', desc: 'Bantuan penyusunan draft artikel ilmiah.', features: ['Penataan Struktur', 'Cek Plagiasi Basic', '3x Revisi Minor', 'Waktu 7 Hari', 'Bantuan Referensi'] },
        { name: 'Pro Complex', price: 'Rp1jt+', desc: 'Pendampingan penyusunan komprehensif.', features: ['Pendampingan Intensif', 'Bebas Plagiasi', 'Revisi Fleksibel', 'Konsultasi VIP', 'Persiapan Publikasi'] }
      ]
    },
    {
      title: 'Research Proposal',
      packages: [
        { name: 'Essentials', price: 'Rp200rb', desc: 'Bantuan penyusunan bab pendahuluan/latar belakang.', features: ['Review Topik', '1x Minor Revisi', 'Format Akademik', 'Waktu 3 Hari', 'Konsultasi Teks'] },
        { name: 'Standard App', price: 'Rp600rb', desc: 'Penyusunan bab 1-3 lengkap dan terstruktur.', features: ['Lengkap Bab 1-3', 'Struktur Metodologi', '3x Revisi Minor', 'Waktu 10 Hari', 'Bantuan Literatur'] },
        { name: 'Pro Complex', price: 'Rp1.5jt+', desc: 'Pendampingan penyusunan proposal hibah riset.', features: ['RAB & Timeline', 'Analisis Justifikasi', 'Revisi Fleksibel', 'Konsultasi Online', 'Format Pengajuan'] }
      ]
    },
    {
      title: 'Graphic Design',
      packages: [
        { name: 'Essentials', price: 'Rp100rb', desc: 'Desain aset tunggal, poster, banner, atau flyer.', features: ['1 Desain Aset Tunggal', '1x Minor Revisi', 'Format High-Res', 'Waktu 2-3 Hari', 'Ide Konsep Basic'] },
        { name: 'Standard App', price: 'Rp300rb', desc: 'Desain carousel materi, presentasi, atau deck pitch.', features: ['Hingga 5 Slide Carousel', 'Ide Layout Menarik', '3x Revisi Minor', 'Waktu 4 Hari', 'Format Lengkap'] },
        { name: 'Pro Complex', price: 'Rp1jt+', desc: 'Paket retainer desain kampanye bulanan.', features: ['Desain Custom', 'Prioritas Antrean', 'Revisi Fleksibel', 'Dedicated Designer', 'Full Source Files'] }
      ]
    }
  ];

  function waLink(message) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function checkIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  }

  function arrowIcon() {
    return '<svg class="icon-sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
  }

  function bindWaLinks() {
    document.querySelectorAll('[data-wa]').forEach(function (el) {
      el.setAttribute('href', waLink(el.getAttribute('data-wa') || 'Halo dibantu.id!'));
    });
  }

  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 24);
  }

  function toggleTheme() {
    const root = document.documentElement;
    const isLight = root.getAttribute('data-theme') === 'light';
    if (isLight) {
      root.removeAttribute('data-theme');
      localStorage.setItem('dibantu-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('dibantu-theme', 'light');
    }
    syncThemeIcon();
  }

  function syncThemeIcon() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    document.querySelectorAll('.icon-moon').forEach(function (icon) { icon.classList.toggle('hidden', isLight); });
    document.querySelectorAll('.icon-sun').forEach(function (icon) { icon.classList.toggle('hidden', !isLight); });
  }

  function restoreTheme() {
    if (localStorage.getItem('dibantu-theme') === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    syncThemeIcon();
  }

  function initMenu() {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.addEventListener('click', function () {
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
      });
    });
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    items.forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index % 5, 4) * 0.08 + 's';
      observer.observe(el);
    });
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (Number.isNaN(target)) return;
    let start = null;
    const duration = 1400;
    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.floor(eased * target));
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (counter) { observer.observe(counter); });
  }

  function initHeroParallax() {
    if (!heroVisual) return;
    const cards = heroVisual.querySelectorAll('[data-depth]');
    heroVisual.addEventListener('mousemove', function (event) {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cards.forEach(function (card) {
        const depth = Number(card.getAttribute('data-depth') || 20);
        card.style.transform = 'translate(' + (x * depth) + 'px, ' + (y * depth) + 'px)';
      });
    });
    heroVisual.addEventListener('mouseleave', function () {
      cards.forEach(function (card) {
        card.style.transform = '';
      });
    });
  }

  function renderPricing(activeIndex) {
    if (!pricingTabs || !pricingCards) return;
    pricingTabs.innerHTML = pricingData.map(function (tab, index) {
      return '<button class="pricing-tab ' + (index === activeIndex ? 'active' : '') + '" type="button" data-tab="' + index + '">' + tab.title + '</button>';
    }).join('');

    const current = pricingData[activeIndex];
    pricingCards.innerHTML = current.packages.map(function (pkg) {
      const featured = pkg.name === 'Standard App';
      const features = pkg.features.map(function (item) {
        return '<li>' + checkIcon() + '<span>' + item + '</span></li>';
      }).join('');
      const message = 'Pilih layanan ' + current.title + ' paket ' + pkg.name;
      return '<article class="price-card reveal visible ' + (featured ? 'featured' : 'glass') + '">' +
        (featured ? '<span class="popular-badge btn-grad">Paling Laris</span>' : '') +
        '<h3>' + pkg.name + '</h3>' +
        '<p class="pkg-desc">' + pkg.desc + '</p>' +
        '<div class="price-value"><b>' + pkg.price + '</b><span>Start From</span></div>' +
        '<ul class="features">' + features + '</ul>' +
        '<a class="order-btn ' + (featured ? 'btn-grad' : 'btn-outline') + '" href="/layanan/">' + (featured ? 'Pilih ' + pkg.name : 'Order Sekarang') + '</a>' +
      '</article>';
    }).join('');

    pricingTabs.querySelectorAll('[data-tab]').forEach(function (button) {
      button.addEventListener('click', function () {
        renderPricing(Number(button.getAttribute('data-tab')));
      });
    });
  }

  function initBriefForm() {
    if (!briefForm) return;
    briefForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const data = new FormData(briefForm);
      const message = 'Halo dibantu.id! Saya ingin memulai proyek baru.\n\n' +
        'Nama: ' + (data.get('fname') || '') + '\n' +
        'Kontak: ' + (data.get('fcontact') || '') + '\n' +
        'Layanan: ' + (data.get('fservice') || '') + '\n' +
        'Estimasi Budget: ' + (data.get('fbudget') || '') + '\n' +
        'Detail Proyek: ' + (data.get('fdetail') || '');
      window.open(waLink(message), '_blank', 'noopener');
    });
  }

  function initFooterYear() {
    if (year) year.textContent = String(new Date().getFullYear());
  }

  restoreTheme();
  bindWaLinks();
  initMenu();
  initReveal();
  initCounters();
  initHeroParallax();
  renderPricing(0);
  initBriefForm();
  initFooterYear();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
})();
