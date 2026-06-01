/* =====================================================================
   MIDNIGHT LAB — interactions
   Theme toggle · scroll-spy nav · mobile menu · reveal-on-scroll
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------------
     THEME TOGGLE
     ----------------------------------------------------------------- */
  var themeToggle = document.getElementById('themeToggle');
  var themeLabel  = document.getElementById('themeLabel');

  function syncThemeUI(theme) {
    var isDark = theme !== 'light';
    if (themeLabel) themeLabel.textContent = isDark ? 'Light' : 'Dark';
    if (themeToggle) {
      // aria-pressed reflects "light mode is active"
      themeToggle.setAttribute('aria-pressed', String(!isDark));
      themeToggle.setAttribute(
        'aria-label',
        isDark ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
  }

  // initialise label from whatever the inline boot script set
  syncThemeUI(root.getAttribute('data-theme'));

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    syncThemeUI(theme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      setTheme(next);
    });
  }

  // react to OS theme changes only if the user hasn't chosen explicitly
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  var onSchemeChange = function (e) {
    var stored;
    try { stored = localStorage.getItem('theme'); } catch (err) { stored = null; }
    if (!stored) setTheme(e.matches ? 'light' : 'dark');
  };
  if (mq.addEventListener) mq.addEventListener('change', onSchemeChange);
  else if (mq.addListener) mq.addListener(onSchemeChange);

  /* -----------------------------------------------------------------
     MOBILE NAV TOGGLE
     ----------------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navMenu   = document.getElementById('navMenu');

  function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove('is-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }
  function openMenu() {
    if (!navMenu) return;
    navMenu.classList.add('is-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var isOpen = navMenu.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    });

    // close after tapping a nav link (mobile)
    navMenu.addEventListener('click', function (e) {
      var link = e.target.closest('.nav__link');
      if (link) closeMenu();
    });

    // close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    // close when tapping outside the menu
    document.addEventListener('click', function (e) {
      if (!navMenu.classList.contains('is-open')) return;
      if (e.target.closest('.nav')) return;
      closeMenu();
    });
  }

  /* -----------------------------------------------------------------
     SMOOTH SCROLL (respects reduced-motion)
     ----------------------------------------------------------------- */
  var internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start'
      });
      // move focus for accessibility without an extra visible jump
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* -----------------------------------------------------------------
     REVEAL ON SCROLL (IntersectionObserver)
     ----------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* -----------------------------------------------------------------
     SCROLL-SPY (active nav link)
     ----------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link[href^="#"]'));
  var sections = navLinks
    .map(function (link) {
      var sel = link.getAttribute('href');
      var sec = sel && sel.length > 1 ? document.querySelector(sel) : null;
      return sec ? { id: sel, el: sec, link: link } : null;
    })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      var on = link.getAttribute('href') === id;
      link.classList.toggle('is-active', on);
      if (on) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  if (sections.length) {
    if ('IntersectionObserver' in window) {
      // track which sections are currently in the viewport band
      var visible = {};
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });

        // pick the most-visible section; fall back to nearest above
        var bestId = null, bestRatio = 0;
        sections.forEach(function (s) {
          var secId = s.el.id;
          var r = visible[secId] || 0;
          if (r > bestRatio) { bestRatio = r; bestId = s.id; }
        });

        if (bestId) {
          setActive(bestId);
        }
      }, {
        // band roughly under the sticky nav
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0, 0.15, 0.35, 0.6, 1]
      });

      sections.forEach(function (s) { spy.observe(s.el); });
    }

    // edge cases the observer band can't cleanly cover:
    //  - resting over the hero: no section should look active
    //  - bottom of page: the last (short) section may never win the band,
    //    so force it active when fully scrolled
    var onScrollEdges = function () {
      if (window.scrollY < 40) { setActive(''); return; }
      var atBottom = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 4);
      if (atBottom) setActive(sections[sections.length - 1].id);
    };
    window.addEventListener('scroll', onScrollEdges, { passive: true });
    onScrollEdges();
  }

  /* -----------------------------------------------------------------
     YEAR-FREE: no dynamic content injected (all content is static)
     ----------------------------------------------------------------- */
})();
