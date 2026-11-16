// Alle Unterkünfte des Verzeichnisses (Luzern Tourismus) auf einer Karte der Zentralschweiz.
import { state, update } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, num, chip } from '../ui.js';
import { listing } from '../listing.js';
import { CANTON_OUTLINE, SEMPACH, BALDEGG } from '../geo.js';

const TYPES = ['hotel', 'fewo', 'bnb', 'hostel', 'group', 'camping'];
const P = { lon0: 7.78, lat0: 47.40, s: 1000, c: 0.682 };
const proj = (lo, la) => [(lo - P.lon0) * P.c * P.s, (P.lat0 - la) * P.s];
const VIEWS = { all: [0, 0, 780, 840], lu: [41, 100, 464, 530], see: [286, 280, 307, 220] };
const path = (pts) => pts.map(([lo, la], i) => { const [x, y] = proj(lo, la); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('') + 'Z';
const LAKES = [
  [[8.295, 47.058], [8.335, 47.066], [8.385, 47.078], [8.425, 47.072], [8.455, 47.050], [8.50, 47.015], [8.54, 47.005], [8.59, 47.005], [8.62, 46.99], [8.625, 46.93], [8.62, 46.905], [8.60, 46.915], [8.585, 46.96], [8.55, 46.98], [8.50, 46.96], [8.47, 46.97], [8.42, 46.975], [8.35, 46.975], [8.33, 46.965], [8.27, 46.945], [8.30, 46.985], [8.34, 47.0], [8.315, 47.03]],
  [[8.21, 46.88], [8.235, 46.875], [8.24, 46.855], [8.215, 46.85], [8.20, 46.865]],
  [[8.515, 47.205], [8.535, 47.18], [8.525, 47.12], [8.48, 47.10], [8.47, 47.13], [8.50, 47.17]],
  SEMPACH, BALDEGG,
];
const SHAPES = `<path class="m-canton" d="${path(CANTON_OUTLINE)}"/>${LAKES.map((l) => `<path class="m-water" d="${path(l)}"/>`).join('')}`;

const st = () => ({ q: '', off: {}, sel: null, zoom: 'all', ...(state.ui.stays || {}) });
const setSt = (patch) => update((s) => { s.ui.stays = { ...st(), ...patch }; });

function filtered(d) {
  const x = st();
  const q = (x.q || '').toLowerCase().trim();
  return d.filter((o) => !x.off[o.t] && (!q || `${o.n} ${o.o} ${o.a || ''}`.toLowerCase().includes(q)));
}
const price = (o) => (o.p ? `${t('map.priceFromShort')} CHF ${num(o.p)} ${o.u === 'n' ? t('m.perNight') : t('m.perWeek')}` : '–');

function detail(o) {
  if (!o) return `<p class="muted">${esc(t('st.pick'))}</p>`;
  const cap = [o.pp ? t('m.persons', { n: o.pp }) : '', o.bd ? t('m.bedrooms', { n: o.bd }) : '', o.m2 ? `${o.m2} m²` : '', o.x || ''].filter(Boolean).join(' · ');
  const addr = o.a ? `<strong>${esc(o.a)}</strong>` : `<span class="muted">${esc(t('st.noAddr', { o: o.o }))}</span>`;
  return `<div class="map-dhead"><h3>${esc(o.n)}${o.s ? ` <span class="stars">${'★'.repeat(o.s)}</span>` : ''}</h3><button type="button" class="btn btn-ghost btn-sm" data-action="st.sel" data-arg="${o.id}">${esc(t('map.clear'))}</button></div>
    <p class="small">${addr}</p>
    <div class="map-chips">${chip('info', t('m.type.' + o.t))}${o.q === 'a' ? chip('ok', t('st.addrOk')) : chip('neutral', t('st.locApprox'))}${(o.f || []).map((f) => chip('neutral', f)).join('')}</div>
    <div class="map-facts"><div><span class="muted small">${esc(t('m.listPrice'))}</span><strong>${esc(price(o))}</strong></div>${cap ? `<div><span class="muted small">${esc(t('m.listCap'))}</span><strong>${esc(cap)}</strong></div>` : ''}</div>`;
}

export function staysPage() {
  const d = listing();
  const body = d ? staysBody(d) : `<p class="muted">${esc(t('m.listLoading'))}</p>`;
  return { title: t('st.title'), sub: t('st.sub'), body };
}

function staysBody(d) {
  const x = st();
  const VIEW = VIEWS[x.zoom] || VIEWS.all;
  const k = VIEW[2] / 780;
  const list = filtered(d);
  const inView = list.filter((o) => o.la > 46.56);
  const sel = d.find((o) => o.id === x.sel);
  const dots = inView.slice().sort((a, b) => (a.id === x.sel) - (b.id === x.sel)).map((o) => {
    const [px, py] = proj(o.lo, o.la);
    const on = o.id === x.sel;
    return `<g class="st-g ${on ? 'is-sel' : ''}" data-action="st.sel" data-arg="${o.id}"><title>${esc(o.n)} · ${esc(o.o)}</title><circle class="st-pt t-${o.t}" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${((on ? 7 : 4.2) * Math.max(k, 0.45)).toFixed(1)}"/>${on ? `<circle class="m-ring" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(11 * Math.max(k, 0.45)).toFixed(1)}"/>` : ''}</g>`;
  }).join('');
  const counts = Object.fromEntries(TYPES.map((k) => [k, d.filter((o) => o.t === k).length]));
  const chips = TYPES.map((k) => `<button type="button" class="tgl st-tgl ${x.off[k] ? '' : 'is-on'}" aria-pressed="${!x.off[k]}" data-action="st.type" data-arg="${k}"><i class="st-dot t-${k}"></i>${esc(t('m.type.' + k))} <span class="muted">${counts[k]}</span></button>`).join('');
  const rows = list.slice().sort((a, b) => a.n.localeCompare(b.n, 'de')).slice(0, 80);
  const withAddr = d.filter((o) => o.a).length;
  return `<section class="card">
    <div class="map-ctl"><label class="search">${icon('search', 18)}<input type="search" value="${esc(x.q)}" placeholder="${esc(t('st.search'))}" data-input="stayQ" aria-label="${esc(t('common.search'))}"></label><div class="st-chips">${chips}</div><div class="sgc" role="group">${[['all', t('st.zAll')], ['lu', t('st.zLu')], ['see', t('st.zSee')]].map(([v, l]) => `<button type="button" class="sgc-b ${v === x.zoom ? 'is-on' : ''}" aria-pressed="${v === x.zoom}" data-action="st.zoom" data-arg="${v}">${esc(l)}</button>`).join('')}</div></div>
    <div class="map-grid">
      <div class="map-wrap"><svg class="map-svg" viewBox="${VIEW.join(' ')}" role="group" aria-label="${esc(t('st.aria'))}">${SHAPES}${dots}</svg>
        <p class="muted small map-legend">${esc(t('st.legend', { n: inView.length, m: list.length - inView.length }))}</p></div>
      <div class="map-side"><div class="map-total"><span class="kpi-lbl">${esc(t('st.count'))}</span><strong>${num(list.length)}</strong><span class="muted small">${esc(t('st.withAddr', { n: withAddr, m: d.length }))}</span></div>
        <ol class="rank st-list">${rows.map((o) => `<li><button type="button" class="rank-row st-row ${o.id === x.sel ? 'is-sel' : ''}" data-action="st.sel" data-arg="${o.id}" aria-pressed="${o.id === x.sel}"><span class="rank-name">${esc(o.n)}<span class="muted small"> · ${esc(o.o)}</span></span><span class="rank-val small">${o.p ? 'CHF ' + num(o.p) : ''}</span></button></li>`).join('')}</ol>
        ${list.length > rows.length ? `<p class="muted small">${esc(t('st.more', { n: list.length - rows.length }))}</p>` : ''}</div>
    </div>
    <div class="map-detail st-detail"><div>${detail(sel)}</div></div>
    <p class="muted small foot-note">${icon('info', 14)} ${esc(t('st.note'))}</p>
  </section>`;
}

export const staysActions = {
  'st.sel': (id) => setSt({ sel: st().sel === id ? null : id }),
  'st.zoom': (v) => setSt({ zoom: v }),
  'st.type': (k) => setSt({ off: { ...st().off, [k]: !st().off[k] } }),
};
export const staysInputs = { stayQ: (v) => setSt({ q: v }) };
