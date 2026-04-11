/* ============================================================
   PORTFOLIO — main.js
   ============================================================ */

/* ---- PREFERENCES ---- */
function getPrefs() {
  return {
    theme:     localStorage.getItem('theme')     || 'auto',
    contrast:  localStorage.getItem('contrast')  || 'standard',
    size:      localStorage.getItem('size')      || 'default',
    animation: localStorage.getItem('animation') || 'auto'
  };
}

/* Resolve animation pref → data-motion attribute + injected view-transition rule */
function applyMotion(p) {
  const root = document.documentElement;

  // data-motion="on"  → force animations regardless of OS
  // data-motion="off" → suppress animations regardless of OS
  // (absent)          → let CSS @media (prefers-reduced-motion) decide
  if      (p.animation === 'show')   root.setAttribute('data-motion', 'on');
  else if (p.animation === 'reduce') root.setAttribute('data-motion', 'off');
  else                               root.removeAttribute('data-motion');

  // @view-transition is a top-level at-rule; can't be toggled via a parent selector,
  // so we inject/update a <style> to override it when needed.
  let vtStyle = document.getElementById('vt-pref');
  if (!vtStyle) {
    vtStyle = document.createElement('style');
    vtStyle.id = 'vt-pref';
    document.head.appendChild(vtStyle);
  }
  if      (p.animation === 'reduce') vtStyle.textContent = '@view-transition{navigation:none}';
  else if (p.animation === 'show')   vtStyle.textContent = '@view-transition{navigation:auto}';
  else                               vtStyle.textContent = '';
}

function applyPrefs(p) {
  document.documentElement.setAttribute('data-theme',    p.theme);
  document.documentElement.setAttribute('data-contrast', p.contrast);
  document.documentElement.setAttribute('data-size',     p.size);
  ['light','dark','auto'].forEach(t => {
    const btn = document.getElementById('btn-' + t);
    const on  = p.theme === t;
    btn?.classList.toggle('active', on);
    btn?.setAttribute('aria-pressed', String(on));
  });
  ['standard','high'].forEach(c => {
    const btn = document.getElementById('btn-' + c);
    const on  = p.contrast === c;
    btn?.classList.toggle('active', on);
    btn?.setAttribute('aria-pressed', String(on));
  });
  ['default','large'].forEach(s => {
    const btn = document.getElementById('btn-' + s);
    const on  = p.size === s;
    btn?.classList.toggle('active', on);
    btn?.setAttribute('aria-pressed', String(on));
  });
  ['show','reduce','auto'].forEach(a => {
    const btn = document.getElementById('btn-anim-' + a);
    const on  = p.animation === a;
    btn?.classList.toggle('active', on);
    btn?.setAttribute('aria-pressed', String(on));
  });
  applyMotion(p);
}

window.setTheme     = t => { localStorage.setItem('theme',     t); applyPrefs(getPrefs()); };
window.setContrast  = c => { localStorage.setItem('contrast',  c); applyPrefs(getPrefs()); };
window.setSize      = s => { localStorage.setItem('size',      s); applyPrefs(getPrefs()); };
window.setAnimation = a => { localStorage.setItem('animation', a); applyPrefs(getPrefs()); };

/* ---- FOCUS TRAP HELPERS ---- */
function trapFocus(panel, returnTarget) {
  const focusable = Array.from(panel.querySelectorAll(
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ));
  if (!focusable.length) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  panel._returnFocus = returnTarget || null;
  panel._trapHandler = function(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  };
  panel.addEventListener('keydown', panel._trapHandler);
  first.focus();
}

function releaseTrap(panel) {
  if (panel._trapHandler) {
    panel.removeEventListener('keydown', panel._trapHandler);
    panel._trapHandler = null;
  }
}

function closePanel(panelId, btnId) {
  const panel = document.getElementById(panelId);
  const btn   = document.getElementById(btnId);
  if (!panel || !panel.classList.contains('open')) return;
  panel.classList.remove('open');
  btn?.setAttribute('aria-expanded', 'false');
  releaseTrap(panel);
}

/* ---- PANEL TOGGLE (shared for menu + display) ---- */
window.togglePanel = function(panelId, btnId) {
  const panel = document.getElementById(panelId);
  const btn   = document.getElementById(btnId);
  if (!panel || !btn) return;

  // Close the other panel first
  const otherId    = panelId === 'a11y-panel' ? 'menu-panel' : 'a11y-panel';
  const otherBtnId = panelId === 'a11y-panel' ? 'menu-btn'   : 'a11y-btn';
  closePanel(otherId, otherBtnId);

  const isOpen = panel.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(isOpen));

  if (isOpen) {
    trapFocus(panel, btn);
  } else {
    releaseTrap(panel);
    btn.focus();
  }
};

document.addEventListener('click', function(e) {
  ['a11y-panel','menu-panel'].forEach(id => {
    const panel = document.getElementById(id);
    const btnId = id === 'a11y-panel' ? 'a11y-btn' : 'menu-btn';
    const btn   = document.getElementById(btnId);
    if (panel && btn && panel.classList.contains('open') &&
        !panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      releaseTrap(panel);
      // Don't steal focus on outside click — user clicked elsewhere intentionally
    }
  });
});

document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  ['a11y-panel','menu-panel'].forEach(id => {
    const panel = document.getElementById(id);
    const btnId = id === 'a11y-panel' ? 'a11y-btn' : 'menu-btn';
    const btn   = document.getElementById(btnId);
    if (panel && panel.classList.contains('open')) {
      panel.classList.remove('open');
      btn?.setAttribute('aria-expanded', 'false');
      releaseTrap(panel);
      btn?.focus();
    }
  });
});

/* ---- SCROLL-TO SECTION ---- */
function motionReduced() {
  const m = document.documentElement.getAttribute('data-motion');
  if (m === 'off') return true;
  if (m === 'on')  return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

window.scrollToSection = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = document.querySelector('nav.site-nav')?.offsetHeight || 56;
  const top  = el.getBoundingClientRect().top + window.scrollY - navH - 24;
  window.scrollTo({ top, behavior: motionReduced() ? 'instant' : 'smooth' });
};

/* ---- HOMEPAGE: active nav on scroll ---- */
function initHomeNav() {
  const sections = ['work', 'philosophy', 'contact'];

  function update() {
    const navH  = document.querySelector('nav.site-nav')?.offsetHeight || 56;
    const viewH = window.innerHeight;
    let current  = null;
    let bestId   = null;
    let bestRatio = 0;

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const rect   = el.getBoundingClientRect();
      const visTop = Math.max(rect.top, navH);
      const visBot = Math.min(rect.bottom, viewH);
      const visH   = Math.max(0, visBot - visTop);
      // Use viewport height as denominator for sections taller than the viewport
      const denom  = Math.min(rect.height, viewH - navH);
      const ratio  = denom > 0 ? visH / denom : 0;
      if (ratio >= 0.5) current = id;
      if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
    });

    // Fallback: highlight the most-visible section when none reaches 50%
    if (!current && bestRatio > 0) current = bestId;

    document.querySelectorAll('.nav-links a, .menu-panel a').forEach(a => {
      const href  = a.getAttribute('href');
      const isSection = href && href.includes('#');
      const match = isSection && current && href.endsWith('#' + current);
      a.classList.toggle('active', !!match);
      if (isSection) a.setAttribute('aria-current', match ? 'true' : 'false');
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---- CASE STUDY: sidebar active + sticky org ---- */
function initCaseStudy() {
  const sections = ['situation','role','work','outcome','learned'];
  const navLinks = {};
  sections.forEach(id => {
    navLinks[id] = document.querySelector(`#sidebar-nav a[href="#${id}"]`);
  });

  // Always highlight "Work" in main nav on case study pages
  document.querySelectorAll('.nav-links a, .menu-panel a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.includes('#work')) a.classList.add('active');
  });

  function updateScroll() {
    const navH       = document.querySelector('nav.site-nav')?.offsetHeight || 56;
    const viewH      = window.innerHeight;
    const hero       = document.getElementById('hero');
    const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
    const pastHero   = heroBottom <= navH + 4;

    document.getElementById('sticky-org-desktop')?.classList.toggle('visible', pastHero);
    const mobileBar = document.getElementById('sticky-org-mobile');
    if (mobileBar) {
      mobileBar.classList.toggle('visible', pastHero);
      mobileBar.setAttribute('aria-hidden', String(!pastHero));
    }

    let current   = sections[0];
    let bestId    = sections[0];
    let bestRatio = 0;

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const rect   = el.getBoundingClientRect();
      const visTop = Math.max(rect.top, navH);
      const visBot = Math.min(rect.bottom, viewH);
      const visH   = Math.max(0, visBot - visTop);
      // Use viewport height as denominator for sections taller than the viewport
      const denom  = Math.min(rect.height, viewH - navH);
      const ratio  = denom > 0 ? visH / denom : 0;
      if (ratio >= 0.5) current = id;
      if (ratio > bestRatio) { bestRatio = ratio; bestId = id; }
    });

    // Fallback: use the most-visible section if none reaches 50%
    if (bestRatio > 0 && current === sections[0] && bestId !== sections[0]) {
      current = bestId;
    }

    Object.keys(navLinks).forEach(id => {
      const isActive = id === current;
      navLinks[id]?.classList.toggle('active', isActive);
      navLinks[id]?.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    const mobileSelect = document.querySelector('.mobile-sticky-select');
    if (mobileSelect) mobileSelect.value = current;
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  document.querySelectorAll('#sidebar-nav a').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      scrollToSection(this.getAttribute('href').slice(1));
    });
  });
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', function() {
  applyPrefs(getPrefs());

  if (document.getElementById('sidebar-nav')) {
    initCaseStudy();
  } else {
    initHomeNav();
  }
});
