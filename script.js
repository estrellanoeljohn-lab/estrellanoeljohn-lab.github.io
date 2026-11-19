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
        // Remove media so a single value takes effect
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
     2. Black Flash Click Effect
     ---------------------------------------------------------- */
  function initBlackFlash() {
    $$('.btn.primary').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.classList.add('black-flash');
        setTimeout(() => btn.classList.remove('black-flash'), 300);
      });
    });
  }

  /* ----------------------------------------------------------
     3. Cursed Energy Wisps  (Hero Canvas)
     ---------------------------------------------------------- */
  let wispColors = { accent: '#00f0ff', accentAlt: '#5a189a' };
  let animFrameId = null;

  function refreshWispColors() {
    const style = getComputedStyle(document.documentElement);
    wispColors.accent = style.getPropertyValue('--accent').trim() || '#00f0ff';
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
    const targets = $$('section, .proj, .help div, .skills div');
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
    const kanji = ['領域展開', '呪力', '無量空処', '黒閃'];
    const sections = $$('section');

    sections.forEach((section, i) => {
      // Avoid duplicate watermarks
      if (section.querySelector('.watermark')) return;

      // Make sure section can contain an absolute child
      if (getComputedStyle(section).position === 'static') {
        section.style.position = 'relative';
      }

      const mark = document.createElement('div');
      mark.className = 'watermark';
      mark.textContent = kanji[i % kanji.length];
      mark.setAttribute('aria-hidden', 'true');

      // Inline positioning (rest comes from CSS .watermark class)
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
     6. Hero Corner Reticles (ensure positioning context)
     ---------------------------------------------------------- */
  function initHeroReticles() {
    const hero = $('.hero');
    if (hero) {
      hero.style.position = 'relative';
    }
  }

  /* ----------------------------------------------------------
     7. Navbar Active Section Highlight
     ---------------------------------------------------------- */
  function initNavHighlight() {
    const sections = $$('section[id]');
    const navLinks = $$('header nav a');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('id');
          const link = $(`header nav a[href="#${id}"]`);
          if (!link) return;

          if (entry.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove('active'));
            link.classList.add('active');
          }
        });
      },
      { threshold: 0.2, rootMargin: '-80px 0px -40% 0px' }
    );

    sections.forEach((s) => observer.observe(s));
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
  });
})();
