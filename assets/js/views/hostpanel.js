// Seitenpanel mit Geo-Informationen zu einem Betrieb (aus dem Register).
import { state } from '../store.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, num, chip, openDrawer } from '../ui.js';
import { geodata, geomPath, osmLocal, osmdata } from '../geodata.js';
import { listing } from '../listing.js';
import { hostItems, hostFigures } from './map.js';
import { ALERT_LOC } from '../geo.js';

const STATION = { lon: 8.3107, lat: 47.0502 }; // Bahnhof Luzern
const M_LON = 75900; // Meter je Grad Länge bei 47°
const M_LAT = 111200;
const dist = (a, b) => Math.hypot((a.lon - b.lon) * M_LON, (a.lat - b.lat) * M_LAT);

function localMap(it, others) {
  const W = 420, H = 300, mpp = 1.15; // Meter je Pixel
  const proj = (lo, la) => [W / 2 + ((lo - it.lon) * M_LON) / mpp, H / 2 - ((la - it.lat) * M_LAT) / mpp];
  const dLon = (W / 2) * mpp / M_LON, dLat = (H / 2) * mpp / M_LAT;
  const G = geodata();
  const lake = G ? G.seen.features.map((f) => `<path class="m-water" d="${geomPath(f.geometry, proj)}"/>`).join('') : '';
  const osm = osmLocal(it.lon, it.lat, dLon * 1.1, dLat * 1.1, proj);
  const dots = others.map((o) => { const [x, y] = proj(o.lon, o.lat); return `<circle class="hp-other" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"><title>${esc(o.name)}</title></circle>`; }).join('');
  const bar = 100 / mpp; // 100 m
  return `<svg class="hp-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('hp.mapAria', { n: it.name }))}"><rect class="m-land" width="${W}" height="${H}"/>${lake}${osm ? `<path class="m-cr" d="${osm.creeks}"/><path class="m-rv" d="${osm.rivers}"/><path class="m-bld" d="${osm.buildings}"/><path class="hp-bld" d="${osm.target}"/>` : ''}${dots}
    <circle class="hp-ring" cx="${W / 2}" cy="${H / 2}" r="12"/><circle class="hp-pt" cx="${W / 2}" cy="${H / 2}" r="3.5"/>
    <g class="hp-scale"><path d="M12 ${H - 14}h${bar}M12 ${H - 18}v8M${12 + bar} ${H - 18}v8"/><text x="12" y="${H - 22}">100 m</text></g></svg>`;
}

export function openHostPanel(id) {
  const it = hostItems().find((x) => x.id === id);
  if (!it) return;
  const L = listing();
  const entry = L && (L.find((o) => 'U' + o.id.slice(0, 8) === id) || L.find((o) => o.lh === id));
  const others = hostItems().filter((o) => o.id !== id && dist(o, it) < 300);
  const toStation = Math.round(dist(it, STATION));
  const flagged = Object.entries(ALERT_LOC).find(([, hid]) => hid === id);
  const alert = flagged && state.alerts.find((a) => a.id === flagged[0] && a.status === 'open');
  const src = entry ? (entry.q === 'a' ? t('hp.srcAddr') : t('hp.srcPlz')) : t('hp.srcDemo');
  const fig = hostFigures(it);
  const row = (k, v) => `<div class="hp-row"><dt>${esc(k)}</dt><dd>${v}</dd></div>`;
  const html = `${localMap(it, others)}
    <p class="muted small hp-attr">${esc(t('map.osm'))}</p>
    <div class="map-chips">${chip('neutral', t('cat.' + it.cat))}${it.rooms ? chip('neutral', t('h.capacityV', { r: it.rooms, b: it.beds })) : it.beds ? chip('neutral', t('m.persons', { n: it.beds })) : ''}${alert ? chip('err', t('al.' + alert.type + '.title'), 'alert') : ''}</div>
    <dl class="hp-dl">
      ${row(t('hp.address'), esc(it.address || '–'))}
      ${row(t('hp.coords'), `<span class="mono">${it.lat.toFixed(5)}, ${it.lon.toFixed(5)}</span>`)}
      ${row(t('hp.station'), esc(t('hp.meters', { n: num(toStation) })))}
      ${row(t('hp.nearby'), esc(String(others.length)))}
      ${row(t('hp.source'), esc(src))}
    </dl>
    <h3 class="map-sub">${esc(t('hp.figures'))}</h3>
    <div class="map-facts"><div><span class="muted small">${esc(t('map.nights'))}</span><strong>${esc(num(Math.round(fig.nights)))}</strong></div><div><span class="muted small">${esc(t('map.levyM'))}</span><strong>CHF ${esc(num(Math.round(fig.levy)))}</strong></div>${it.oc ? `<div><span class="muted small">${esc(t('hp.occ'))}</span><strong>${it.oc} %</strong></div>` : ''}</div>
    <div class="btn-row hp-actions"><button type="button" class="btn btn-primary" data-action="reg.showOnMap" data-arg="${esc(id)}">${icon('map', 18)} ${esc(t('m.showOnMap'))}</button>
    <a class="btn btn-secondary" href="https://www.openstreetmap.org/?mlat=${it.lat.toFixed(5)}&mlon=${it.lon.toFixed(5)}#map=18/${it.lat.toFixed(5)}/${it.lon.toFixed(5)}" target="_blank" rel="noopener">${esc(t('hp.osmOpen'))} ${icon('arrowRight', 16)}</a></div>`;
  openDrawer(html, it.name);
  // Kartendaten werden bei Bedarf geladen: Panel danach einmal neu zeichnen
  if (!osmdata() || !geodata()) {
    const iv = setInterval(() => { if (osmdata() && geodata()) { clearInterval(iv); if (document.querySelector('.drawer')) openHostPanel(id); } }, 300);
    setTimeout(() => clearInterval(iv), 8000);
  }
}
