(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  // Scroll progress and compact header state.
  const progress = $('#scrollProgress');
  const header = $('.site-header');
  let scrollTicking = false;
  const updateScrollUI = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const amount = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progress.style.width = `${amount}%`;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollUI();

  // Apple-like reveal: sections softly rise, sharpen and settle as they enter view.
  const revealItems = $$('[data-reveal]');
  revealItems.forEach((element) => {
    const delay = Number(element.dataset.delay || 0);
    element.style.setProperty('--delay', `${Math.min(delay, 350)}ms`);
  });
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((element) => revealObserver.observe(element));
  } else {
    revealItems.forEach((element) => element.classList.add('is-visible'));
  }

  // Active glass navigation follows the section currently in view.
  const navLinks = $$('.nav-link');
  const observedSections = navLinks
    .map((link) => $(link.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${visible.target.id}`;
        link.classList.toggle('active', isActive);
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, .1, .25, .5] });
    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  // Mobile navigation.
  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  const closeMenu = () => {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  navLinks.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('click', (event) => {
    if (!mainNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });

  // Glass buttons get a subtle pointer highlight, without relying on external libraries.
  $$('.glass-button, .button, .service-card, .project-shot').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      element.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });

  // Portfolio lightbox.
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightboxImage');
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    window.setTimeout(() => { if (!lightbox.classList.contains('open')) lightboxImage.src = ''; }, 300);
  };
  $$('[data-open-image]').forEach((button) => {
    button.addEventListener('click', () => {
      lightboxImage.src = button.dataset.openImage;
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });
  $('#lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeLightbox(); });

  // Build a ready-to-send inquiry. No fake contact details or non-working forms.
  const toast = $('#toast');
  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  };
  $('#copyRequest').addEventListener('click', async () => {
    const message = 'Здравствуйте, Кирилл! Хочу обсудить создание сайта.\n\nЧем занимается мой бизнес/проект: [впишите]\nКакой сайт нужен: [визитка / лендинг / сайт компании / другое]\nКакие функции нужны: [впишите]\nЖелаемый срок: [впишите]\n\nПодскажите, пожалуйста, стоимость и какие материалы понадобятся.';
    try {
      await navigator.clipboard.writeText(message);
      $('#copyHint').textContent = 'Текст заявки скопирован. Вставьте его в сообщение на Авито.';
      showToast('Текст заявки скопирован');
    } catch (error) {
      $('#copyHint').textContent = message;
      showToast('Скопируйте текст заявки из блока ниже');
    }
  });

  $('#year').textContent = new Date().getFullYear();
})();
