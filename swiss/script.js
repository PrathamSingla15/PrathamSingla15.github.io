/* ============================================================
   PRATHAM SINGLA — SWISS BRUTALIST
   Theme toggle · scroll-spy · scroll-reveal · mobile index · progress
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     THEME TOGGLE  (data-theme on <html>, persist to localStorage)
     The pre-paint inline <script> in <head> already set the theme.
     ---------------------------------------------------------- */
  var toggle = document.getElementById('theme-toggle');

  function reflectTheme(theme) {
    var label = toggle && toggle.querySelector('.theme-toggle__label');
    var isDark = theme === 'dark';
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(isDark));
      // Button switches you to the *other* theme:
      toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }
    if (label) {
      label.textContent = isDark
        ? (label.getAttribute('data-label-dark') || 'DARK')
        : (label.getAttribute('data-label-light') || 'LIGHT');
    }
  }

  reflectTheme(root.getAttribute('data-theme') || 'light');

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    reflectTheme(theme);
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }

  // Follow OS changes only while the user hasn't made an explicit choice.
  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  var onSchemeChange = function (e) {
    var stored;
    try { stored = localStorage.getItem('theme'); } catch (err) { stored = null; }
    if (!stored) setTheme(e.matches ? 'dark' : 'light');
  };
  if (mqDark.addEventListener) mqDark.addEventListener('change', onSchemeChange);
  else if (mqDark.addListener) mqDark.addListener(onSchemeChange);

  /* ----------------------------------------------------------
     SECTIONS + NAV WIRING
     ---------------------------------------------------------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var desktopLinks = Array.prototype.slice.call(document.querySelectorAll('.index a[data-spy]'));

  var labelById = {
    hero: '00 / Index',
    education: '01 / Education',
    experience: '02 / Experience',
    publications: '03 / Publications',
    achievements: '04 / Achievements',
    projects: '05 / Projects',
    activities: '06 / Activities'
  };

  /* ----------------------------------------------------------
     SCROLL-SPY  (rAF-throttled; robust at top & bottom of page)
     ---------------------------------------------------------- */
  var mobileCurrent = document.getElementById('mobilebar-current');
  var currentId = null;
  var ticking = false;

  function computeActive() {
    ticking = false;
    var marker = window.innerHeight * 0.32; // line near the top third
    var active = sections.length ? sections[0].id : null;

    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= marker) {
        active = sections[i].id;
      }
    }

    // Bottom guard: when near page end, force-activate the last section.
    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 4)) {
      active = sections[sections.length - 1].id;
    }

    if (active === currentId) return;
    currentId = active;

    for (var j = 0; j < desktopLinks.length; j++) {
      var on = desktopLinks[j].getAttribute('data-spy') === active;
      desktopLinks[j].classList.toggle('is-active', on);
      if (on) desktopLinks[j].setAttribute('aria-current', 'true');
      else desktopLinks[j].removeAttribute('aria-current');
    }

    if (mobileCurrent && labelById[active]) {
      var parts = labelById[active].split(' / ');
      mobileCurrent.innerHTML = '<span class="mono">' + parts[0] + '</span>&nbsp;/&nbsp;' + parts[1];
    }
  }

  function requestSpy() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(computeActive);
    }
  }

  /* ----------------------------------------------------------
     SCROLL PROGRESS BAR (mobile)
     ---------------------------------------------------------- */
  var progress = document.getElementById('scroll-progress');
  function updateProgress() {
    if (!progress) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop || window.scrollY) / max * 100 : 0;
    progress.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }

  var progTicking = false;
  function onScroll() {
    requestSpy();
    if (!progTicking) {
      progTicking = true;
      window.requestAnimationFrame(function () { progTicking = false; updateProgress(); });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { requestSpy(); updateProgress(); }, { passive: true });
  computeActive();
  updateProgress();

  /* ----------------------------------------------------------
     SMOOTH SCROLL for in-page anchors (with reduced-motion respect)
     ---------------------------------------------------------- */
  function smoothScrollTo(id) {
    var target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start'
    });
    // Move focus for accessibility without an extra visible jump.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href === '#') return;
    a.addEventListener('click', function (e) {
      var id = href.slice(1);
      if (document.getElementById(id)) {
        e.preventDefault();
        closeMobileMenu();
        smoothScrollTo(id);
        history.replaceState(null, '', href);
      }
    });
  });

  /* ----------------------------------------------------------
     MOBILE INDEX MENU (accordion)
     ---------------------------------------------------------- */
  var mobToggle = document.getElementById('mobilebar-toggle');
  var mobMenu = document.getElementById('mobilebar-menu');

  function openMobileMenu() {
    if (!mobToggle || !mobMenu) return;
    mobMenu.hidden = false;
    mobToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMobileMenu() {
    if (!mobToggle || !mobMenu) return;
    mobMenu.hidden = true;
    mobToggle.setAttribute('aria-expanded', 'false');
  }

  if (mobToggle && mobMenu) {
    mobToggle.addEventListener('click', function () {
      if (mobToggle.getAttribute('aria-expanded') === 'true') closeMobileMenu();
      else openMobileMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileMenu();
    });
    // Close if user taps outside the bar.
    document.addEventListener('click', function (e) {
      if (mobMenu.hidden) return;
      var bar = e.target.closest('.mobilebar');
      if (!bar) closeMobileMenu();
    });
  }

  /* ----------------------------------------------------------
     SCROLL-REVEAL via IntersectionObserver
     (page-load reveals in the hero use CSS animation-delay;
      everything else fades in as it enters the viewport)
     ---------------------------------------------------------- */
  var scrollReveals = Array.prototype.slice
    .call(document.querySelectorAll('[data-reveal]'))
    .filter(function (el) { return !el.classList.contains('reveal'); });

  if (prefersReduced || !('IntersectionObserver' in window)) {
    scrollReveals.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    scrollReveals.forEach(function (el) { io.observe(el); });
  }
})();
