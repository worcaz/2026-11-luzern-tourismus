import { state, update, invoiceAmounts } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, chf, kpi, chip, barChart, hbars } from '../ui.js';
import { CANTON_REGIONS } from '../data.js';

export function cantonNext() {
  return { title: t('k.next'), text: t('k.nextT'), cta: t('k.toReport'), action: 'toastInfo', arg: t('common.pdfToast'), icon: 'download', calm: true };
}

export function cantonView(tab, lang) {
  if (!state.ui.cantonVisited) update(() => { state.ui.cantonVisited = true; }, { silent: true });
  if (tab === 'konto') return account();
  const inv = state.invoices.find((i) => i.id === 'R-2026-10-H1');
  const extra = inv.status === 'paid' ? invoiceAmounts(inv).kantonal : 0;
  const months = Array.from({ length: 10 }, (_, i) => new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(2026, i, 15)));
  const levy = [101, 106, 124, 149, 178, 204, 239, 243, 210, 174];
  const ytd = 2079000 + extra;
  return {
    title: t('k.title'),
    sub: t('k.sub'),
    next: cantonNext(),
    body: `<div class="note note-lock">${icon('lock', 18)}<span>${esc(t('k.aggNote'))}</span></div>
    <div class="grid-kpi">
      ${kpi(t('k.kObjects'), '1 942', t('k.kObjectsSub'), 'database')}
      ${kpi(t('k.kNights'), '1.89 Mio.', t('k.kNightsSub'), 'bed')}
      ${kpi(t('k.kDigital'), '87 %', t('k.kDigitalSub'), 'zap', 'kpi-ok')}
      ${kpi(t('k.kLevy'), chf(ytd), t('k.kLevySub'), 'landmark')}
    </div>
    <div class="grid-2 gap">
      <section class="card"><div class="card-head"><h2>${icon('chart', 20)} ${esc(t('k.chart'))}</h2>${chip('neutral', t('common.fictitious'))}</div>${barChart(levy, months, { highlight: 9 })}<p class="muted small">${esc(t('k.chartNote'))}</p></section>
      <section class="card"><div class="card-head"><h2>${icon('map', 20)} ${esc(t('k.regions'))}</h2></div>${hbars(CANTON_REGIONS, { unit: '' })}<p class="muted small">${esc(t('k.regionsNote'))}</p></section>
    </div>
    <div class="grid-3 gap">
      ${kpi(t('k.kPre'), '64 %', t('k.kPreSub'), 'phone')}
      ${kpi(t('k.kStay'), '1.9', t('k.kStaySub'), 'calendar')}
      ${kpi(t('k.kPlatform'), '11 %', t('k.kPlatformSub'), 'globe')}
    </div>
    <section class="card"><div class="card-head"><h2>${icon('download', 20)} ${esc(t('k.reports'))}</h2></div>
      <ul class="rows">${['k.r1', 'k.r2', 'k.r3'].map((k) => `<li><div><strong>${esc(t(k))}</strong><span class="muted">${esc(t(k + 'T'))}</span></div><button class="btn btn-ghost btn-sm" data-action="toastInfo" data-arg="${esc(t('common.pdfToast'))}">${icon('download', 16)} ${esc(t('common.download'))}</button></li>`).join('')}</ul></section>`,
  };
}

function account() {
  return {
    title: t('acc.title'),
    sub: t('k.accSub'),
    body: `<div class="grid-2 gap"><section class="card"><div class="card-head"><h2>${icon('landmark', 20)} ${esc(t('acc.org'))}</h2></div><dl class="dl"><dt>${esc(t('acc.org'))}</dt><dd>${esc(t('k.orgV'))}</dd><dt>${esc(t('acc.role'))}</dt><dd>${esc(t('k.roleV'))}</dd><dt>${esc(t('acc.login'))}</dt><dd>${icon('key', 15)} AGOV</dd></dl></section>
    <section class="card"><div class="card-head"><h2>${icon('lock', 20)} ${esc(t('k.rights'))}</h2></div><ul class="ticks"><li>${esc(t('k.ri1'))}</li><li>${esc(t('k.ri2'))}</li></ul><ul class="crosses"><li>${esc(t('k.ri3'))}</li></ul></section></div>`,
  };
}
