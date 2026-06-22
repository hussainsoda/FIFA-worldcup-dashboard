/* ============================================================
   FIFA World Cup 2026 — Utilities
   assets/js/utils.js
   ============================================================ */

import { MATCH_STATUS, LIVE_STATUSES, EVENT_ICONS, EVENT_COLORS } from '../../config/constants.js';

/* ── Time & Date ───────────────────────────────────────────── */
export function formatKickoff(dateString, timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const d = new Date(dateString);
  return d.toLocaleString('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatMatchTime(fixture) {
  const status = fixture.fixture.status;
  const elapsed = fixture.fixture.status.elapsed;

  if (LIVE_STATUSES.includes(status.short)) {
    if (status.short === 'HT') return 'HT';
    return elapsed ? `${elapsed}'` : status.short;
  }
  if (['FT','AET','PEN'].includes(status.short)) return 'FT';
  if (status.short === 'NS') {
    return new Date(fixture.fixture.date).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit'
    });
  }
  return MATCH_STATUS[status.short] || status.short;
}

export function isLive(fixture) {
  return LIVE_STATUSES.includes(fixture.fixture.status.short);
}

export function isFinished(fixture) {
  return ['FT','AET','PEN','AWD','WO'].includes(fixture.fixture.status.short);
}

export function timeUntil(date) {
  const diff = new Date(date) - Date.now();
  if (diff <= 0) return null;

  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000)  / 60_000);
  const seconds = Math.floor((diff % 60_000)      / 1_000);

  return { days, hours, minutes, seconds, total: diff };
}

/* ── Countdown Timer (live, auto-updating) ─────────────────── */
export function startCountdown(targetDate, elements = {}) {
  function update() {
    const t = timeUntil(targetDate);
    if (!t) {
      Object.values(elements).forEach(el => { if (el) el.textContent = '00'; });
      return;
    }
    const pad = n => String(n).padStart(2, '0');
    if (elements.days)    elements.days.textContent    = pad(t.days);
    if (elements.hours)   elements.hours.textContent   = pad(t.hours);
    if (elements.minutes) elements.minutes.textContent = pad(t.minutes);
    if (elements.seconds) {
      const prev = elements.seconds.textContent;
      elements.seconds.textContent = pad(t.seconds);
      if (prev !== pad(t.seconds)) {
        elements.seconds.classList.remove('count-tick');
        void elements.seconds.offsetWidth;
        elements.seconds.classList.add('count-tick');
      }
    }
  }
  update();
  const id = setInterval(update, 1_000);
  return () => clearInterval(id);  // returns stop function
}

/* ── DOM Helpers ───────────────────────────────────────────── */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class')     node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else                   node.setAttribute(k, v);
  });
  children.flat().forEach(c => {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c)                node.appendChild(c);
  });
  return node;
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsAll(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function setHTML(selector, html, root = document) {
  const node = root.querySelector(selector);
  if (node) node.innerHTML = html;
  return node;
}

/* ── Skeleton HTML ─────────────────────────────────────────── */
export function skeletonLine(width = '100%', height = '14px') {
  return `<div class="skeleton" style="width:${width};height:${height};margin-bottom:8px;"></div>`;
}

export function skeletonCard(rows = 3) {
  return `
    <div class="wc-card" style="padding:1.25rem;">
      ${Array(rows).fill('').map((_, i) =>
        skeletonLine(i === 0 ? '60%' : i % 2 === 0 ? '85%' : '75%', i === 0 ? '20px' : '14px')
      ).join('')}
    </div>`;
}

/* ── Score Formatting ──────────────────────────────────────── */
export function formatScore(home, away) {
  const h = home ?? '-';
  const a = away ?? '-';
  return `${h} – ${a}`;
}

/* ── Event Icon ────────────────────────────────────────────── */
export function eventIcon(type) {
  return EVENT_ICONS[type] || '•';
}

export function eventColor(type) {
  return EVENT_COLORS[type] || 'var(--wc-text-secondary)';
}

/* ── Flag ──────────────────────────────────────────────────── */
export function flagUrl(countryCode) {
  // Using flagcdn.com (free, no API key)
  const code = countryCode.toLowerCase();
  return `https://flagcdn.com/w40/${code}.png`;
}

/* ── Number Formatting ─────────────────────────────────────── */
export function fmtNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

/* ── Scroll Reveal ─────────────────────────────────────────── */
export function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  return observer;
}

/* ── Toast Notification ────────────────────────────────────── */
export function showToast({ title, subtitle, icon = '⚽', type = 'goal', duration = 5000 }) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <div class="toast-icon ${type}">${icon}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${subtitle ? `<div class="toast-subtitle">${subtitle}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss">✕</button>
    </div>`;

  container.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 280);
  };

  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
  return toast;
}

/* ── Polling Helper ────────────────────────────────────────── */
export function createPoller(fn, interval) {
  let timerId = null;
  let running = false;

  async function tick() {
    try { await fn(); }
    catch (e) { console.error('[Poller] Error:', e); }
    if (running) timerId = setTimeout(tick, interval);
  }

  return {
    start() {
      if (running) return;
      running = true;
      tick();
    },
    stop() {
      running = false;
      if (timerId) clearTimeout(timerId);
      timerId = null;
    },
    restart() { this.stop(); this.start(); }
  };
}