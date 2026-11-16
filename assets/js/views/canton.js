import { state, update, invoiceAmounts } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, num, chf, kpi, chip, barChart, delta } from '../ui.js';
import { CANTON_REGIONS } from '../data.js';
import { REGION_YOY } from '../geo.js';
import { insightsPage, cantonSeries } from './insights.js';
import { cantonItems } from './map.js';
import { staysPage, staysTeaser } from './stays.js';
import { historyCard } from './history.js';
import { mapPage, mapTeaser } from './map.js';

export function cantonNext() {
  return { title: t('k.next'), text: t('k.nextT'), cta: t('k.toReport'), action: 'toastInfo', arg: t('common.pdfToast'), icon: 'download', calm: true };
}

export function cantonView(tab, lang) {
  if (!state.ui.cantonVisited) update(() => { state.ui.cantonVisited = true; }, { silent: true });
  if (tab === 'konto') return account();
  if (tab === 'unterkuenfte') return staysPage();
  if (tab === 'analyse') return insightsPage('canton', lang);
  if (tab === 'karte') return mapPage('canton', lang);
  const inv = state.invoices.find((i) => i.id === 'R-2026-10-H1');
  const extra = inv.status === 'paid' ? invoiceAmounts(inv).kantonal : 0;
  const months = Array.from({ length: 10 }, (_, i) => new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(2026, i, 15)));
  const ser = cantonSeries();
  const levy = ser.nights.map((n) => Math.round((n * 1.10) / 1000));
  const levyPY = ser.py.map((n) => Math.round((n * 1.10) / 1000));
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const ytd = ser.nights.reduce((x, y) => x + y, 0) * 1.10 + extra;
  const dNights = delta(sum(ser.nights), sum(ser.py), t('m.vsYear')) + delta(ser.nights[9], ser.nights[8], t('m.vsPrev'));
  const dLevy = delta(sum(ser.nights), sum(ser.py), t('m.vsYear')) + delta(levy[9], levy[8], t('m.vsPrev'));
  const regItems = cantonItems('region');
  const regionRows = regItems.map((r, i) => ({ name: r.name, v: Math.round(r.monthly.reduce((a, b) => a + b, 0) / 1000), g: REGION_YOY['R' + (i + 1)] }));
  const rmax = Math.max(...regionRows.map((r) => r.v));
  const regions = `<div class="hbars">${regionRows.map((r) => `<div class="hbar-row hbar-d"><div class="hbar-lbl">${esc(r.name)}</div><div class="hbar-track"><div class="hbar" style="width:${(r.v / rmax) * 100}%"></div></div><div class="hbar-val">${esc(num(r.v))}</div><div class="hbar-delta ${r.g >= 0 ? 'delta-up' : 'delta-down'}"><b>${r.g >= 0 ? '▲' : '▼'} ${Math.abs(r.g * 100).toFixed(1)} %</b></div></div>`).join('')}</div><p class="muted small">${esc(t('k.regionsPY'))}</p>`;
  return {
    title: t('k.title'),
    sub: t('k.sub'),
    next: cantonNext(),
    body: `<div class="grid-3 gap">
      ${kpi(t('k.kNights'), (ser.nights.reduce((x, y) => x + y, 0) / 1e6).toFixed(2) + ' Mio.', t('k.kNightsSub'), '', '', dNights)}
      ${kpi(t('k.kLevy'), 'CHF ' + (ytd / 1e6).toFixed(2) + ' Mio.', t('k.kLevySub'), '', '', dLevy)}
      ${kpi(t('k.kDigital'), '87 %', t('k.kDigitalSub'))}
    </div>
    <div class="grid-2 gap">
      <section class="card"><div class="card-head"><h2>${esc(t('k.chart'))}</h2></div>${barChart(levy, months, { highlight: 9, compare: levyPY })}<p class="muted small"><span class="cmp-key"></span> ${esc(t('m.legendPY'))} · ${esc(t('k.chartNote'))}</p></section>
      <section class="card"><div class="card-head"><h2>${esc(t('k.regions'))}</h2></div>${regions}</section>
    </div>
    ${historyCard('canton', lang)}
    ${mapTeaser('canton', lang)}
    ${staysTeaser()}
    <section class="card"><div class="card-head"><h2>${esc(t('k.reports'))}</h2></div>
      <ul class="rows">${['k.r2', 'k.r3'].map((k) => `<li><div><strong>${esc(t(k))}</strong><span class="muted">${esc(t(k + 'T'))}</span></div><button class="btn btn-ghost btn-sm" data-action="toastInfo" data-arg="${esc(t('common.pdfToast'))}">${esc(t('common.download'))}</button></li>`).join('')}</ul></section>
    <p class="muted small foot-note">${icon('lock', 14)} ${esc(t('k.aggNote'))}</p>`,
  };
}

function account() {
  return {
    title: t('acc.title'),
    sub: t('k.accSub'),
    body: `<div class="grid-2 gap"><section class="card"><div class="card-head"><h2>${esc(t('acc.org'))}</h2></div><dl class="dl"><dt>${esc(t('acc.org'))}</dt><dd>${esc(t('k.orgV'))}</dd><dt>${esc(t('acc.role'))}</dt><dd>${esc(t('k.roleV'))}</dd><dt>${esc(t('acc.login'))}</dt><dd>${icon('key', 15)} AGOV</dd></dl></section>
    <section class="card"><div class="card-head"><h2>${esc(t('k.rights'))}</h2></div><ul class="ticks"><li>${esc(t('k.ri1'))}</li><li>${esc(t('k.ri2'))}</li></ul><ul class="crosses"><li>${esc(t('k.ri3'))}</li></ul></section></div>`,
  };
}
