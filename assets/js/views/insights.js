// Analysen: Prognose, Herkunft der Gäste, Aufenthaltsdauer und Auslastung (Kanton und Gemeinde).
import { state, update } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, num, kpi, delta, barChart } from '../ui.js';
import { MUNIS, REGIONS, REGION_YOY, MONTH_COUNT } from '../geo.js';
import { MUNI_MONTHS, MUNI_MONTHS_PY } from '../data.js';
import { cantonItems } from './map.js';

const KANTONAL = 1.10;
const CITY_RATE = 3.6; // Ø Abgaben je Logiernacht Stadt Luzern (Schätzung)
const PY_ND = [84.5, 98.9]; // Vorjahr Nov/Dez (Tsd., fiktiv), Saisonkurve für die Prognose
const sum = (a) => a.reduce((x, y) => x + y, 0);

// ---------- Reihen ----------
// Logiernächte je Monat (absolut) und Vorjahr für den Kanton
export function cantonSeries() {
  const items = cantonItems('muni');
  const nights = Array.from({ length: MONTH_COUNT }, (_, i) => sum(items.map((g) => g.monthly[i])));
  const py = Array.from({ length: MONTH_COUNT }, (_, i) => sum(items.map((g) => g.monthly[i] / (1 + REGION_YOY[g.r]))));
  return { nights, py };
}
export function citySeries() {
  return { nights: MUNI_MONTHS.map((v) => v * 1000), py: MUNI_MONTHS_PY.map((v) => v * 1000) };
}
const series = (scope) => (scope === 'canton' ? cantonSeries() : citySeries());

function forecast(ser) {
  const ytd = sum(ser.nights);
  const pyYtd = sum(ser.py);
  const pyBase = sum(MUNI_MONTHS_PY);
  const nd = PY_ND.map((v) => ytd * (v / pyBase));
  const pyND = PY_ND.map((v) => pyYtd * (v / pyBase));
  return { ytd, pyYtd, nd, pyND, total: ytd + sum(nd), pyTotal: pyYtd + sum(pyND) };
}

const mName = (i, lang) => new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(2026, i, 15));
const mio = (v) => `CHF ${(v / 1e6).toFixed(2)} ${t('map.mio')}`;

// ---------- Prognose ----------
function forecastCard(scope, lang) {
  const canton = scope === 'canton';
  const ser = series(scope);
  const f = forecast(ser);
  const rate = canton ? KANTONAL : CITY_RATE;
  const levy = [...ser.nights, ...f.nd].map((n) => Math.round((n * rate) / 1000));
  const py = [...ser.py, ...f.pyND].map((n) => Math.round((n * rate) / 1000));
  const total = f.total * rate;
  const labels = Array.from({ length: 12 }, (_, i) => mName(i, lang));
  const lo = total * 0.96;
  const hi = total * 1.04;
  return `<section class="card"><div class="card-head"><h2>${icon('chart', 20)} ${esc(t(canton ? 'ins.fcTitleC' : 'ins.fcTitleM'))}</h2></div>
    <div class="grid-3 gap">
      ${kpi(t('ins.fcEnd'), mio(total), t('ins.fcRange', { a: (lo / 1e6).toFixed(2), b: (hi / 1e6).toFixed(2) }), '', '', delta(f.total, f.pyTotal, t('m.vsYear')))}
      ${kpi(t('ins.fcSoFar'), mio(f.ytd * rate), t('ins.fcSoFarSub'))}
      ${kpi(t('ins.fcRest'), mio(sum(f.nd) * rate), t('ins.fcRestSub'))}
    </div>
    ${barChart(levy, labels, { height: 190, compare: py, highlight: [], ghost: [10, 11] })}
    <p class="muted small"><span class="cmp-key"></span> ${esc(t('m.legendPY'))} · <span class="ghost-key"></span> ${esc(t('ins.fcLegend'))}</p>
    <p class="muted small">${esc(t(canton ? 'ins.fcNoteC' : 'ins.fcNoteM'))}</p></section>`;
}

// ---------- Herkunft ----------
const ORIGINS = ['ch', 'de', 'us', 'asia', 'eu', 'oth'];
const MIX = { R1: [22, 14, 17, 17, 18, 12], R2: [58, 20, 3, 3, 12, 4], R3: [60, 19, 3, 3, 11, 4], R4: [66, 16, 2, 2, 11, 3], R5: [64, 20, 2, 2, 9, 3], CITY: [20, 13, 19, 19, 18, 11] };
const SEASON = [[1.25, 1.1, 0.8, 0.7, 1, 0.9], [0.95, 1, 1.05, 1.1, 1, 1], [0.8, 0.95, 1.25, 1.3, 1.05, 1.1], [1.1, 1.05, 1, 0.9, 1, 1]];
const QUARTERS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]];
const norm = (a) => { const s = sum(a); return a.map((v) => (v / s) * 100); };

function regionNights(months) {
  const out = {};
  cantonItems('muni').forEach((g) => { out[g.r] = (out[g.r] || 0) + months.reduce((s, i) => s + g.monthly[i], 0); });
  return out;
}

function originRows(scope) {
  return QUARTERS.map((months, q) => {
    let mix;
    if (scope === 'canton') {
      const rn = regionNights(months);
      mix = Array(ORIGINS.length).fill(0);
      Object.keys(rn).forEach((r) => { const p = norm(MIX[r].map((v, i) => v * SEASON[q][i])); p.forEach((v, i) => { mix[i] += v * rn[r]; }); });
      mix = norm(mix);
    } else mix = norm(MIX.CITY.map((v, i) => v * SEASON[q][i]));
    return mix;
  });
}

function stack(vals) {
  const r = vals.map((v) => Math.round(v));
  r[0] += 100 - sum(r);
  return `<div class="ostack" role="img" aria-label="${esc(ORIGINS.map((k, i) => `${t('ins.o.' + k)} ${r[i]} %`).join(', '))}">${r.map((v, i) => `<span class="o-${ORIGINS[i]}" style="width:${v}%">${v >= 7 ? v : ''}</span>`).join('')}</div>`;
}

function originCard(scope, lang) {
  const canton = scope === 'canton';
  const rows = originRows(scope);
  const qLabel = (q) => [`${mName(0, lang)}–${mName(2, lang)}`, `${mName(3, lang)}–${mName(5, lang)}`, `${mName(6, lang)}–${mName(8, lang)}`, mName(9, lang)][q];
  const all = norm(ORIGINS.map((_, i) => sum(rows.map((r) => r[i]))));
  const legend = ORIGINS.map((k) => `<span class="olg"><i class="o-${k}"></i>${esc(t('ins.o.' + k))}</span>`).join('');
  const regionRows = canton ? REGIONS.map((r) => `<div class="orow"><div class="orow-l">${esc(r.name)}</div>${stack(norm(MIX[r.id]))}</div>`).join('') : '';
  return `<section class="card"><div class="card-head"><h2>${icon('globe', 20)} ${esc(t('ins.originTitle'))}</h2></div>
    <p class="muted">${esc(t('ins.originLead', { p: Math.round(100 - all[0]) }))}</p>
    <div class="olegend">${legend}</div>
    <h3 class="map-sub">${esc(t('ins.bySeason'))}</h3>
    <div class="oblock">${rows.map((r, q) => `<div class="orow"><div class="orow-l">${esc(qLabel(q))}</div>${stack(r)}</div>`).join('')}</div>
    ${canton ? `<h3 class="map-sub">${esc(t('ins.byRegion'))}</h3><div class="oblock">${regionRows}</div>` : ''}
    <p class="muted small">${esc(t('ins.originNote'))}</p></section>`;
}

// ---------- Aufenthaltsdauer und Auslastung ----------
const BASE = { city: [0.58, 2.0], lake: [0.46, 2.6], rural: [0.33, 1.9], alpine: [0.38, 3.6] };
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
function muniStats() {
  return MUNIS.map((g) => {
    const h = hash(g.id);
    const [o, st] = BASE[g.p];
    const occ = o + ((h % 9) - 4) / 100;
    const stay = Math.max(1.4, st + (((h >> 3) % 7) - 3) / 10);
    const nights = g.n * 1000;
    return { id: g.id, name: g.name, r: g.r, nights, stay, beds: nights / (304 * occ) };
  });
}
function aggregate(list) {
  const nights = sum(list.map((x) => x.nights));
  return { nights, stay: sum(list.map((x) => x.stay * x.nights)) / nights, occ: nights / (sum(list.map((x) => x.beds)) * 304) };
}

function statRow(name, nights, stay, occ, max) {
  return `<tr><td data-label="">${esc(name)}</td><td data-label="${esc(t('map.nights'))}">${esc(num(Math.round(nights / 1000)))} ${esc(t('map.thou'))}</td><td data-label="${esc(t('ins.stay'))}"><strong>${stay.toFixed(1)}</strong></td><td data-label="${esc(t('ins.occ'))}"><div class="occ"><span class="occ-bar"><span style="width:${(occ / max) * 100}%"></span></span><strong>${Math.round(occ * 100)} %</strong></div></td></tr>`;
}

function stayCard(scope) {
  const canton = scope === 'canton';
  const level = (state.ui.ana || {}).level || 'region';
  let body;
  const head = (first) => `<thead><tr><th>${esc(first)}</th><th>${esc(t('map.nights'))}</th><th>${esc(t('ins.stay'))}</th><th>${esc(t('ins.occ'))}</th></tr></thead>`;
  if (canton) {
    const ms = muniStats();
    const rows = (level === 'region'
      ? REGIONS.map((r) => ({ name: r.name, ...aggregate(ms.filter((m) => m.r === r.id)) }))
      : ms.map((m) => ({ name: m.name, nights: m.nights, stay: m.stay, occ: m.nights / (m.beds * 304) }))).sort((a, b) => b.nights - a.nights);
    const max = Math.max(...rows.map((r) => r.occ));
    const tot = aggregate(ms);
    body = `<table class="tbl">${head(t(level === 'region' ? 'map.region' : 'map.muni'))}<tbody>${rows.map((r) => statRow(r.name, r.nights, r.stay, r.occ, max)).join('')}</tbody><tfoot>${statRow(t('map.allC'), tot.nights, tot.stay, tot.occ, max).replace('<tr>', '<tr class="tr-total">')}</tfoot></table>`;
  } else {
    const cats = [['hotel45', 2.1, 0.74, 0.34], ['hotel13', 1.9, 0.68, 0.24], ['pension', 2.5, 0.52, 0.12], ['fewo', 4.2, 0.45, 0.30]];
    const total = sum(MUNI_MONTHS) * 1000;
    body = `<table class="tbl">${head(t('h.category'))}<tbody>${cats.map(([k, st, oc, sh]) => statRow(t('cat.' + k), total * sh, st, oc, 0.8)).join('')}</tbody><tfoot>${statRow(t('ins.cityAll'), total, 2.2, 0.59, 0.8).replace('<tr>', '<tr class="tr-total">')}</tfoot></table>`;
  }
  const toggle = canton ? `<div class="sgc" role="group">${[['region', t('map.region')], ['muni', t('map.muni')]].map(([v, l]) => `<button type="button" class="sgc-b ${v === level ? 'is-on' : ''}" aria-pressed="${v === level}" data-action="ana.level" data-arg="${v}">${esc(l)}</button>`).join('')}</div>` : '';
  return `<section class="card p0"><div class="card-head pad"><h2>${icon('bed', 20)} ${esc(t('ins.stayTitle'))}</h2>${toggle}</div>
    <div class="pad-x"><p class="muted small">${esc(t('ins.stayLead'))}</p></div>${body}</section>`;
}

// ---------- Seite ----------
export function insightsPage(scope, lang) {
  const canton = scope === 'canton';
  return { title: t('ins.title'), sub: t(canton ? 'ins.subC' : 'ins.subM'), body: `${forecastCard(scope, lang)}${originCard(scope, lang)}${stayCard(scope)}` };
}

export const insightsActions = {
  'ana.level': (v) => update((s) => { s.ui.ana = { ...(s.ui.ana || {}), level: v }; }),
};
