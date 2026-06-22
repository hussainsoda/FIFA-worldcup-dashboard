/* ============================================================
   FIFA World Cup 2026 — Router
   assets/js/router.js
   ============================================================ */

import { EventBus } from './store.js';

const Router = (() => {
  const routes = new Map();
  let currentPage = null;

  function register(path, handler) {
    routes.set(path, handler);
  }

  function navigate(path, pushState = true) {
    const handler = routes.get(path) || routes.get('*');
    if (!handler) return;

    if (pushState) history.pushState({ path }, '', path);

    // Fire page transition
    const main = document.getElementById('main-content');
    if (main) {
      main.style.opacity = '0';
      main.style.transform = 'translateY(6px)';
      setTimeout(() => {
        handler(path);
        main.style.transition = 'opacity 250ms ease, transform 250ms ease';
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
      }, 150);
    } else {
      handler(path);
    }

    updateActiveNav(path);
    currentPage = path;
    EventBus.emit('route:changed', { path });
  }

  function updateActiveNav(path) {
    document.querySelectorAll('[data-nav-link]').forEach(el => {
      const href = el.getAttribute('href');
      el.classList.toggle('active', href === path || (path === '/' && href === '/index.html'));
    });
  }

  function init() {
    // Handle browser back/forward
    window.addEventListener('popstate', e => {
      const path = e.state?.path || window.location.pathname;
      navigate(path, false);
    });

    // Intercept internal link clicks
    document.addEventListener('click', e => {
      const link = e.target.closest('[data-nav-link]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;
      e.preventDefault();
      navigate(href);
    });

    // Initial route
    navigate(window.location.pathname, false);
  }

  function getCurrentPage() { return currentPage; }

  return { register, navigate, init, getCurrentPage };
})();

export default Router;