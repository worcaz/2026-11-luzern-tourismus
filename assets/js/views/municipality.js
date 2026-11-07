import { state, update, host, invoiceAmounts, feed } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, chf, num, fdate, fmonth, statusChip, kpi, toast, chip, barChart, openDrawer, closeDrawer, field } from '../ui.js';
import { MUNI_MONTHS, TARIFFS } from '../data.js';
import { toggle } from './host.js';

const MONTHS = (L) => Array.from({ length: 10 }, (_, i) => new Intl.DateTimeFormat(L, { month: 'short' }).format(new Date(2026, i, 15)));
const openAlerts = () => state.alerts.filter((a) => a.status === 'open');
const oct = () => state.invoices.filter((i) => i.period === '2026-10');

export function muniNext() {
  const n = openAlerts().length;
  if (n) return { title: t('m.nextAlerts', { n }), text: t('m.nextAlertsT'), cta: t('m.toAlerts'), href: '#/gemeinde/auffaelligkeiten', icon: 'alert' };
  return { title: t('m.nextNone'), text: t('m.nextNoneT'), cta: t('m.toInvoices'), href: '#/gemeinde/abrechnungen', icon: 'checkCircle', calm: true };
}

export function muniView(tab, lang) {
  switch (tab) {
    case 'abrechnungen': return invoices();
    case 'auffaelligkeiten': return alerts();
    case 'betriebe': return hostsView();
    case 'tarife': return tariffs();
    case 'verteilung': return distribution();
    case 'konto': return account();
    default: return overview(lang);
  }
}

function totals() {
  const list = oct();
  const sum = list.reduce((s, i) => s + invoiceAmounts(i).total, 0);
  const paid = list.filter((i) => i.status === 'paid').reduce((s, i) => s + invoiceAmounts(i).total, 0);
  return { sum, paid, pct: Math.round((paid / sum) * 100) };
}

function overview(lang) {
  const tt = totals();
  return {
    title: t('m.title'),
    sub: t('m.sub'),
    next: muniNext(),
    body: `<div class="grid-3 gap">
      ${kpi(t('m.kNights'), '118 420', t('m.kNightsSub'), 'bed')}
      ${kpi(t('m.kBilled'), chf(tt.sum), t('m.kBilledSub'), 'file')}
      ${kpi(t('m.kPaid'), tt.pct + ' %', chf(tt.paid), 'checkCircle', 'kpi-ok')}
    </div>
    <div class="grid-2 gap">
      <section class="card"><div class="card-head"><h2>${esc(t('m.chart'))}</h2></div>${barChart(MUNI_MONTHS, MONTHS(lang), { highlight: 9 })}<p class="muted small">${esc(t('m.chartNote'))}</p></section>
      <section class="card"><div class="card-head"><h2>${esc(t('m.alerts'))}</h2><a class="link" href="#/gemeinde/auffaelligkeiten">${esc(t('common.all'))} ${icon('chevronRight', 16)}</a></div>
        <ul class="rows">${state.alerts.map((a) => `<li><div><strong>${esc(t(`al.${a.type}.title`))}</strong><span class="muted">${esc(t(`al.${a.type}.short`))}</span></div>${a.status === 'done' ? statusChip('done') : ''}</li>`).join('')}</ul></section>
    </div>`,
  };
}

function invoices() {
  const list = oct().concat(state.invoices.filter((i) => i.status === 'overdue' && i.period !== '2026-10'));
  return {
    title: t('m.invTitle'),
    sub: t('m.invSub'),
    body: `<section class="card p0"><table class="tbl"><thead><tr><th>${esc(t('m.colHost'))}</th><th>${esc(t('h.colPeriod'))}</th><th>${esc(t('h.invCharge'))}</th><th>${esc(t('h.invTotal'))}</th><th>${esc(t('h.colStatus'))}</th><th><span class="sr">${esc(t('common.action'))}</span></th></tr></thead><tbody>
    ${list.map((i) => { const a = invoiceAmounts(i); const h = host(i.host); const name = i.platform ? t('m.platformBill') : h.name; return `<tr class="${i.status === 'overdue' ? 'row-err' : ''}"><td data-label="${esc(t('m.colHost'))}"><strong>${esc(name)}</strong><div class="muted small">${esc(i.platform ? t('m.platformBillT') : h.objectNo)}</div></td><td data-label="${esc(t('h.colPeriod'))}">${esc(fmonth(i.period))}</td><td data-label="${esc(t('h.invCharge'))}">${esc(num(a.chargeable))}</td><td data-label="${esc(t('h.invTotal'))}">${esc(chf(a.total))}</td><td data-label="${esc(t('h.colStatus'))}">${statusChip(i.status)}</td><td class="td-act">${i.status === 'overdue' ? `<button class="btn btn-secondary btn-sm" data-action="m.remindPay" data-arg="${i.id}">${icon('send', 16)} ${esc(t('m.dunning'))}</button>` : ''}</td></tr>`; }).join('')}
    </tbody></table></section>
    <p class="muted small">${icon('zap', 14)} ${esc(t('m.invNote'))}</p>`,
  };
}

function alerts() {
  const actions = { platform: 'm.contact', overdue: 'm.dunningA', anomaly: 'm.ask', dispute: 'm.decide' };
  const list = state.alerts.slice().sort((x, y) => (x.status === 'done') - (y.status === 'done'));
  return {
    title: t('m.alertsTitle'),
    sub: t('m.alertsSub'),
    body: `<div class="alerts">${list.map((a) => `<article class="card alert-card ${a.status === 'done' ? 'is-done' : ''}">
      <div class="alert-top"><h3>${esc(t(`al.${a.type}.title`))}</h3>${a.status === 'done' ? statusChip('done') : ''}</div>
      <p>${esc(t(`al.${a.type}.text`))}</p>
      ${a.status === 'done' ? `<p class="ok-txt">${esc(t(`al.${a.type}.doneT`))}</p>` : `<div class="alert-foot"><div class="btn-row"><button class="btn btn-primary btn-sm" data-action="m.resolve" data-arg="${a.id}">${esc(t(actions[a.type]))}</button><button class="btn btn-ghost btn-sm" data-action="m.dismiss" data-arg="${a.id}">${esc(t('m.dismiss'))}</button></div><span class="muted small">${esc(t(`al.${a.type}.src`))}</span></div>`}
    </article>`).join('')}</div>`,
  };
}

function hostsView() {
  const q = (state.ui.muniQ || '').toLowerCase();
  const list = state.hosts.filter((h) => !q || `${h.name} ${h.address} ${h.objectNo}`.toLowerCase().includes(q));
  return {
    title: t('m.hostsTitle'),
    sub: t('m.hostsSub'),
    body: `<div class="toolbar"><label class="search">${icon('search', 18)}<input type="search" value="${esc(state.ui.muniQ || '')}" placeholder="${esc(t('m.searchPh'))}" data-input="muniQ" aria-label="${esc(t('common.search'))}"></label>${chip('info', t('m.registerNote'), 'database')}</div>
    <section class="card p0"><table class="tbl"><thead><tr><th>${esc(t('m.colHost'))}</th><th>${esc(t('h.category'))}</th><th>${esc(t('h.capacity'))}</th><th>${esc(t('m.colChannel'))}</th></tr></thead><tbody>
    ${list.map((h) => `<tr><td data-label="${esc(t('m.colHost'))}"><strong>${esc(h.name)}</strong><div class="muted small">${esc(h.address)} · <span class="mono">${esc(h.objectNo)}</span></div></td><td data-label="${esc(t('h.category'))}">${esc(t('cat.' + h.cat))}</td><td data-label="${esc(t('h.capacity'))}">${esc(t('h.capacityV', { r: h.rooms, b: h.beds }))}</td><td data-label="${esc(t('m.colChannel'))}">${h.pms ? chip('ok', t('h.pms'), 'link') : chip('neutral', t('h.webapp'), 'phone')}</td></tr>`).join('')}
    </tbody></table></section>`,
  };
}

function tariffs() {
  const k = TARIFFS.kurtaxe;
  const row = (key, v, editable) => `<tr><td data-label="${esc(t('m.colType'))}">${esc(t(key))}</td><td data-label="${esc(t('m.colRate'))}">${editable ? `<div class="input-chf"><span>CHF</span><input type="number" step="0.10" min="0.40" max="4" value="${v.toFixed(2)}" aria-label="${esc(t(key))}" data-action="noop"></div>` : `<strong>CHF ${v.toFixed(2)}</strong> ${chip('neutral', t('m.byCanton'), 'lock')}`}</td></tr>`;
  return {
    title: t('m.tarTitle'),
    sub: t('m.tarSub'),
    actions: `<button class="btn btn-primary" data-action="toastOk" data-arg="${esc(t('m.tarSaved'))}">${icon('check', 18)} ${esc(t('m.tarSave'))}</button>`,
    body: `<div class="note">${icon('info', 18)}<span>${esc(t('m.tarNote'))}</span></div>
    <div class="grid-2 gap"><section class="card p0"><div class="card-head pad"><h2>${esc(t('m.kurtaxe'))}</h2></div><table class="tbl"><thead><tr><th>${esc(t('m.colType'))}</th><th>${esc(t('m.colRate'))}</th></tr></thead><tbody>
      ${row('cat.hotel45', k.hotel45, true)}${row('cat.hotel13', k.hotel13, true)}${row('cat.pension', k.pension, true)}${row('cat.fewo', k.fewo, true)}
    </tbody></table></section>
    <section class="card p0"><div class="card-head pad"><h2>${esc(t('m.levies'))}</h2></div><table class="tbl"><tbody>
      ${row('m.oertlich', TARIFFS.oertlich, true)}${row('m.kantonal', TARIFFS.kantonal, false)}
      <tr><td>${esc(t('m.pauschale'))}</td><td><div class="input-chf"><span>CHF</span><input type="number" value="${TARIFFS.pauschale}" aria-label="${esc(t('m.pauschale'))}" data-action="noop"></div><div class="muted small">${esc(t('m.pauschaleT'))}</div></td></tr>
    </tbody></table></section></div>
    <section class="card"><div class="card-head"><h2>${esc(t('m.exemptions'))}</h2></div>
      ${toggle('e1', t('m.ex1'), true)}${toggle('e2', t('m.ex2'), true)}${toggle('e3', t('m.ex3'), true)}${toggle('e4', t('m.ex4'), true)}
      <p class="muted small">${esc(t('m.exNote'))}</p></section>`,
  };
}

function distribution() {
  const list = oct().filter((i) => i.status === 'paid');
  const s = list.reduce((acc, i) => { const a = invoiceAmounts(i); acc.k += a.kurtaxe; acc.o += a.oertlich; acc.c += a.kantonal; return acc; }, { k: 0, o: 0, c: 0 });
  const tot = s.k + s.o + s.c;
  const seg = (v, cls) => `<div class="seg ${cls}" style="width:${(v / tot) * 100}%"></div>`;
  return {
    title: t('m.distTitle'),
    sub: t('m.distSub'),
    body: `<section class="card"><div class="card-head"><h2>${esc(t('m.distOct'))}</h2>${chip('info', t('m.distAuto'), 'zap')}</div>
      <div class="big-num">${esc(chf(tot))}</div><p class="muted">${esc(t('m.distPaidOnly', { n: list.length }))}</p>
      <div class="stackbar">${seg(s.k, 'seg-1')}${seg(s.o, 'seg-2')}${seg(s.c, 'seg-3')}</div>
      <ul class="legend">
        <li><span class="sw seg-1"></span><div><strong>${esc(t('m.toMuni'))}</strong><span class="muted">${esc(t('m.toMuniT'))}</span></div><strong>${esc(chf(s.k))}</strong></li>
        <li><span class="sw seg-2"></span><div><strong>${esc(t('m.toTO'))}</strong><span class="muted">${esc(t('m.toTOT'))}</span></div><strong>${esc(chf(s.o))}</strong></li>
        <li><span class="sw seg-3"></span><div><strong>${esc(t('m.toCanton'))}</strong><span class="muted">${esc(t('m.toCantonT'))}</span></div><strong>${esc(chf(s.c))}</strong></li>
      </ul>
      <p class="muted small">${esc(t('m.distNote'))}</p></section>`,
  };
}

function account() {
  return {
    title: t('acc.title'),
    sub: t('m.accSub'),
    body: `<div class="grid-2 gap">
      <section class="card"><div class="card-head"><h2>${esc(t('acc.org'))}</h2></div><dl class="dl"><dt>${esc(t('acc.org'))}</dt><dd>${esc(t('m.orgName'))}</dd><dt>${esc(t('m.delegation'))}</dt><dd>${esc(t('m.delegationV'))}</dd><dt>${esc(t('acc.login'))}</dt><dd>${icon('key', 15)} AGOV</dd></dl></section>
      <section class="card"><div class="card-head"><h2>${esc(t('acc.users'))}</h2></div><ul class="rows"><li><div><strong>Monika Achermann</strong><span class="muted">${esc(t('m.roleLead'))}</span></div>${chip('ok', t('acc.active'))}</li><li><div><strong>Jonas Bühler</strong><span class="muted">${esc(t('m.roleClerk'))}</span></div>${chip('ok', t('acc.active'))}</li></ul></section>
      <section class="card"><div class="card-head"><h2>${esc(t('acc.payment'))}</h2></div><dl class="dl"><dt>IBAN</dt><dd class="mono">CH44 0900 0000 6000 1234 5</dd><dt>${esc(t('m.reglement'))}</dt><dd>${esc(t('m.reglementV'))}</dd></dl></section>
      <section class="card"><div class="card-head"><h2>${esc(t('acc.notif'))}</h2></div>${toggle('m1', t('m.n1'), true)}${toggle('m2', t('m.n2'), true)}</section>
    </div>`,
  };
}

export const muniActions = {
  'm.resolve': (id) => {
    const a = state.alerts.find((x) => x.id === id);
    if (a.type === 'dispute') {
      openDrawer(`<form class="stack" data-submit="m.decideSave" data-arg="${id}"><p>${esc(t('al.dispute.text'))}</p>${field('decision', t('m.decision'), { options: [['ok', t('m.decOk')], ['partial', t('m.decPartial')], ['reject', t('m.decReject')]] })}${field('reason', t('m.reason'), { type: 'textarea', value: t('m.reasonV'), required: true })}<p class="muted small">${esc(t('m.decNote'))}</p><button class="btn btn-primary btn-block" type="submit">${icon('check', 18)} ${esc(t('m.decSave'))}</button></form>`, t('al.dispute.title'));
      return;
    }
    update(() => { a.status = 'done'; feed('feed.alert', { title: t(`al.${a.type}.title`) }); });
    toast(t(`al.${a.type}.doneT`), 'ok');
  },
  'm.decideSave': (id) => { update(() => { state.alerts.find((x) => x.id === id).status = 'done'; feed('feed.alert', { title: t('al.dispute.title') }); }); closeDrawer(); toast(t('al.dispute.doneT'), 'ok'); },
  'm.dismiss': (id) => { update(() => { state.alerts.find((x) => x.id === id).status = 'done'; }); toast(t('m.dismissed'), 'info'); },
  'm.remindPay': (id) => { update(() => { const a = state.alerts.find((x) => x.type === 'overdue'); if (a) a.status = 'done'; feed('feed.dunning', { host: host(state.invoices.find((i) => i.id === id).host).name }); }); toast(t('al.overdue.doneT'), 'ok'); },
};
