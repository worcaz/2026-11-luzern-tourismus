import { icon } from './icons.js';
import { t, locale } from './i18n.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const chf = (n) => 'CHF ' + Number(n).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const num = (n) => Number(n).toLocaleString('de-CH');

export function fdate(iso, lang, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '–';
  const d = new Date(iso.length <= 10 ? iso + 'T12:00' : iso);
  return new Intl.DateTimeFormat(locale(lang), opts).format(d);
}
export const fdt = (iso, lang) => fdate(iso, lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const frange = (a, b, lang) => `${fdate(a, lang, { day: 'numeric', month: 'short' })} – ${fdate(b, lang, { day: 'numeric', month: 'short', year: 'numeric' })}`;
export function fmonth(period, lang) {
  const [y, m] = period.split('-');
  return new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric' }).format(new Date(+y, +m - 1, 15));
}

export function chip(kind, label, ic) {
  return `<span class="chip chip-${kind}">${ic ? icon(ic, 14) : ''}${esc(label)}</span>`;
}

export function statusChip(status, lang) {
  const map = {
    invited: ['neutral', 'status.invited', 'mail'],
    precheckin: ['info', 'status.precheckin', 'checkCircle'],
    checkedin: ['ok', 'status.checkedin', 'check'],
    review: ['warn', 'status.review', 'eye'],
    open: ['info', 'status.open', 'clock'],
    paid: ['ok', 'status.paid', 'check'],
    overdue: ['err', 'status.overdue', 'alert'],
    done: ['ok', 'status.done', 'check'],
  };
  const [k, key, ic] = map[status] || ['neutral', status];
  return chip(k, t(key, {}, lang), ic);
}

// ---------- Toast ----------
let toastTimer;
export function toast(msg, kind = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.className = `toast show toast-${kind}`;
  el.innerHTML = `${icon(kind === 'ok' ? 'checkCircle' : kind === 'err' ? 'alert' : 'info', 20)}<span>${esc(msg)}</span>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3600);
}

// ---------- Drawer / Dialog ----------
export function openDrawer(html, title) {
  const root = document.getElementById('overlay');
  root.innerHTML = `<div class="backdrop" data-action="closeDrawer"></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title || '')}">
    <div class="drawer-head"><h2>${esc(title || '')}</h2><button class="icon-btn" data-action="closeDrawer" aria-label="${esc(t('common.close'))}">${icon('x', 22)}</button></div>
    <div class="drawer-body">${html}</div>
  </aside>`;
  root.classList.add('open');
  document.body.classList.add('no-scroll');
  setTimeout(() => { const f = root.querySelector('input,select,textarea,button.btn'); if (f) f.focus(); }, 60);
}
export function closeDrawer() {
  const root = document.getElementById('overlay');
  root.classList.remove('open');
  root.innerHTML = '';
  document.body.classList.remove('no-scroll');
}

// ---------- Pseudo-QR (nur Darstellung) ----------
export function qr(seed, size = 168) {
  const n = 25;
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0; return h / 4294967295; };
  const cell = size / n;
  let rects = '';
  const finder = (x, y) => (x >= 0 && x < 7 && y >= 0 && y < 7);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inF = finder(x, y) || finder(x - (n - 7), y) || finder(x, y - (n - 7));
    if (inF) continue;
    if (rnd() > 0.52) rects += `<rect x="${(x * cell).toFixed(2)}" y="${(y * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}"/>`;
  }
  const c = cell;
  const fp = (x, y) => `<path fill-rule="evenodd" d="M${x * c} ${y * c}h${7 * c}v${7 * c}h${-7 * c}z M${(x + 1) * c} ${(y + 1) * c}v${5 * c}h${5 * c}v${-5 * c}z"/><rect x="${(x + 2) * c}" y="${(y + 2) * c}" width="${3 * c}" height="${3 * c}"/>`;
  return `<svg class="qr" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="currentColor" role="img" aria-label="QR">${rects}${fp(0, 0)}${fp(n - 7, 0)}${fp(0, n - 7)}</svg>`;
}

// ---------- Balkendiagramm ----------
export function barChart(values, labels, { height = 180, unit = '', highlight = -1 } = {}) {
  const max = Math.max(...values) * 1.1;
  const w = 100 / values.length;
  const bars = values.map((v, i) => {
    const h = (v / max) * 100;
    return `<div class="bar-col" style="width:${w}%"><div class="bar-track"><div class="bar ${i === highlight ? 'bar-hl' : ''}" style="height:${h}%" title="${esc(labels[i])}: ${esc(num(v))}${unit}"><span class="bar-val">${esc(num(v))}</span></div></div><div class="bar-lbl">${esc(labels[i])}</div></div>`;
  }).join('');
  return `<div class="barchart" style="height:${height}px">${bars}</div>`;
}

export function hbars(items, { unit = '' } = {}) {
  const max = Math.max(...items.map((i) => i.v));
  return `<div class="hbars">${items.map((i) => `<div class="hbar-row"><div class="hbar-lbl">${esc(i.name)}</div><div class="hbar-track"><div class="hbar" style="width:${(i.v / max) * 100}%"></div></div><div class="hbar-val">${esc(num(i.v))}${unit}</div></div>`).join('')}</div>`;
}

export function kpi(label, value, sub, ic, kind = '') {
  return `<div class="kpi ${kind}"><div class="kpi-lbl">${esc(label)}</div><div class="kpi-val">${esc(value)}</div>${sub ? `<div class="kpi-sub">${esc(sub)}</div>` : ''}</div>`;
}

export function field(name, label, { type = 'text', value = '', required = false, hint = '', options = null, err = '', autocomplete = '', attrs = '' } = {}) {
  const id = `f-${name}`;
  let input;
  if (options) {
    input = `<select id="${id}" name="${name}" ${required ? 'required' : ''} ${attrs}>${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  } else if (type === 'textarea') {
    input = `<textarea id="${id}" name="${name}" rows="3" ${required ? 'required' : ''} ${attrs}>${esc(value)}</textarea>`;
  } else {
    input = `<input id="${id}" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${attrs}>`;
  }
  return `<div class="field ${err ? 'has-err' : ''}"><label for="${id}">${esc(label)}${required ? '' : ` <span class="opt">${esc(t('common.optional'))}</span>`}</label>${input}${hint ? `<div class="hint">${esc(hint)}</div>` : ''}${err ? `<div class="err">${icon('alert', 14)} ${esc(err)}</div>` : ''}</div>`;
}

export function formData(form) {
  const o = {};
  new FormData(form).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; });
  return o;
}
