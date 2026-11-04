import { state, update, host, meldescheine, nowIso } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, fdate, fdt, frange, toast, chip, field, formData, openDrawer } from '../ui.js';
import { toggle } from './host.js';

const PURPOSES = ['search', 'missing', 'identity', 'control'];

export function policeView(tab) {
  if (tab === 'protokoll') return logView();
  if (tab === 'konto') return account();
  return searchView();
}

export function policeNext() {
  return { title: t('p.next'), text: t('p.nextT'), cta: t('p.toSearch'), href: '#/polizei/suche', icon: 'search', calm: true };
}

function searchView() {
  const q = state.ui.policeQ || {};
  const results = state.ui.policeRes;
  let res = '';
  if (results) {
    res = `<section class="card p0"><div class="card-head pad"><h2>${esc(t('p.results', { n: results.length }))}</h2>${chip('info', t('p.logged'), 'lock')}</div>
    ${results.length ? `<table class="tbl"><thead><tr><th>${esc(t('h.colGuest'))}</th><th>${esc(t('g.birth'))}</th><th>${esc(t('p.colHost'))}</th><th>${esc(t('h.colStay'))}</th><th><span class="sr">${esc(t('common.action'))}</span></th></tr></thead><tbody>
    ${results.map((m, i) => `<tr><td data-label="${esc(t('h.colGuest'))}"><strong>${esc(m.last)}, ${esc(m.first)}</strong><div class="muted small">${esc(m.nat)}${m.companion ? ' · ' + esc(t('p.companion')) : ''}</div></td><td data-label="${esc(t('g.birth'))}">${esc(fdate(m.birth))}</td><td data-label="${esc(t('p.colHost'))}">${esc(host(m.host).name)}<div class="muted small">${esc(host(m.host).municipality)}</div></td><td data-label="${esc(t('h.colStay'))}">${esc(frange(m.arrival, m.departure))}</td><td class="td-act"><button class="btn btn-secondary btn-sm" data-action="p.open" data-arg="${i}">${icon('eye', 16)} ${esc(t('p.open'))}</button></td></tr>`).join('')}
    </tbody></table>` : `<div class="empty">${icon('search', 28)}<p>${esc(t('p.none'))}</p></div>`}</section>`;
  }
  return {
    title: t('p.title'),
    sub: t('p.sub'),
    next: policeNext(),
    body: `<div class="note note-lock">${icon('lock', 18)}<span>${esc(t('p.purposeNote'))}</span></div>
    <form class="card" data-submit="p.search" novalidate>
      <h2>${icon('search', 20)} ${esc(t('p.search'))}</h2>
      <div class="grid-2">
        ${field('purpose', t('p.purpose'), { value: q.purpose || '', required: true, options: [['', t('p.choose')], ...PURPOSES.map((p) => [p, t('p.pur.' + p)])] })}
        ${field('ref', t('p.ref'), { value: q.ref || '', required: true, hint: t('p.refHint') })}
      </div>
      <div class="grid-3">
        ${field('last', t('g.last'), { value: q.last || '', required: false })}
        ${field('first', t('g.first'), { value: q.first || '', required: false })}
        ${field('birth', t('g.birth'), { type: 'date', value: q.birth || '', required: false })}
      </div>
      <div class="grid-2">
        ${field('from', t('p.from'), { type: 'date', value: q.from || '2026-10-01', required: false })}
        ${field('to', t('p.to'), { type: 'date', value: q.to || '2026-11-30', required: false })}
      </div>
      <div class="btn-row"><button class="btn btn-primary" type="submit">${icon('search', 18)} ${esc(t('p.searchBtn'))}</button><button type="button" class="link-btn demo-fill" data-action="p.fill">${icon('sparkle', 15)} ${esc(t('p.demoFill'))}</button></div>
    </form>
    ${res}
    <div class="grid-2 gap">
      <section class="card"><div class="card-head"><h2>${icon('eye', 20)} ${esc(t('p.visible'))}</h2></div><ul class="ticks"><li>${esc(t('p.v1'))}</li><li>${esc(t('p.v2'))}</li><li>${esc(t('p.v3'))}</li></ul></section>
      <section class="card"><div class="card-head"><h2>${icon('lock', 20)} ${esc(t('p.notVisible'))}</h2></div><ul class="crosses"><li>${esc(t('p.nv1'))}</li><li>${esc(t('p.nv2'))}</li><li>${esc(t('p.nv3'))}</li></ul></section>
    </div>`,
  };
}

function logView() {
  return {
    title: t('p.logTitle'),
    sub: t('p.logSub'),
    body: `<section class="card p0"><table class="tbl"><thead><tr><th>${esc(t('p.colTime'))}</th><th>${esc(t('p.purpose'))}</th><th>${esc(t('p.ref'))}</th><th>${esc(t('p.colQuery'))}</th><th>${esc(t('p.colHits'))}</th></tr></thead><tbody>
    ${state.policeLog.map((l) => `<tr><td data-label="${esc(t('p.colTime'))}">${esc(fdt(l.at))}<div class="muted small">${esc(l.user)}</div></td><td data-label="${esc(t('p.purpose'))}">${esc(t('p.pur.' + l.purpose))}</td><td data-label="${esc(t('p.ref'))}" class="mono">${esc(l.ref)}</td><td data-label="${esc(t('p.colQuery'))}">${esc(l.query)}</td><td data-label="${esc(t('p.colHits'))}">${esc(String(l.hits))}${l.view ? ' · ' + esc(t('p.viewed')) : ''}</td></tr>`).join('')}
    </tbody></table></section>
    <p class="muted small">${icon('info', 14)} ${esc(t('p.logNote'))}</p>`,
  };
}

function account() {
  return {
    title: t('acc.title'),
    sub: t('p.accSub'),
    body: `<div class="grid-2 gap">
      <section class="card"><div class="card-head"><h2>${icon('user', 20)} ${esc(t('acc.profile'))}</h2></div><dl class="dl"><dt>${esc(t('acc.name'))}</dt><dd>Kpl. Rahel Studer</dd><dt>${esc(t('acc.role'))}</dt><dd>${esc(t('p.roleV'))}</dd><dt>${esc(t('acc.login'))}</dt><dd>${icon('key', 15)} ${esc(t('p.loginV'))}</dd></dl></section>
      <section class="card"><div class="card-head"><h2>${icon('link', 20)} ${esc(t('p.ifaces'))}</h2></div>
        <ul class="rows"><li><div><strong>${esc(t('p.if1'))}</strong><span class="muted">${esc(t('p.if1T'))}</span></div>${chip('ok', t('common.connected'), 'check')}</li>
        <li><div><strong>${esc(t('p.if2'))}</strong><span class="muted">${esc(t('p.if2T'))}</span></div>${chip('warn', t('p.variant'), 'clock')}</li></ul></section>
      <section class="card"><div class="card-head"><h2>${icon('bell', 20)} ${esc(t('acc.notif'))}</h2></div>${toggle('p1', t('p.n1'), true)}${toggle('p2', t('p.n2'), false)}</section>
    </div>`,
  };
}

export const policeActions = {
  'p.fill': () => { update(() => { state.ui.policeQ = { purpose: 'search', ref: 'FA-2026-0918', last: 'Martin', first: '', birth: '', from: '2026-10-01', to: '2026-11-30' }; }); },
  'p.search': (_, form) => {
    const v = formData(form);
    if (!v.purpose || !v.ref) { update(() => { state.ui.policeQ = v; state.ui.policeRes = null; }); toast(t('p.needPurpose'), 'err'); return; }
    const res = meldescheine().filter((m) => {
      if (v.last && !m.last.toLowerCase().includes(v.last.toLowerCase())) return false;
      if (v.first && !m.first.toLowerCase().includes(v.first.toLowerCase())) return false;
      if (v.birth && m.birth !== v.birth) return false;
      if (v.from && m.departure < v.from) return false;
      if (v.to && m.arrival > v.to) return false;
      return true;
    });
    update(() => {
      state.ui.policeQ = v; state.ui.policeRes = res;
      state.policeLog.unshift({ at: nowIso(), user: 'R. Studer', purpose: v.purpose, ref: v.ref, query: [v.last, v.first, v.birth].filter(Boolean).join(', ') || t('p.allInRange'), hits: res.length });
    });
    toast(t('p.searchLogged'), 'info');
  },
  'p.open': (i) => {
    const m = state.ui.policeRes[+i];
    const h = host(m.host);
    update(() => { const l = state.policeLog[0]; if (l) l.view = true; }, { silent: true });
    openDrawer(`<div class="stack"><div class="ms-card"><div class="ms-head"><span class="mono">${esc(m.ms)}</span>${chip('info', t('p.logged'), 'lock')}</div>
      <dl class="dl"><dt>${esc(t('g.last'))}</dt><dd>${esc(m.last)}</dd><dt>${esc(t('g.first'))}</dt><dd>${esc(m.first)}</dd><dt>${esc(t('g.birth'))}</dt><dd>${esc(fdate(m.birth))}</dd><dt>${esc(t('g.nat'))}</dt><dd>${esc(m.nat)}</dd><dt>${esc(t('g.s2'))}</dt><dd>${esc(m.doc)}</dd><dt>${esc(t('p.colHost'))}</dt><dd>${esc(h.name)}<br><span class="muted">${esc(h.address)}</span></dd><dt>${esc(t('h.colStay'))}</dt><dd>${esc(frange(m.arrival, m.departure))}</dd><dt>${esc(t('p.persons'))}</dt><dd>${esc(String(m.persons))}</dd></dl></div>
      <div class="note note-lock">${icon('lock', 18)}<span>${esc(t('p.drawerNote'))}</span></div></div>`, t('p.msTitle'));
  },
};
