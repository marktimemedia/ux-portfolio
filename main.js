/* ============================================================
   PORTFOLIO — main.js
   ============================================================ */

/* ---- PREFERENCES ---- */
function getPrefs() {
  return {
    theme:    localStorage.getItem('theme')    || 'auto',
    contrast: localStorage.getItem('contrast') || 'standard',
    size:     localStorage.getItem('size')     || 'default'
  };
}

function applyPrefs(p) {
  document.documentElement.setAttribute('data-theme',    p.theme);
  document.documentElement.setAttribute('data-contrast', p.contrast);
  document.documentElement.setAttribute('data-size',     p.size);
  ['light','dark','auto'].forEach(t => {
    document.getElementById('btn-' + t)?.classList.toggle('active', p.theme === t);
  });
  ['standard','high'].forEach(c => {
    document.getElementById('btn-' + c)?.classList.toggle('active', p.contrast === c);
  });
  ['default','large'].forEach(s => {
    document.getElementById('btn-' + s)?.classList.toggle('active', p.size === s);
  });
}

window.setTheme    = t => { localStorage.setItem('theme',    t); applyPrefs(getPrefs()); };
window.setContrast = c => { localStorage.setItem('contrast', c); applyPrefs(getPrefs()); };
window.setSize     = s => { localStorage.setItem('size',     s); applyPrefs(getPrefs()); };

/* ---- PANEL TOGGLE (shared for menu + display) ---- */
window.togglePanel = function(panelId, btnId) {
  const panel = document.getElementById(panelId);
  const btn   = document.getElementById(btnId);
  if (!panel || !btn) return;
  const isOpen = panel.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
  // close the other panel if open
  const other = panelId === 'a11y-panel' ? 'menu-panel' : 'a11y-panel';
  const otherBtn = panelId === 'a11y-panel' ? 'menu-btn' : 'a11y-btn';
  document.getElementById(other)?.classList.remove('open');
  document.getElementById(otherBtn)?.setAttribute('aria-expanded', 'false');
};

document.addEventListener('click', function(e) {
  ['a11y-panel','menu-panel'].forEach(id => {
    const panel = document.getElementById(id);
    const btnId = id === 'a11y-panel' ? 'a11y-btn' : 'menu-btn';
    const btn   = document.getElementById(btnId);
    if (panel && btn && !panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
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
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });
});

/* ---- SCROLL-TO SECTION ---- */
window.scrollToSection = function(id) {
  const el   = document.getElementById(id);
  if (!el) return;
  const navH = document.querySelector('nav.site-nav')?.offsetHeight || 56;
  const top  = el.getBoundingClientRect().top + window.scrollY - navH - 24;
  window.scrollTo({ top, behavior: 'smooth' });
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
      const match = href && href.includes('#') && current && href.endsWith('#' + current);
      a.classList.toggle('active', !!match);
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
    document.getElementById('sticky-org-mobile')?.classList.toggle('visible', pastHero);

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
      navLinks[id]?.classList.toggle('active', id === current);
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
