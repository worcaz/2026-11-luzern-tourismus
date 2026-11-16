// Kartenansicht: gleiche Komponente für Kanton (aggregiert) und Gemeinde (pro Betrieb, georeferenziert).
import { state, update, rateFor } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, num, chip, barChart } from '../ui.js';
import { TARIFFS } from '../data.js';
import { listingStats, listingModel, cityListing, asHost } from '../listing.js';
import { YEARS, TODAY, year12, monthsOf, priceFactor } from '../timeseries.js';
import { geodata, geomPath, centroid, gemName } from '../geodata.js';
import { REGION_YOY, ALERT_LOC, UNREG_GEO, MONTH_COUNT, REGIONS, MUNIS, K_VIEW, K_SHAPES, kProj, S_VIEW, sShapes, S_LABELS, sProj, HOST_GEO, HOST_OCT, profile, profileRaw } from '../geo.js';

const DEFAULTS = { metric: 'levy', level: 'muni', pt: 'year', pi: 0, sel: null, alerts: true, zoom: 'center', year: 2026 };
const mst = (scope) => ({ ...DEFAULTS, ...((state.ui.map || {})[scope] || {}) });
const setM = (scope, patch) => update((s) => { s.ui.map = s.ui.map || {}; s.ui.map[scope] = { ...DEFAULTS, ...(s.ui.map[scope] || {}), ...patch }; });

// ---------- Zeitfilter ----------
const yearOf = (m) => m.year || TODAY.year;
function mask(m) {
  const n = monthsOf(yearOf(m));
  if (m.pt === 'month') return [Math.min(m.pi, n - 1)];
  if (m.pt === 'quarter') { const q = Math.min(m.pi, 3); return [0, 1, 2].map((i) => q * 3 + i).filter((i) => i < n); }
  return Array.from({ length: n }, (_, i) => i);
}
const monthName = (i, lang) => new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2026, i, 15));
const monthShort = (i, lang) => new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(2026, i, 15));
function periodOptions(m, lang) {
  const y = yearOf(m); const now = y === TODAY.year;
  if (m.pt === 'month') return Array.from({ length: monthsOf(y) }, (_, i) => [i, `${monthName(i, lang)} ${y}${now && i === TODAY.month ? ' ' + t('map.untilToday') : ''}`]);
  if (m.pt === 'quarter') return [0, 1, 2, 3].map((q) => [q, `Q${q + 1} ${y}${now && q === 3 ? ' ' + t('map.untilToday') : ''}`]);
  return [[0, now ? `${y} ${t('map.untilToday')}` : String(y)]];
}
function periodLabel(m, lang) { const o = periodOptions(m, lang).find(([v]) => v === (m.pt === 'year' ? 0 : m.pi)); return o ? o[1] : ''; }

// ---------- Daten ----------
const KANTONAL = TARIFFS.kantonal;
const PPN = { hotel45: 150, hotel13: 95, pension: 70, fewo: 60 }; // Annahme: CHF je Person und Nacht, falls kein Preis bekannt

const COVERAGE = (name) => (name === 'Luzern' ? 0.95 : 0.55); // Anteil der Logiernächte, den das Verzeichnis abdeckt (Annahme)

export function cantonItems(level) {
  const G = geodata();
  const model = listingModel();
  const pos = (g) => { const f = G && G.byName[gemName(g.name)]; const c = f && centroid(f); return c ? { lon: c[0], lat: c[1] } : { lon: g.lon, lat: g.lat }; };
  const base = MUNIS.map((g) => {
    const nm = gemName(g.name);
    const mo = model && model[nm];
    let monthly = profile(g.p).map((s) => g.n * 1000 * s);
    if (mo) { const total = Math.max(g.n * 1000, mo.sum / COVERAGE(nm)); const f = total / mo.sum; monthly = mo.monthly.map((x) => x * f); }
    const gg = REGION_YOY[g.r];
    return { id: g.id, name: g.name, r: g.r, ...pos(g), monthly, modelled: !!mo, at: (y) => year12(monthly, g.p, y, gg) };
  });
  if (level === 'muni') return base;
  return REGIONS.map((r) => {
    const members = base.filter((g) => g.r === r.id);
    const w = members.reduce((a, g) => a + g.monthly.reduce((x, y) => x + y, 0), 0) || 1;
    const lon = G ? members.reduce((a, g) => a + g.lon * g.monthly.reduce((x, y) => x + y, 0), 0) / w : r.lon;
    const lat = G ? members.reduce((a, g) => a + g.lat * g.monthly.reduce((x, y) => x + y, 0), 0) / w : r.lat;
    return { id: r.id, name: r.name, lon, lat, monthly: Array.from({ length: MONTH_COUNT }, (_, i) => members.reduce((s, g) => s + g.monthly[i], 0)), at: (y) => Array.from({ length: 12 }, (_, i) => members.reduce((s, g) => s + g.at(y)[i], 0)), members };
  });
}

export function hostItems() {
  const raw = profileRaw('city');
  const extra = (cityListing() || []).map(asHost);
  return state.hosts.concat(extra).filter((h) => (h.m && h.lon) || (HOST_GEO[h.id] && HOST_OCT[h.id])).map((h) => {
    const geo = HOST_GEO[h.id] || { lon: h.lon, lat: h.lat };
    const rate = rateFor(h.cat).total;
    const monthly = h.m || raw.map((w) => HOST_OCT[h.id] * w / raw[9]);
    const ppn = h.ppn || (h.price ? h.price / 2 : (PPN[h.cat] || 80));
    const g = REGION_YOY.R1;
    return { id: h.id, name: h.name, address: h.address, cat: h.cat, rooms: h.rooms, beds: h.beds, lon: geo.lon, lat: geo.lat, rate, price: h.price || null, ppn, ad: h.ad || null, oc: h.oc || null, rv: h.rv || null, monthly, at: (y) => year12(monthly, 'city', y, g), rvAt: h.rv ? (y) => year12(h.rv, 'city', y, g).map((v) => v * priceFactor(y)) : null };
  });
}

function valueOf(item, months, metric, scope, year = TODAY.year) {
  const ser = item.at ? item.at(year) : item.monthly;
  const nights = months.reduce((s, i) => s + (ser[i] || 0), 0);
  if (metric === 'nights') return nights;
  if (metric === 'rev') return item.rvAt ? months.reduce((a, i) => a + (item.rvAt(year)[i] || 0), 0) : nights * (item.ppn || 0) * priceFactor(year);
  return nights * (scope === 'canton' ? KANTONAL : item.rate);
}

function fmt(v, metric) {
  if (metric === 'levy' || metric === 'rev') {
    if (v >= 1e6) return `CHF ${(v / 1e6).toFixed(2)} ${t('map.mio')}`;
    if (v >= 1e4) return `CHF ${Math.round(v / 1e3)} ${t('map.thou')}`;
    return `CHF ${num(Math.round(v))}`;
  }
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)} ${t('map.mio')}`;
  if (v >= 1e4) return `${(v / 1e3).toFixed(1)} ${t('map.thou')}`;
  return num(Math.round(v));
}

// Offene Auffälligkeiten je Standort
function flagMap() {
  const out = {};
  state.alerts.filter((a) => a.status === 'open').forEach((a) => { const id = ALERT_LOC[a.id]; if (id) out[id] = a; });
  return out;
}
const unregItem = () => ({ id: 'unreg', name: t('map.unreg'), pseudo: true, lon: UNREG_GEO.lon, lat: UNREG_GEO.lat, monthly: Array(MONTH_COUNT).fill(0), rate: 0 });

// ---------- SVG ----------
function svgMap(scope, items, vals, sel, { mini = false, flags = {}, zoom = 'all' } = {}) {
  const canton = scope === 'canton';
  const view = canton ? K_VIEW : S_VIEW;
  const proj = canton ? kProj : sProj(zoom);
  const SS = canton ? null : sShapes(zoom);
  const max = Math.max(...vals, 1);
  const [rmin, rmax] = mini ? (canton ? [2, 13] : [3, 9]) : (canton ? [5, 44] : (zoom === 'center' ? [5, 15] : [4, 12]));
  const pts = items.map((it, i) => ({ it, v: vals[i], r: rmin + (rmax - rmin) * Math.sqrt(vals[i] / max), xy: proj(it.lon, it.lat) })).sort((a, b) => b.r - a.r);
  const G = geodata();
  const selNames = new Set();
  if (G && sel) {
    const hit = items.find((x) => x.id === sel);
    if (hit) (hit.members ? hit.members : [hit]).forEach((g) => selNames.add(gemName(g.name)));
  }
  const withData = new Set(MUNIS.map((g) => gemName(g.name)));
  const gemPaths = G ? G.gemeinden.features.map((f) => `<path class="m-gem ${withData.has(f.properties.name) ? 'has-data' : ''} ${selNames.has(f.properties.name) ? 'is-sel' : ''} ${!canton && f.properties.name === 'Luzern' ? 'is-own' : ''}" d="${geomPath(f.geometry, proj)}"><title>${esc(f.properties.name)}</title></path>`).join('') : '';
  const lakePaths = G ? G.seen.features.map((f) => `<path class="m-water" d="${geomPath(f.geometry, proj)}"/>`).join('') : '';
  const shapes = canton
    ? (G ? `${gemPaths}${lakePaths}` : `<path class="m-land" d="${K_SHAPES.outline}"/>${K_SHAPES.lakes.map((d) => `<path class="m-water" d="${d}"/>`).join('')}`)
    : (G ? `<rect class="m-land" x="0" y="0" width="${view[2]}" height="${view[3]}"/>${gemPaths}${lakePaths}${SS.rivers.map((d) => `<path class="m-river" d="${d}"/>`).join('')}`
         : `<rect class="m-land" x="0" y="0" width="${view[2]}" height="${view[3]}"/><path class="m-water" d="${SS.lake}"/>${SS.rivers.map((d) => `<path class="m-river" d="${d}"/>`).join('')}`);
  const labels = canton || mini ? '' : S_LABELS.map((l) => { const [x, y] = proj(l.lon, l.lat); return `<text class="m-place ${l.lake ? 'm-place-lake' : ''}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${esc(l.name)}</text>`; }).join('');
  const bubbles = pts.map(({ it, v, r, xy: [x, y] }) => {
    const on = sel === it.id;
    const fl = flags[it.id];
    const showLbl = !mini && (on || (canton && r >= 17));
    const lbl = showLbl ? `<text class="m-lbl" x="${x.toFixed(1)}" y="${(y + r + 13).toFixed(1)}">${esc(it.name)}</text>` : '';
    if (mini) return `<circle class="m-pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`;
    const badge = fl ? `<g class="m-badge"><circle cx="${(x + r * 0.72).toFixed(1)}" cy="${(y - r * 0.72).toFixed(1)}" r="7.5"/><text x="${(x + r * 0.72).toFixed(1)}" y="${(y - r * 0.72 + 3.6).toFixed(1)}">!</text></g>` : '';
    return `<g class="m-g ${on ? 'is-sel' : ''} ${fl ? 'is-flag' : ''} ${it.pseudo ? 'is-pseudo' : ''}" role="button" tabindex="0" data-action="map.sel" data-arg="${scope}:${esc(it.id)}" aria-pressed="${on}" aria-label="${esc(`${it.name}: ${fmt(v, mst(scope).metric)}`)}"><title>${esc(it.name)} · ${esc(fmt(v, mst(scope).metric))}</title><circle class="m-pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>${on ? `<circle class="m-ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r + 4).toFixed(1)}"/>` : ''}${badge}${lbl}${showLbl ? '' : `<text class="m-lbl m-lbl-h" x="${x.toFixed(1)}" y="${(y + r + 13).toFixed(1)}">${esc(it.name)}</text>`}</g>`;
  }).join('');
  return `<svg class="map-svg ${mini ? 'map-mini' : ''}" viewBox="${view.join(' ')}" role="${mini ? 'img' : 'group'}" aria-label="${esc(t(canton ? 'map.aria.c' : 'map.aria.m'))}" preserveAspectRatio="xMidYMid meet">${shapes}${labels}${bubbles}</svg>`;
}

// ---------- Bausteine ----------
const seg = (scope, key, cur, opts) => `<div class="sgc" role="group" aria-label="${esc(t('map.' + key))}">${opts.map(([v, l]) => `<button type="button" class="sgc-b ${String(v) === String(cur) ? 'is-on' : ''}" aria-pressed="${String(v) === String(cur)}" data-action="map.${key}" data-arg="${scope}:${v}">${esc(l)}</button>`).join('')}</div>`;

function controls(scope, m, lang) {
  const canton = scope === 'canton';
  const opts = periodOptions(m, lang);
  const sel = m.pt === 'year' ? '' : `<label class="map-select"><span class="sr">${esc(t('map.period'))}</span><select data-change="map.pi" aria-label="${esc(t('map.period'))}">${opts.map(([v, l]) => `<option value="${scope}:${v}" ${v === m.pi ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  return `<div class="map-ctl">
    ${seg(scope, 'metric', m.metric, [['levy', t(canton ? 'map.levyK' : 'map.levyM')], ['nights', t('map.nights')]].concat(canton ? [] : [['rev', t('map.rev')]]))}
    ${canton ? seg(scope, 'level', m.level, [['region', t('map.region')], ['muni', t('map.muni')]]) : ''}
    <label class="map-select"><span class="sr">${esc(t('map.yearSel'))}</span><select data-change="map.year" aria-label="${esc(t('map.yearSel'))}">${YEARS.slice().reverse().map((y) => `<option value="${scope}:${y}" ${y === yearOf(m) ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
    ${seg(scope, 'pt', m.pt, [['month', t('map.month')], ['quarter', t('map.quarter')], ['year', t('map.year')]])}
    ${sel}
    ${canton ? '' : seg(scope, 'zoom', m.zoom, [['center', t('map.zoomC')], ['all', t('map.zoomA')]])}
    ${canton ? '' : `<button type="button" class="tgl ${m.alerts ? 'is-on' : ''}" aria-pressed="${m.alerts}" data-action="map.alerts" data-arg="${scope}:${m.alerts ? 0 : 1}">${icon('alert', 16)} ${esc(t('map.flags'))}</button>`}
  </div>`;
}

function ranking(scope, items, vals, m, flags = {}) {
  const order = items.map((it, i) => ({ it, v: vals[i] })).sort((a, b) => b.v - a.v);
  const max = Math.max(...order.map((o) => o.v), 1);
  const total = order.reduce((s, o) => s + o.v, 0) || 1;
  return `<ol class="rank">${order.map(({ it, v }, i) => `<li><button type="button" class="rank-row ${m.sel === it.id ? 'is-sel' : ''}" data-action="map.sel" data-arg="${scope}:${esc(it.id)}" aria-pressed="${m.sel === it.id}"><span class="rank-n">${i + 1}</span><span class="rank-name">${esc(it.name)}${flags[it.id] ? ` <span class="rank-flag" title="${esc(t('al.' + flags[it.id].type + '.title'))}">!</span>` : ''}</span><span class="rank-bar"><span style="width:${(v / max) * 100}%"></span></span><span class="rank-val">${esc(fmt(v, m.metric))}</span><span class="rank-pct muted">${Math.round((v / total) * 100)} %</span></button></li>`).join('')}</ol>`;
}

function detail(scope, items, m, months, lang, flags = {}) {
  const canton = scope === 'canton';
  const item = items.find((i) => i.id === m.sel);
  const list = item && !item.pseudo ? [item] : items.filter((i) => !i.pseudo);
  const al = item ? flags[item.id] : null;
  const alertBox = al ? `<div class="map-alert">${chip('err', t('al.' + al.type + '.title'), 'alert')}<p class="small">${esc(t('al.' + al.type + '.short'))}</p><a class="link" href="#/gemeinde/auffaelligkeiten">${esc(t('m.toAlerts'))} ${icon('chevronRight', 16)}</a></div>` : '';
  const monthly = Array.from({ length: monthsOf(yearOf(m)) }, (_, i) => list.reduce((s, it) => s + valueOf(it, [i], m.metric, scope, yearOf(m)), 0));
  const div = canton ? 1000 : 1;
  const unit = (m.metric === 'levy' || m.metric === 'rev') ? (canton ? t('map.unitKchf') : 'CHF') : (canton ? t('map.unitKn') : t('map.unitN'));
  const chartVals = monthly.map((v) => (canton ? Math.round((v / div) * 10) / 10 : Math.round(v)));
  const labels = Array.from({ length: monthsOf(yearOf(m)) }, (_, i) => monthShort(i, lang));
  const sumNights = list.reduce((s, it) => s + valueOf(it, months, 'nights', scope, yearOf(m)), 0);
  const sumLevy = list.reduce((s, it) => s + valueOf(it, months, 'levy', scope, yearOf(m)), 0);
  if (item && item.pseudo) {
    return `<div class="map-detail"><div><div class="map-dhead"><h3>${esc(item.name)}</h3><button type="button" class="btn btn-ghost btn-sm" data-action="map.sel" data-arg="${scope}:unreg">${esc(t('map.clear'))}</button></div>${alertBox}</div><div></div></div>`;
  }
  const title = item ? item.name : t(canton ? 'map.allC' : 'map.allM');
  const facts = [];
  facts.push(`<div><span class="muted small">${esc(t('map.nights'))}</span><strong>${esc(fmt(sumNights, 'nights'))}</strong></div>`);
  facts.push(`<div><span class="muted small">${esc(t(canton ? 'map.levyK' : 'map.levyM'))}</span><strong>${esc(fmt(sumLevy, 'levy'))}</strong></div>`);
  if (!canton) facts.push(`<div><span class="muted small">${esc(t('map.rev'))}</span><strong>${esc(fmt(list.reduce((a, it) => a + valueOf(it, months, 'rev', scope, yearOf(m)), 0), 'rev'))}</strong></div>`);
  let extra = '';
  if (!canton && item) {
    extra = `<p class="muted small">${esc(item.address)}</p><div class="map-chips">${chip('neutral', t('cat.' + item.cat))}${chip('neutral', item.rooms ? t('h.capacityV', { r: item.rooms, b: item.beds }) : t('m.persons', { n: item.beds }))}${item.price ? chip('info', t('map.priceFrom', { p: item.price })) : ''}${item.ad ? chip('neutral', t('map.adr', { p: item.ad })) : ''}${item.oc ? chip('neutral', t('map.occ', { p: item.oc })) : ''}</div>`;
  } else if (canton && item && item.members) {
    const rows = item.members.map((g) => ({ g, v: valueOf(g, months, m.metric, scope, yearOf(m)) })).sort((a, b) => b.v - a.v).slice(0, 6);
    const max = Math.max(...rows.map((r) => r.v), 1);
    extra = `<h4 class="map-sub">${esc(t('map.munisIn'))}</h4><div class="hbars">${rows.map(({ g, v }) => `<div class="hbar-row"><div class="hbar-lbl">${esc(g.name)}</div><div class="hbar-track"><div class="hbar" style="width:${(v / max) * 100}%"></div></div><div class="hbar-val">${esc(fmt(v, m.metric))}</div></div>`).join('')}</div>`;
  } else if (canton && item) {
    const reg = REGIONS.find((r) => r.id === item.r);
    extra = reg ? `<div class="map-chips">${chip('neutral', reg.name)}</div>` : '';
  }
  if (canton) {
    const nm = (x) => gemName(x.name);
    const ls = listingStats(item ? (item.members ? item.members.map(nm) : [nm(item)]) : items.map(nm).concat(items.flatMap((g) => (g.members || []).map(nm))));
    if (ls && ls.count) extra += `<div class="map-chips">${chip('neutral', t('map.listed', { n: ls.count }))}${ls.avg ? chip('info', t('map.avgPrice', { p: ls.avg, n: ls.nPrices })) : ''}</div>`;
  }
  return `<div class="map-detail">
    <div><div class="map-dhead"><h3>${esc(title)}</h3>${item ? `<button type="button" class="btn btn-ghost btn-sm" data-action="map.sel" data-arg="${scope}:${esc(item.id)}">${esc(t('map.clear'))}</button>` : ''}</div>
      <p class="muted small">${esc(periodLabel(m, lang))}</p>${alertBox}
      <div class="map-facts">${facts.join('')}</div>${extra}</div>
    <div><h4 class="map-sub">${esc(t('map.trend'))} ${yearOf(m)} (${esc(unit)})</h4>${barChart(chartVals, labels, { height: 170, highlight: months })}</div>
  </div>`;
}

// ---------- Hauptkomponente ----------
export function mapCard(scope, lang) {
  const canton = scope === 'canton';
  const m = mst(scope);
  const months = mask(m);
  const items = canton ? cantonItems(m.level) : hostItems();
  const flags = !canton && m.alerts ? flagMap() : {};
  const pseudo = flags.unreg ? [unregItem()] : [];
  if (m.sel && !items.concat(pseudo).some((i) => i.id === m.sel)) m.sel = null;
  const vals = items.map((it) => valueOf(it, months, m.metric, scope, yearOf(m)));
  const total = vals.reduce((a, b) => a + b, 0);
  const note = canton ? t('map.noteC') : t('map.noteM');
  return `<section class="card map-card">
    <div class="card-head"><h2>${icon('map', 20)} ${esc(t(canton ? 'map.cardC' : 'map.cardM'))}</h2></div>
    ${controls(scope, m, lang)}
    <div class="map-grid">
      <div class="map-wrap">${svgMap(scope, items.concat(pseudo), vals.concat(pseudo.map(() => 0)), m.sel, { flags, zoom: m.zoom })}<p class="muted small map-legend">${esc(t('map.legend', { m: t(m.metric === 'levy' ? (canton ? 'map.levyK' : 'map.levyM') : m.metric === 'rev' ? 'map.rev' : 'map.nights') }))} · ${esc(t('map.schematic'))}${m.alerts && !canton ? ` · <span class="rank-flag">!</span> ${esc(t('map.flagKey'))}` : ''}</p></div>
      <div class="map-side">
        <div class="map-total"><span class="kpi-lbl">${esc(t('map.sum'))} · ${esc(periodLabel(m, lang))}</span><strong>${esc(fmt(total, m.metric))}</strong></div>
        <h3 class="map-sub">${esc(t('map.rank'))}</h3>
        ${ranking(scope, items, vals, m, flags)}
      </div>
    </div>
    ${detail(scope, items.concat(pseudo), m, months, lang, flags)}
    <p class="muted small foot-note">${icon('lock', 14)} ${esc(note)}</p>
  </section>`;
}

// Kleine Vorschau auf der Übersicht mit Verweis auf die Kartenseite
export function mapTeaser(scope, lang) {
  const canton = scope === 'canton';
  const m = { ...mst(scope), level: 'muni', metric: 'levy', pt: 'year' };
  const items = canton ? cantonItems('muni') : hostItems();
  const vals = items.map((it) => valueOf(it, mask(m), 'levy', scope, yearOf(m)));
  const href = canton ? '#/kanton/karte' : '#/gemeinde/karte';
  return `<section class="card map-teaser"><div class="map-teaser-in">
    <div><div class="card-head"><h2>${icon('map', 20)} ${esc(t(canton ? 'map.cardC' : 'map.cardM'))}</h2></div>
    <p class="muted">${esc(t(canton ? 'map.teaserC' : 'map.teaserM'))}</p>
    <a class="btn btn-secondary btn-sm" href="${href}">${esc(t('map.open'))} ${icon('arrowRight', 16)}</a></div>
    <a class="map-thumb" href="${href}" tabindex="-1" aria-hidden="true">${svgMap(scope, items, vals, null, { mini: true })}</a>
  </div></section>`;
}

export function mapPage(scope, lang) {
  const canton = scope === 'canton';
  return { title: t(canton ? 'map.titleC' : 'map.titleM'), sub: t(canton ? 'map.subC' : 'map.subM'), body: mapCard(scope, lang) };
}

// ---------- Aktionen ----------
const split = (arg) => { const i = String(arg).indexOf(':'); return [arg.slice(0, i), arg.slice(i + 1)]; };
export const mapActions = {
  'map.sel': (arg) => { const [sc, id] = split(arg); setM(sc, { sel: mst(sc).sel === id ? null : id }); },
  'map.metric': (arg) => { const [sc, v] = split(arg); setM(sc, { metric: v }); },
  'map.level': (arg) => { const [sc, v] = split(arg); setM(sc, { level: v, sel: null }); },
  'map.zoom': (arg) => { const [sc, v] = split(arg); setM(sc, { zoom: v }); },
  'map.alerts': (arg) => { const [sc, v] = split(arg); setM(sc, { alerts: v === '1' }); },
  'map.pt': (arg) => { const [sc, v] = split(arg); setM(sc, { pt: v, pi: v === 'month' ? Math.min(mst(sc).pi, monthsOf(yearOf(mst(sc))) - 1) : Math.min(mst(sc).pi, 3) }); },
};
export const mapChanges = {
  'map.year': (val) => { const [sc, v] = split(val); setM(sc, { year: +v, pi: 0 }); },
  'map.pi': (val) => { const [sc, v] = split(val); setM(sc, { pi: +v }); },
};
