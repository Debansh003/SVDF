/* ============================================================
   app.js — Shared utilities for all pages
============================================================ */

const API = '/api/v1';

// ─── TOKEN / AUTH ─────────────────────────────────────────
const getToken  = ()      => localStorage.getItem('token');
const getUser   = ()      => JSON.parse(localStorage.getItem('user') || 'null');
const setAuth   = (t, u)  => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); };
const clearAuth = ()      => { localStorage.removeItem('token'); localStorage.removeItem('user'); };

// Redirect to login if not authenticated (call on every protected page)
function requireAuth() {
  if (!getToken()) { window.location.href = '/login.html'; return false; }
  return true;
}

// Redirect to dashboard if already logged in (call on login page)
function redirectIfAuth() {
  if (getToken()) window.location.href = '/dashboard.html';
}

// ─── API HELPER ───────────────────────────────────────────
async function apiFetch(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(API + path, opts);
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { clearAuth(); window.location.href = '/login.html'; return null; }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API error:', err);
    return { ok: false, data: { message: 'Network error' } };
  }
}

const apiGet    = (path)        => apiFetch('GET',    path);
const apiPost   = (path, body)  => apiFetch('POST',   path, body);
const apiPut    = (path, body)  => apiFetch('PUT',    path, body);
const apiDelete = (path)        => apiFetch('DELETE', path);

// ─── LOGOUT ───────────────────────────────────────────────
async function logout() {
  await fetch(API + '/auth/logout', { method: 'POST' }).catch(() => {});
  clearAuth();
  window.location.href = '/login.html';
}

// ─── SIDEBAR RENDER ───────────────────────────────────────
function renderSidebar(activePage) {
  const user = getUser();
  const pages = [
    { id: 'dashboard',   label: 'Dashboard',           icon: '⬡',  href: '/dashboard.html' },
    { id: 'attacks',     label: 'Attack Simulation',   icon: '⚡',  href: '/attacks.html',   dot: true },
    { id: 'monitoring',  label: 'Monitoring',          icon: '◉',  href: '/monitoring.html' },
    { id: 'processes',   label: 'Process Scheduling',  icon: '⚙',  href: '/processes.html' },
    { id: 'memory',      label: 'Memory Management',   icon: '▦',  href: '/memory.html' },
    { id: 'ipc',         label: 'IPC Simulation',      icon: '⇄',  href: '/ipc.html' },
    { id: 'ai',          label: 'AI Prevention',       icon: '✦',  href: '/ai.html' },
    { id: 'reports',     label: 'Reports',             icon: '▤',  href: '/reports.html' },
  ];

  const nav = pages.map(p => `
    <a href="${p.href}" class="nav-link ${activePage === p.id ? 'active' : ''}">
      <span class="icon">${p.icon}</span>
      <span>${p.label}</span>
      ${p.dot ? '<span class="badge-dot"></span>' : ''}
    </a>
  `).join('');

  const initials = user ? (user.username || 'U').slice(0, 2).toUpperCase() : 'OS';

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">🛡</div>
        <div class="brand-text">
          <div class="title">OS-SECURITY</div>
          <div class="sub">Detection Framework</div>
        </div>
      </div>

      <div class="sidebar-section-label">Navigation</div>
      ${nav}

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name truncate">${user?.username || 'User'}</div>
            <div class="user-role">${user?.role || 'user'}</div>
          </div>
          <button class="btn-logout" onclick="logout()" title="Logout">⏻</button>
        </div>
      </div>
    </aside>
  `;
}

// ─── TOPBAR RENDER ────────────────────────────────────────
function renderTopbar(title, subtitle = '') {
  return `
    <div class="topbar">
      <div class="topbar-title">
        <span>//</span>${title}
        ${subtitle ? `<span style="color:var(--text-muted);font-size:12px;margin-left:8px;">${subtitle}</span>` : ''}
      </div>
      <div class="system-clock" id="system-clock">--:--:--</div>
      <div class="status-pill online">● Online</div>
    </div>
  `;
}

// ─── CLOCK ────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('system-clock');
  if (!el) return;
  const tick = () => { el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false }); };
  tick(); setInterval(tick, 1000);
}

// ─── TOASTS ───────────────────────────────────────────────
let _toastContainer = null;

function getToastContainer() {
  if (_toastContainer) return _toastContainer;
  _toastContainer = document.createElement('div');
  _toastContainer.className = 'toast-wrap';
  document.body.appendChild(_toastContainer);
  return _toastContainer;
}

function showToast(msg, type = 'info', duration = 3500) {
  const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
  const tc  = getToastContainer();
  const el  = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.innerHTML = `
    <span class="toast-icon" style="color:${type==='success'?'var(--green)':type==='error'?'var(--red)':type==='warning'?'var(--yellow)':'var(--cyan)'}">${icons[type]}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  tc.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ─── SEVERITY / STATUS HELPERS ────────────────────────────
function severityBadge(s) {
  const m = { CRITICAL:'critical', HIGH:'high', MEDIUM:'medium', LOW:'low' };
  return `<span class="badge-cyber ${m[s]||'medium'}">${s}</span>`;
}

function statusBadge(s) {
  const m = { DETECTED:'detected', BLOCKED:'blocked', RESOLVED:'resolved' };
  return `<span class="badge-cyber ${m[s]||'medium'}">${s}</span>`;
}

function fmtDate(d) {
  return new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function fmtTime(d) { return new Date(d).toLocaleTimeString('en-IN', { hour12: false }); }

// ─── LOG TERMINAL ────────────────────────────────────────
function logToTerminal(terminalId, msg, level = 'info') {
  const el = document.getElementById(terminalId);
  if (!el) return;
  const ts  = new Date().toLocaleTimeString('en-IN', { hour12: false });
  const entry = document.createElement('span');
  entry.className = `log-entry ${level}`;
  entry.innerHTML = `<span class="ts">[${ts}]</span>${msg}\n`;
  el.appendChild(entry);
  el.scrollTop = el.scrollHeight;
}

// ─── THEME APPLY (runs immediately) ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
  startClock();
});
