// Entwicklung seit 1.1.2020 (Monatswerte bis 16.11.2026) für Kanton und Stadt Luzern.
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, num, delta } from '../ui.js';
import { YEARS, TODAY, monthsOf } from '../timeseries.js';
import { cantonItems } from './map.js';

const KANTONAL = 1.10;
const sum = (a) => a.reduce((x, y) => x + y, 0);

// Monatsreihe aller Jahre (Personen-Logiernächte) für den Kanton oder die Stadt
export function historySeries(scope) {
  const items = cantonItems('muni');
  const use = scope === 'canton' ? items : items.filter((g) => g.id === 'luzern');
  return YEARS.map((y) => {
    const n = monthsOf(y);
    const months = Array.from({ length: n }, (_, i) => use.reduce((s, g) => s + g.at(y)[i], 0));
    return { year: y, months };
  });
}

const mname = (y, i, lang) => new Intl.DateTimeFormat(lang, { month: 'short', year: 'numeric' }).format(new Date(y, i, 15));

export function historyCard(scope, lang) {
  const canton = scope === 'canton';
  const ser = historySeries(scope);
  const flat = ser.flatMap((s) => s.months.map((v, i) => ({ y: s.year, i, v })));
  const max = Math.max(...flat.map((p) => p.v)) * 1.05;
  const bars = flat.map((p) => `<div class="hist-col" title="${esc(mname(p.y, p.i, lang))}: ${esc(num(Math.round(p.v / 1000)))} ${esc(t('map.thou'))}"><div class="hist-bar ${p.y === TODAY.year && p.i === TODAY.month ? 'is-part' : ''} ${p.y === 2020 && p.i >= 2 || p.y === 2021 && p.i < 5 ? 'is-covid' : ''}" style="height:${(p.v / max) * 100}%"></div>${p.i === 0 ? `<span class="hist-yr">${p.y}</span>` : ''}</div>`).join('');
  const totals = ser.map((s) => ({ y: s.year, n: sum(s.months) }));
  const rows = totals.map((r, k) => {
    const prev = k ? totals[k - 1].n : null;
    const label = r.y === TODAY.year ? `${r.y} ${t('map.untilToday')}` : String(r.y);
    return `<tr><td data-label="${esc(t('map.year'))}"><strong>${esc(label)}</strong></td><td data-label="${esc(t('map.nights'))}">${esc((r.n / 1e6).toFixed(2))} ${esc(t('map.mio'))}</td>${canton ? `<td data-label="${esc(t('map.levyK'))}">CHF ${esc((r.n * KANTONAL / 1e6).toFixed(2))} ${esc(t('map.mio'))}</td>` : ''}<td data-label="${esc(t('ins.hVsPrev'))}">${prev && r.y !== TODAY.year ? delta(r.n, prev, '') : prev ? '<span class="muted">' + esc(t('ins.hPartial')) + '</span>' : '–'}</td></tr>`;
  }).join('');
  return `<section class="card"><div class="card-head"><h2>${icon('chart', 20)} ${esc(t('ins.hTitle'))}</h2></div>
    <p class="muted small">${esc(t(canton ? 'ins.hLeadC' : 'ins.hLeadM'))}</p>
    <div class="hist" role="img" aria-label="${esc(t('ins.hTitle'))}">${bars}</div>
    <p class="muted small"><span class="hist-key"></span> ${esc(t('ins.hCovid'))} · <span class="hist-key is-part"></span> ${esc(t('ins.hPart'))}</p>
    <table class="tbl hist-tbl"><thead><tr><th>${esc(t('map.year'))}</th><th>${esc(t('map.nights'))}</th>${canton ? `<th>${esc(t('map.levyK'))}</th>` : ''}<th>${esc(t('ins.hVsPrev'))}</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}
