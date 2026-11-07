import { state, update, subscribe, reset, feed } from './store.js';
import { t, LANGS, setLang } from './i18n.js';
import { icon } from './icons.js';
import { esc, toast, closeDrawer } from './ui.js';
import { navigator as procNav, ROLES } from './process.js';
import { renderGuest, guestActions, guestChanges } from './views/guest.js';
import { hostView, hostActions } from './views/host.js';
import { registerView, registerActions, registerInputs } from './views/register.js';
import { muniView, muniActions } from './views/municipality.js';
import { policeView, policeActions } from './views/police.js';
import { cantonView } from './views/canton.js';
import { homeView, processView } from './views/pages.js';
import { renderTour, tourActions } from './tour.js';

// ---------- Sprache ----------
if (!state.lang) {
  const nav = (navigator.language || 'de').slice(0, 2);
  state.lang = LANGS.some((l) => l.id === nav) ? nav : 'de';
}
setLang(state.lang);

const NAV = {
  host: { base: '#/gastgeber', who: 'Sandra Meier', org: 'Hotel Seerose am Quai', items: [['', 'home', 'nav.overview'], ['ankuenfte', 'calendar', 'nav.arrivals'], ['meldungen', 'list', 'nav.reports'], ['abrechnungen', 'wallet', 'nav.invoices'], ['objekte', 'bed', 'nav.objects'], ['konto', 'user', 'nav.account']] },
  municipality: { base: '#/gemeinde', who: 'Monika Achermann', org: 'Stadt Luzern · Tourismusabgaben', items: [['', 'home', 'nav.overview'], ['abrechnungen', 'wallet', 'nav.invoices'], ['auffaelligkeiten', 'alert', 'nav.alerts'], ['betriebe', 'database', 'nav.hosts'], ['tarife', 'sliders', 'nav.tariffs'], ['verteilung', 'chart', 'nav.distribution'], ['konto', 'user', 'nav.account']] },
  police: { base: '#/polizei', who: 'Kpl. Rahel Studer', org: 'Luzerner Polizei · GGP', items: [['suche', 'search', 'nav.search'], ['protokoll', 'list', 'nav.log'], ['konto', 'user', 'nav.account']] },
  canton: { base: '#/kanton', who: 'Lea Bucher', org: 'Kanton Luzern / LTAG', items: [['', 'home', 'nav.overview'], ['konto', 'user', 'nav.account']] },
};
const SEG = { gastgeber: 'host', gemeinde: 'municipality', polizei: 'police', kanton: 'canton' };

function parse() {
  const h = (location.hash || '#/').replace(/^#\/?/, '');
  const [a = '', b = ''] = h.split('?')[0].split('/');
  return { a, b };
}

function currentRole(r) {
  if (r.a === 'gast') return 'guest';
  return SEG[r.a] || null;
}

// ---------- Kopfzeile ----------
function header(role) {
  const roleLabel = role ? t('role.' + role) : t('nav.chooseRole');
  return `<header class="topbar">
    <div class="topbar-in">
      <a class="brand" href="#/" aria-label="LUMA ${esc(t('nav.home'))}">
        <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="8" fill="#0A2540"/><path d="M6 21 12 12l4 5 3-3 7 7z" fill="#fff"/><path d="M6 24.5c3.3-1.6 6.7-1.6 10 0s6.7 1.6 10 0" stroke="#5FA8E8" stroke-width="2" fill="none" stroke-linecap="round"/></svg></span>
        <span class="brand-txt"><strong>LUMA</strong><span>${esc(t('brand.sub'))}</span></span>
      </a>
      <div class="topbar-actions">
        <a class="tb-link hide-sm ${parse().a === 'prozess' ? 'is-active' : ''}" href="#/prozess">${icon('route', 18)} ${esc(t('nav.process'))}</a>
        <div class="menu-wrap">
          <button class="role-btn" data-action="menu" data-arg="roles" aria-haspopup="true" aria-expanded="${state.ui.menu === 'roles'}">${icon(role ? ROLES[role].icon : 'users', 18)}<span class="hide-xs">${esc(roleLabel)}</span>${icon('chevronDown', 16)}</button>
          ${state.ui.menu === 'roles' ? roleMenu(role) : ''}
        </div>
        <label class="lang-sel"><span class="sr">${esc(t('common.language'))}</span>${icon('globe', 18)}<select data-change="lang" aria-label="${esc(t('common.language'))}">${LANGS.map((l) => `<option value="${l.id}" ${l.id === state.lang ? 'selected' : ''}>${l.short}</option>`).join('')}</select></label>
        <div class="menu-wrap">
          <button class="icon-btn demo-btn" data-action="menu" data-arg="demo" aria-label="${esc(t('nav.demo'))}" aria-expanded="${state.ui.menu === 'demo'}">${icon('play', 18)}<span class="hide-sm">${esc(t('nav.demo'))}</span></button>
          ${state.ui.menu === 'demo' ? demoMenu() : ''}
        </div>
      </div>
    </div>
  </header>`;
}

function roleMenu(role) {
  const roles = ['guest', 'host', 'municipality', 'police', 'canton'];
  return `<div class="menu" role="menu">
    <div class="menu-title">${esc(t('nav.switchRole'))}</div>
    ${roles.map((r) => `<a role="menuitem" class="menu-item ${r === role ? 'is-active' : ''}" href="${ROLES[r].home}" data-action="menuClose"><span class="mi-ic">${icon(ROLES[r].icon, 18)}</span><span><strong>${esc(t('role.' + r))}</strong><span class="muted small">${esc(t('role.' + r + '.who'))}</span></span></a>`).join('')}
    <a role="menuitem" class="menu-item" href="#/registrierung" data-action="menuClose"><span class="mi-ic">${icon('plus', 18)}</span><span><strong>${esc(t('home.reg'))}</strong><span class="muted small">${esc(t('home.regWho'))}</span></span></a>
    <a role="menuitem" class="menu-item" href="#/prozess" data-action="menuClose"><span class="mi-ic">${icon('route', 18)}</span><span><strong>${esc(t('nav.process'))}</strong><span class="muted small">${esc(t('proc.sub'))}</span></span></a>
  </div>`;
}

function demoMenu() {
  return `<div class="menu menu-right" role="menu">
    <div class="menu-title">${esc(t('nav.demo'))}</div>
    <button role="menuitem" class="menu-item" data-action="tourStart"><span class="mi-ic">${icon('play', 18)}</span><span><strong>${esc(t('home.tour'))}</strong><span class="muted small">${esc(t('demo.tourT'))}</span></span></button>
    <a role="menuitem" class="menu-item" href="#/gast/B-24017" data-action="menuClose"><span class="mi-ic">${icon('mail', 18)}</span><span><strong>${esc(t('demo.guestLink'))}</strong><span class="muted small">${esc(t('demo.guestLinkT'))}</span></span></a>
    <button role="menuitem" class="menu-item" data-action="resetDemo"><span class="mi-ic">${icon('refresh', 18)}</span><span><strong>${esc(t('demo.reset'))}</strong><span class="muted small">${esc(t('demo.resetT'))}</span></span></button>
  </div>`;
}

function protoBanner(lang) {
  return `<div class="proto" role="note">${icon('info', 15)} <span>${esc(t('proto.banner', {}, lang))}</span></div>`;
}

function nextCard(n) {
  if (!n || (n.href && n.href === location.hash)) return '';
  const cta = n.href ? `<a class="btn btn-primary" href="${n.href}">${esc(n.cta)} ${icon('arrowRight', 16)}</a>` : `<button class="btn btn-primary" data-action="${n.action}" data-arg="${esc(n.arg || '')}">${esc(n.cta)} ${icon('arrowRight', 16)}</button>`;
  return `<section class="next ${n.calm ? 'next-calm' : ''}" aria-label="${esc(t('nav.nextStep'))}">
    <div class="next-txt"><span class="next-lbl">${esc(t('nav.nextStep'))}</span><strong>${esc(n.title)}</strong><span>${esc(n.text)}</span></div>
    ${cta}
  </section>`;
}

function page(v, role) {
  return `<div class="page-head"><div><h1>${esc(v.title)}</h1>${v.sub ? `<p class="muted">${esc(v.sub)}</p>` : ''}${role ? procNav(role) : ''}</div>${v.actions ? `<div class="page-actions">${v.actions}</div>` : ''}</div>
    ${nextCard(v.next)}
    ${v.body}`;
}

function shell(role, tab, v) {
  const nav = NAV[role];
  const alerts = state.alerts.filter((a) => a.status === 'open').length;
  const items = nav.items.map(([k, ic, key]) => {
    const active = (tab || nav.items[0][0]) === k;
    const badge = k === 'auffaelligkeiten' && alerts ? `<span class="badge">${alerts}</span>` : '';
    return `<a class="side-item ${active ? 'is-active' : ''}" href="${nav.base}${k ? '/' + k : ''}" ${active ? 'aria-current="page"' : ''}>${icon(ic, 20)}<span>${esc(t(key))}</span>${badge}</a>`;
  }).join('');
  const tabs = nav.items.slice(0, 5).map(([k, ic, key]) => {
    const active = (tab || nav.items[0][0]) === k;
    return `<a class="tab-item ${active ? 'is-active' : ''}" href="${nav.base}${k ? '/' + k : ''}">${icon(ic, 22)}<span>${esc(t(key))}</span>${k === 'auffaelligkeiten' && alerts ? `<span class="badge">${alerts}</span>` : ''}</a>`;
  }).join('');
  return `<div class="shell">
    <aside class="side" aria-label="${esc(t('nav.main'))}">
      <div class="side-role">${icon(ROLES[role].icon, 18)} ${esc(t('role.' + role))}</div>
      <nav class="side-nav">${items}</nav>
      <div class="side-user"><span class="avatar">${esc(nav.who.split(' ').map((w) => w[0]).slice(-2).join(''))}</span><div><strong>${esc(nav.who)}</strong><span class="muted small">${esc(nav.org)}</span></div></div>
    </aside>
    <main class="content" id="main">${page(v, role)}</main>
    <nav class="tabbar" aria-label="${esc(t('nav.main'))}">${tabs}</nav>
  </div>`;
}

// ---------- Render ----------
let lastRoute = '';
function render() {
  const r = parse();
  const role = currentRole(r);
  const app = document.getElementById('app');
  document.documentElement.lang = state.lang;
  const focusKey = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.input : null;
  let html = '';
  let title = 'LUMA';
  if (r.a === 'gast') {
    const gb = state.bookings.find((x) => x.id === (r.b || 'B-24017')) || state.bookings[0];
    const gLang = state.guestLang || gb.lang;
    document.documentElement.lang = gLang;
    html = protoBanner(gLang) + renderGuest(r.b);
    title = t('g.official') + ' · LUMA';
    document.body.dataset.mode = 'guest';
  } else {
    document.body.dataset.mode = 'staff';
    let v; let inner;
    if (role) {
      v = role === 'host' ? hostView(r.b) : role === 'municipality' ? muniView(r.b, state.lang) : role === 'police' ? policeView(r.b) : cantonView(r.b, state.lang);
      inner = shell(role, r.b, v);
    } else if (r.a === 'prozess') {
      v = processView();
      inner = `<main class="content solo" id="main">${page(v, null)}</main>`;
    } else if (r.a === 'registrierung') {
      v = registerView();
      inner = `<main class="content solo" id="main">${page(v)}</main>`;
    } else {
      v = { title: t('home.title') };
      inner = `<main class="content solo wide" id="main">${homeView()}</main>`;
    }
    title = `${v.title} · LUMA`;
    html = header(role) + protoBanner() + inner;
  }
  app.innerHTML = html;
  document.title = title;
  renderTour();
  if (location.hash !== lastRoute) { lastRoute = location.hash; window.scrollTo(0, 0); }
  if (focusKey) { const el = document.querySelector(`[data-input="${focusKey}"]`); if (el) { el.focus(); const l = el.value.length; try { el.setSelectionRange(l, l); } catch (e) { /* */ } } }
  const floatBtn = document.getElementById('float');
  floatBtn.innerHTML = r.a === 'gast' ? `<a class="float-btn" href="#/gastgeber/ankuenfte" title="${esc(t('demo.backToHost'))}">${icon('users', 18)}<span>${esc(t('demo.backToHost'))}</span></a>` : '';
}

// ---------- Aktionen ----------
const ACTIONS = {
  ...guestActions, ...hostActions, ...registerActions, ...muniActions, ...policeActions, ...tourActions,
  noop: () => {},
  closeDrawer: () => closeDrawer(),
  toastInfo: (arg) => toast(arg, 'info'),
  toastOk: (arg) => toast(arg, 'ok'),
  menu: (arg) => update((s) => { s.ui.menu = s.ui.menu === arg ? null : arg; }),
  menuClose: () => update((s) => { s.ui.menu = null; }, { silent: true }),
  resetDemo: () => { reset(); closeDrawer(); toast(t('demo.resetDone'), 'ok'); location.hash = '#/'; },
};
const CHANGES = {
  ...guestChanges,
  lang: (v) => { update((s) => { s.lang = v; }, { silent: true }); setLang(v); render(); },
};
const INPUTS = {
  ...registerInputs,
  hostQ: (v) => update((s) => { s.ui.hostQ = v; }),
  muniQ: (v) => update((s) => { s.ui.muniQ = v; }),
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) {
    if (state.ui.menu && !e.target.closest('.menu-wrap')) update((s) => { s.ui.menu = null; });
    return;
  }
  const name = el.dataset.action;
  const fn = ACTIONS[name];
  if (!fn) return;
  if (el.tagName === 'BUTTON' && el.type !== 'submit') e.preventDefault();
  if (name !== 'menu' && name !== 'menuClose' && state.ui.menu) update((s) => { s.ui.menu = null; }, { silent: true });
  fn(el.dataset.arg, el);
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-submit]');
  if (!f) return;
  e.preventDefault();
  const fn = ACTIONS[f.dataset.submit];
  if (fn) fn(f.dataset.arg, f);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el && CHANGES[el.dataset.change]) CHANGES[el.dataset.change](el.value);
});
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-input]');
  if (el && INPUTS[el.dataset.input]) INPUTS[el.dataset.input](el.value);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeDrawer(); if (state.ui.menu) update((s) => { s.ui.menu = null; }); }
});

window.addEventListener('hashchange', () => { if (state.ui.menu) state.ui.menu = null; closeDrawer(); render(); });
subscribe(render);
render();
