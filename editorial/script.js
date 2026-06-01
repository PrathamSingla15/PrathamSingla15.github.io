/* ============================================================
   THE SINGLA REVIEW — interaction layer
   Theme toggle · scroll-spy · reveal-on-scroll · mobile nav
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------------- Theme: init + toggle + persist ---------------- */
  var THEME_KEY = "theme";
  var toggle = document.getElementById("theme-toggle");
  var toggleLabel = document.getElementById("theme-toggle-label");

  function systemPrefersDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var isDark = theme === "dark";
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDark));
      // label/aria describe the action the button performs (the *next* theme)
      toggle.setAttribute(
        "aria-label",
        isDark ? "Switch to light theme" : "Switch to dark theme"
      );
    }
    if (toggleLabel) toggleLabel.textContent = isDark ? "Light" : "Dark";
  }

  // Initialise: stored value wins; otherwise fall back to system preference.
  var stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (e) {
    stored = null;
  }
  applyTheme(stored === "light" || stored === "dark"
    ? stored
    : (systemPrefersDark() ? "dark" : "light"));

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next =
        root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        /* storage unavailable — runtime still works */
      }
    });
  }

  // React to OS theme changes only when the user hasn't chosen explicitly.
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var onSchemeChange = function (e) {
    var hasStored = false;
    try {
      var v = localStorage.getItem(THEME_KEY);
      hasStored = v === "light" || v === "dark";
    } catch (err) {
      hasStored = false;
    }
    if (!hasStored) applyTheme(e.matches ? "dark" : "light");
  };
  if (mq.addEventListener) mq.addEventListener("change", onSchemeChange);
  else if (mq.addListener) mq.addListener(onSchemeChange);

  /* ---------------- Mobile nav disclosure ---------------- */
  var tnav = document.getElementById("tnav");
  var tnavToggle = document.getElementById("tnav-toggle");
  var tnavList = document.getElementById("tnav-list");

  function closeNav() {
    if (!tnav) return;
    tnav.classList.remove("is-open");
    if (tnavToggle) tnavToggle.setAttribute("aria-expanded", "false");
  }

  if (tnavToggle && tnav) {
    tnavToggle.addEventListener("click", function () {
      var open = tnav.classList.toggle("is-open");
      tnavToggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Smooth-scroll for in-page links; close mobile nav after a jump.
  var navLinks = tnavList
    ? Array.prototype.slice.call(tnavList.querySelectorAll("a[href^='#']"))
    : [];

  function smoothScrollTo(hash) {
    var target = document.querySelector(hash);
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
    // move focus for accessibility without an extra visible jump
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  document
    .querySelectorAll("a[href^='#']")
    .forEach(function (link) {
      link.addEventListener("click", function (e) {
        var hash = link.getAttribute("href");
        if (hash && hash.length > 1 && document.querySelector(hash)) {
          e.preventDefault();
          smoothScrollTo(hash);
          if (window.history && history.pushState) {
            history.pushState(null, "", hash);
          }
          closeNav();
        }
      });
    });

  /* ---------------- Scroll-spy (active section in nav) ---------------- */
  var sections = Array.prototype.slice
    .call(document.querySelectorAll("main section[id]"))
    .filter(function (s) {
      return document.querySelector('[data-spy="' + s.id + '"]');
    });

  var linkFor = {};
  navLinks.forEach(function (a) {
    var key = a.getAttribute("data-spy");
    if (key) linkFor[key] = a;
  });

  function setActive(id) {
    navLinks.forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-spy") === id);
      if (a.getAttribute("data-spy") === id) {
        a.setAttribute("aria-current", "true");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    // Track visibility ratios so the most-visible section wins, which
    // behaves well for both tall and short sections.
    var visible = {};
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting
            ? entry.intersectionRatio
            : 0;
        });
        var bestId = null;
        var bestRatio = 0;
        Object.keys(visible).forEach(function (id) {
          if (visible[id] > bestRatio) {
            bestRatio = visible[id];
            bestId = id;
          }
        });
        if (bestId) setActive(bestId);
      },
      {
        // bias the "active band" toward the upper-middle of the viewport
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.15, 0.35, 0.6, 0.85, 1]
      }
    );
    sections.forEach(function (s) {
      visible[s.id] = 0;
      spyObserver.observe(s);
    });

    // Edge case: at the very top, highlight the cover.
    window.addEventListener(
      "scroll",
      function () {
        if (window.scrollY < 80 && sections[0]) setActive(sections[0].id);
      },
      { passive: true }
    );
  } else {
    // No IO support: default to first section.
    if (sections[0]) setActive(sections[0].id);
  }

  /* ---------------- Reveal on scroll (+ honour reduced motion) ---------------- */
  var revealEls = Array.prototype.slice.call(
    document.querySelectorAll(".reveal")
  );

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });

    // Failsafe: ensure everything is visible shortly after load even if
    // a browser quirk prevents an observer callback from firing.
    window.addEventListener("load", function () {
      window.setTimeout(function () {
        revealEls.forEach(function (el) {
          if (!el.classList.contains("is-in")) el.classList.add("is-in");
        });
      }, 1800);
    });
  }
})();
