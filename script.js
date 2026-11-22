/* ============================================================
   JJK Cursed Energy Portfolio — script.js
   Pure vanilla JS · No dependencies
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */
  const $ = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => [...(ctx || document).querySelectorAll(s)];
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. Theme Toggle  (Limitless ↔ Shrine)
     ---------------------------------------------------------- */
  function initThemeToggle() {
    const root = document.documentElement;
    const saved = localStorage.getItem('jjk-theme');

    // Apply saved theme before paint
    if (saved === 'shrine') {
      root.setAttribute('data-theme', 'shrine');
    }

    // Find or create toggle button in header
    const header = $('.top .wrap');
    if (!header) return;

    let btn = $('.theme-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Toggle theme between Limitless and Shrine');
      header.appendChild(btn);
    }

    function applyLabel() {
      const isShrine = root.getAttribute('data-theme') === 'shrine';
      btn.textContent = isShrine ? '宿' : '∞';
      btn.title = isShrine ? 'Switch to Limitless' : 'Switch to Shrine';

      // Update <meta name="theme-color">
      const metaTheme = $('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', isShrine ? '#1a0005' : '#07070b');
        metaTheme.removeAttribute('media');
      }
    }

    applyLabel();

    btn.addEventListener('click', () => {
      const isShrine = root.getAttribute('data-theme') === 'shrine';
      if (isShrine) {
        root.removeAttribute('data-theme');
        localStorage.removeItem('jjk-theme');
      } else {
        root.setAttribute('data-theme', 'shrine');
        localStorage.setItem('jjk-theme', 'shrine');
      }
      applyLabel();

      // Let the canvas pick up new colors
      refreshWispColors();
    });
  }

  /* ----------------------------------------------------------
     2. Black Flash Click Effect (Event delegation)
     ---------------------------------------------------------- */
  function initBlackFlash() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn.primary');
      if (btn) {
        btn.classList.add('black-flash');
        setTimeout(() => btn.classList.remove('black-flash'), 300);
      }
    });
  }

  /* ----------------------------------------------------------
     3. Cursed Energy Wisps  (Hero Canvas)
     ---------------------------------------------------------- */
  let wispColors = { accent: '#00f0ff', accentAlt: '#5a189a' };
  let animFrameId = null;

  function refreshWispColors() {
    const style = getComputedStyle(document.documentElement);
    wispColors.accent = style.getPropertyValue('--accent-primary').trim() || style.getPropertyValue('--accent').trim() || '#00f0ff';
    wispColors.accentAlt =
      style.getPropertyValue('--accent-alt').trim() || '#5a189a';
  }

  function initWisps() {
    if (prefersReducedMotion()) return;

    const hero = $('.hero');
    if (!hero) return;

    refreshWispColors();

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '0',
    });

    // Insert canvas as first child so text layers sit above it
    hero.prepend(canvas);

    const ctx = canvas.getContext('2d');
    const PARTICLE_COUNT = 30;
    let particles = [];

    function resize() {
      const rect = hero.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function createParticle(fullHeight) {
      const rect = hero.getBoundingClientRect();
      return {
        x: Math.random() * rect.width,
        y: fullHeight
          ? Math.random() * rect.height
          : rect.height + Math.random() * 20,
        r: 1 + Math.random() * 2,
        speed: 0.2 + Math.random() * 0.3,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.003 + Math.random() * 0.005,
        alpha: 0.3 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? 'accent' : 'accentAlt',
      };
    }

    function resetParticle(p) {
      const rect = hero.getBoundingClientRect();
      p.x = Math.random() * rect.width;
      p.y = rect.height + Math.random() * 20;
      p.alpha = 0.3 + Math.random() * 0.5;
      p.r = 1 + Math.random() * 2;
      p.speed = 0.2 + Math.random() * 0.3;
    }

    function draw() {
      const rect = hero.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (const p of particles) {
        p.y -= p.speed;
        p.drift += p.driftSpeed;
        p.x += Math.sin(p.drift) * 0.3;
        p.alpha -= 0.001;

        if (p.y < -10 || p.alpha <= 0) {
          resetParticle(p);
        }

        const color =
          p.color === 'accent' ? wispColors.accent : wispColors.accentAlt;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animFrameId = requestAnimationFrame(draw);
    }

    // Build initial particle set
    resize();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(true));
    }
    animFrameId = requestAnimationFrame(draw);

    // Resize handler (debounced)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });
  }

  /* ----------------------------------------------------------
     4. Domain Expansion Scroll Reveal
     ---------------------------------------------------------- */
  function initScrollReveal() {
    const targets = $$('section, .proj-card, .proj, .help div, .skills div');
    if (!targets.length) return;

    // If reduced motion, make everything visible immediately
    if (prefersReducedMotion()) {
      targets.forEach((el) => {
        el.classList.add('reveal', 'visible');
      });
      return;
    }

    targets.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ----------------------------------------------------------
     5. Japanese Watermarks Injection
     ---------------------------------------------------------- */
  function initWatermarks() {
    const kanji = ['領域展開', '術式', '呪力', '無量空処', '黒閃'];
    const sections = $$('section');

    sections.forEach((section, i) => {
      // Avoid duplicate watermarks
      if (section.querySelector('.watermark')) return;

      if (getComputedStyle(section).position === 'static') {
        section.style.position = 'relative';
      }

      const mark = document.createElement('div');
      mark.className = 'watermark';
      mark.textContent = kanji[i % kanji.length];
      mark.setAttribute('aria-hidden', 'true');

      Object.assign(mark.style, {
        position: 'absolute',
        writingMode: 'vertical-rl',
        right: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
      });

      section.appendChild(mark);
    });
  }

  /* ----------------------------------------------------------
     6. Hero Corner Reticles
     ---------------------------------------------------------- */
  function initHeroReticles() {
    const hero = $('.hero');
    if (hero) {
      hero.style.position = 'relative';
    }
  }

  /* ----------------------------------------------------------
     7. Dynamic Navbar Active Section Tracking
     ---------------------------------------------------------- */
  function initNavHighlight() {
    const sections = $$('section[id]');
    const navLinks = $$('header nav a');
    if (!sections.length || !navLinks.length) return;

    function updateActiveNav() {
      const scrollPos = window.scrollY + 140; // account for header offset
      let currentSectionId = '';

      for (const section of sections) {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentSectionId = section.getAttribute('id');
          break;
        }
      }

      // If scrolled to near the bottom of the page, activate the contact link
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
        currentSectionId = 'contact';
      }

      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (currentSectionId && href === `#${currentSectionId}`) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'true');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });
    }

    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            updateActiveNav();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    updateActiveNav();
  }

  /* ----------------------------------------------------------
     8. Project Category Filtering (data-category)
     ---------------------------------------------------------- */
  function initProjectFilters() {
    const filterTabs = $$('.filter-tab');
    const cards = $$('.proj-card, .project-card');
    if (!filterTabs.length || !cards.length) return;

    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (tab.classList.contains('active')) return;

        const filter = tab.dataset.filter;

        filterTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        cards.forEach((card) => {
          const category = card.dataset.category;
          const matches = filter === 'all' || category === filter;

          if (matches) {
            card.classList.remove('is-collapsed');
            requestAnimationFrame(() => {
              card.classList.remove('is-hidden');
            });
          } else {
            card.classList.add('is-hidden');
            setTimeout(() => {
              if (card.classList.contains('is-hidden')) {
                card.classList.add('is-collapsed');
              }
            }, 250);
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     9. Domain Expansion Case Study Modal
     ---------------------------------------------------------- */
  function initCaseStudyModal() {
    const modal = $('#caseStudyModal');
    const closeBtn = $('#caseStudyCloseBtn');
    const backdrop = $('#caseStudyBackdrop');
    if (!modal || !closeBtn) return;

    const panels = $$('.case-study-panel', modal);
    const triggers = $$('.proj-case-btn');
    let triggerSource = null;

    function openModal(panelId, triggerEl) {
      triggerSource = triggerEl;
      panels.forEach((p) => {
        p.hidden = p.id !== panelId;
      });

      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      void modal.offsetWidth; // Force layout recalculation for smooth transition
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';

      closeBtn.focus();
    }

    function closeModal() {
      if (!modal.classList.contains('is-open')) return;

      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      setTimeout(() => {
        if (!modal.classList.contains('is-open')) {
          modal.hidden = true;
          panels.forEach((p) => (p.hidden = true));
          if (triggerSource && typeof triggerSource.focus === 'function') {
            triggerSource.focus();
          }
        }
      }, 300);
    }

    triggers.forEach((btn) => {
      btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        if (modalId) {
          openModal(modalId, btn);
        }
      });
    });

    closeBtn.addEventListener('click', closeModal);

    if (backdrop) {
      backdrop.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      const lightbox = $('#imageLightbox');
      if (lightbox && lightbox.classList.contains('is-open')) {
        return; // Lightbox handles Escape
      }
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  /* ----------------------------------------------------------
     10. Lightweight Vanilla Image Lightbox
     ---------------------------------------------------------- */
  function initImageLightbox() {
    const lightbox = $('#imageLightbox');
    const lightboxImg = $('#lightboxImg');
    const lightboxCap = $('#lightboxCap');
    const closeBtn = $('#lightboxCloseBtn');
    const backdrop = $('#lightboxBackdrop');
    if (!lightbox || !lightboxImg) return;

    let previousFocus = null;

    function openLightbox(src, alt, caption, triggerEl) {
      previousFocus = triggerEl;
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      if (lightboxCap) {
        lightboxCap.textContent = caption || alt || '';
        lightboxCap.style.display = caption || alt ? 'block' : 'none';
      }

      lightbox.hidden = false;
      lightbox.setAttribute('aria-hidden', 'false');
      void lightbox.offsetWidth; // Force reflow
      lightbox.classList.add('is-open');

      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      if (!lightbox.classList.contains('is-open')) return;

      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');

      setTimeout(() => {
        if (!lightbox.classList.contains('is-open')) {
          lightbox.hidden = true;
          lightboxImg.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'/%3E';
          if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus();
          }
        }
      }, 250);
    }

    // Attach to all screenshot triggers in the Case Study gallery
    $$('.case-study-gallery .shot-trigger').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const img = btn.querySelector('img');
        if (!img) return;
        const cap = btn.querySelector('.cap');
        let capText = '';
        if (cap) {
          const clone = cap.cloneNode(true);
          clone.querySelectorAll('.sr, [aria-hidden="true"]').forEach((el) => el.remove());
          capText = clone.textContent.trim();
        }
        openLightbox(img.src, img.alt, capText, btn);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (backdrop) backdrop.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        e.stopImmediatePropagation();
        closeLightbox();
      }
    });
  }

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initBlackFlash();
    initWisps();
    initScrollReveal();
    initWatermarks();
    initHeroReticles();
    initNavHighlight();
    initProjectFilters();
    initCaseStudyModal();
    initImageLightbox();
  });
})();
