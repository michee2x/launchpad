/* The funnel's buy and "no thanks" links. Launchpad supplies one checkout link per product, and for an upgrade with
   add-ons one per combination it sells (e.g. "bundle+bundle_dfy"); fill CHECKOUT when they arrive. A button whose
   link is not set stays disabled, so no page can take a visitor nowhere. */
(function () {
  'use strict';

  var CHECKOUT = {
    fe: '',
    bundle: '', 'bundle+bundle_dfy': '', 'bundle+bundle_length': '', 'bundle+bundle_dfy+bundle_length': '',
    pro: '', 'pro+pro_credits': '', 'pro+pro_seats': '', 'pro+pro_credits+pro_seats': '',
    offeriq: '',
    agency: '', 'agency+agency_clients': '', 'agency+agency_credits': '', 'agency+agency_clients+agency_credits': ''
  };

  // The funnel: FE -> Bundle (no: Pro) -> OfferIQ -> Agency -> thank-you. Launchpad's own accept/decline links may replace these.
  var DECLINE = { bundle: '/pro', pro: '/offeriq', offeriq: '/agency', agency: '/thank-you' };

  function wire(a) {
    var key = a.getAttribute('data-buy');
    var box = a.closest('.lp-cta') || a.closest('div');
    var picked = box ? Array.prototype.map.call(box.querySelectorAll('[data-addon]:checked'), function (c) { return c.getAttribute('data-addon'); }).sort() : [];
    var url = CHECKOUT[[key].concat(picked).join('+')];
    if (url) {
      a.href = url;
      a.removeAttribute('aria-disabled');
      a.removeAttribute('title');
    } else {
      // Fallback for page navigation before checkout URL arrives: anchor to #checkout if on FE
      if (key === 'fe') {
        a.href = '#checkout';
      } else {
        a.href = '#';
        a.setAttribute('aria-disabled', 'true');
        a.title = 'Checkout link pending';
      }
    }
  }

  document.querySelectorAll('[data-buy]').forEach(wire);
  document.querySelectorAll('[data-addon]').forEach(function (c) {
    c.addEventListener('change', function () {
      var b = c.closest('.lp-cta').querySelector('[data-buy]');
      if (b) wire(b);
    });
  });
  document.querySelectorAll('[data-decline]').forEach(function (a) {
    a.href = DECLINE[a.getAttribute('data-decline')] || '/thank-you';
  });

  // 1. Theme Management (Dual class .dark and data-theme support)
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var toggleLabel = document.getElementById('theme-toggle-label');

  function getTheme() {
    try {
      var stored = localStorage.getItem('wyv-theme') || localStorage.getItem('wyv_theme');
      if (stored) return stored;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    root.setAttribute('data-theme', theme);
    if (toggle) {
      toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      if (toggleLabel) toggleLabel.textContent = isDark ? 'Dark mode' : 'Light mode';
    }
    try {
      localStorage.setItem('wyv-theme', theme);
      localStorage.setItem('wyv_theme', theme);
    } catch (e) {}
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.classList.contains('dark') ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // 2. CutHeading Splitter & Scroll Observer
  function initCutHeadings() {
    var headings = document.querySelectorAll('[data-cut-heading]');
    headings.forEach(function (heading) {
      var text = heading.getAttribute('data-cut-text') || '';
      var accent = heading.getAttribute('data-cut-accent') || '';
      heading.setAttribute('aria-label', (text + ' ' + accent).trim());

      var wrapper = document.createElement('span');
      wrapper.setAttribute('aria-hidden', 'true');

      function buildWords(str, isAccent, offset) {
        var words = str.split(' ').filter(Boolean);
        words.forEach(function (word, wi) {
          var wordSpan = document.createElement('span');
          wordSpan.className = 'inline-block overflow-hidden pb-[0.12em] align-bottom';

          Array.from(word).forEach(function (char, ci) {
            var charSpan = document.createElement('span');
            charSpan.className = 'cut-char' + (isAccent ? ' font-serif-accent text-primary' : '');
            charSpan.style.animationDelay = ((offset + wi * 3 + ci) * 18) + 'ms';
            charSpan.textContent = char;
            wordSpan.appendChild(charSpan);
          });

          var spaceSpan = document.createElement('span');
          spaceSpan.className = 'inline-block';
          spaceSpan.innerHTML = '&nbsp;';
          wordSpan.appendChild(spaceSpan);

          wrapper.appendChild(wordSpan);
        });
      }

      buildWords(text, false, 0);
      if (accent) {
        buildWords(accent, true, 12);
      }

      heading.innerHTML = '';
      heading.appendChild(wrapper);
    });

    if ('IntersectionObserver' in window) {
      var cutObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('cut-in');
            cutObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      headings.forEach(function (h) { cutObserver.observe(h); });
    } else {
      headings.forEach(function (h) { h.classList.add('cut-in'); });
    }
  }

  // 3. Reveal Elements Scroll Observer
  function initReveals() {
    var reveals = document.querySelectorAll('.reveal-ready');
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      reveals.forEach(function (el) { revealObserver.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('reveal-in'); });
    }
  }

  // 4. Cost Comparison Bar Growth Trigger
  function initCostComparison() {
    var table = document.getElementById('cost-comparison-table');
    if (!table) return;

    if ('IntersectionObserver' in window) {
      var barObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('bar-in');
            barObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });

      barObserver.observe(table);
    } else {
      table.classList.add('bar-in');
    }
  }

  // 5. Hero Glow Mouse Parallax
  function initHeroGlow() {
    var hero = document.getElementById('top');
    var glow = document.getElementById('hero-glow');
    if (!hero || !glow) return;

    var raf = 0;
    hero.addEventListener('mousemove', function (e) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var rect = hero.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width - 0.5) * 60;
        var y = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
        glow.style.transform = 'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, 0)';
      });
    });
  }

  // 6. FAQ Accordion Interaction
  function initFaq() {
    var faqButtons = document.querySelectorAll('[data-faq-btn]');
    faqButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        var panel = btn.nextElementSibling;
        var icon = btn.querySelector('[data-faq-icon]');

        // Close other panels for clean single accordion feel
        faqButtons.forEach(function (otherBtn) {
          if (otherBtn !== btn) {
            otherBtn.setAttribute('aria-expanded', 'false');
            var otherPanel = otherBtn.nextElementSibling;
            var otherIcon = otherBtn.querySelector('[data-faq-icon]');
            if (otherPanel) otherPanel.classList.remove('faq-panel-open');
            if (otherIcon) otherIcon.classList.remove('rotate-45');
          }
        });

        // Toggle clicked panel
        if (isOpen) {
          btn.setAttribute('aria-expanded', 'false');
          if (panel) panel.classList.remove('faq-panel-open');
          if (icon) icon.classList.remove('rotate-45');
        } else {
          btn.setAttribute('aria-expanded', 'true');
          if (panel) panel.classList.add('faq-panel-open');
          if (icon) icon.classList.add('rotate-45');
        }
      });
    });
  }

  // 7. Cookie Notice Banner
  function initCookieNotice() {
    var notice = document.getElementById('cookie-notice');
    if (!notice) return;

    try {
      var seen = localStorage.getItem('wyv-cookie');
      if (!seen) {
        notice.classList.remove('hidden');
      }
    } catch (e) {
      notice.classList.remove('hidden');
    }

    var essentialBtn = document.getElementById('cookie-essential');
    var allowBtn = document.getElementById('cookie-allow');

    function dismiss(val) {
      try { localStorage.setItem('wyv-cookie', val); } catch (e) {}
      notice.classList.add('hidden');
    }

    if (essentialBtn) essentialBtn.addEventListener('click', function () { dismiss('essential'); });
    if (allowBtn) allowBtn.addEventListener('click', function () { dismiss('allow'); });
  }

  // 8. Sample Videos Autoplay on Screen
  function initVideoAutoplay() {
    var vids = document.querySelectorAll('video[data-autoplay]');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.play().catch(function () {});
          } else {
            entry.target.pause();
          }
        });
      }, { threshold: 0.35 });

      vids.forEach(function (v) { io.observe(v); });
    }
  }

  // Initialize all interactive modules on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initCutHeadings();
      initReveals();
      initCostComparison();
      initHeroGlow();
      initFaq();
      initCookieNotice();
      initVideoAutoplay();
    });
  } else {
    initCutHeadings();
    initReveals();
    initCostComparison();
    initHeroGlow();
    initFaq();
    initCookieNotice();
    initVideoAutoplay();
  }

})();
