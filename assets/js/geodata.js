// Gemeindegrenzen Kanton Luzern (79 Gemeinden), Seen und Nachbarkantone.
// Quelle: swissBOUNDARIES3D (swisstopo) via swiss-maps (BSD-3), vereinfacht; übernommen aus dem Projekt 2026-09-LU-Energieplanung.
import { update } from './store.js';

let G = null;
let pending = false;

export function geodata() {
  if (G) return G;
  if (!pending) {
    pending = true;
    Promise.all(['gemeinden', 'seen', 'kantone'].map((n) => fetch(`assets/data/geo/${n}.json`).then((r) => r.json())))
      .then(([gemeinden, seen, kantone]) => {
        const byName = {};
        gemeinden.features.forEach((f) => { byName[f.properties.name] = f; });
        G = { gemeinden, seen, kantone, byName };
        update(() => {});
      })
      .catch(() => { pending = false; });
  }
  return null;
}

const polys = (geom) => (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates);

// SVG-Pfad für Polygon/MultiPolygon mit gegebener Projektion (lon, lat) → [x, y]
export function geomPath(geom, proj) {
  return polys(geom).map((poly) => poly.map((ring) => ring.map(([lo, la], i) => { const [x, y] = proj(lo, la); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('') + 'Z').join('')).join('');
}

// Flächenschwerpunkt des grössten Rings (planar, genügt für die Darstellung)
export function centroid(feature) {
  let best = null;
  polys(feature.geometry).forEach((poly) => {
    const ring = poly[0];
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, y0] = ring[i]; const [x1, y1] = ring[i + 1];
      const f = x0 * y1 - x1 * y0; a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
    }
    if (!best || Math.abs(a) > Math.abs(best.a)) best = { a, lon: cx / (3 * a), lat: cy / (3 * a) };
  });
  return best ? [best.lon, best.lat] : null;
}

// Gemeindename der Kartendaten → Name in swissBOUNDARIES3D
export const GEM_NAME = { 'Flühli-Sörenberg': 'Flühli', Eschenbach: 'Eschenbach' };
export const gemName = (n) => GEM_NAME[n] || n;

// ---------- Gebäude und Fliessgewässer (OpenStreetMap) für die Stadtkarte ----------
// Quelle: OpenStreetMap-Mitwirkende (ODbL), Auszug aus dem Projekt 2026-09-LU-Energieplanung.
// Format: Gebäude und Linien = [x0, y0, dx1, dy1, ...] in 1e-5 Grad ab o = [8.25, 46.995]; Gebäuderinge werden beim Zeichnen geschlossen.
let O = null;
let opending = false;
const pathCache = {};

export function osmdata() {
  if (O) return O;
  if (!opending) {
    opending = true;
    fetch('assets/data/geo/osm-luzern.json').then((r) => r.json()).then((d) => { O = d; update(() => {}); }).catch(() => { opending = false; });
  }
  return null;
}

// Umlaufrichtung vereinheitlichen: Ringe mit gegensätzlicher Richtung heben sich bei überlappenden Gebäuden sonst auf (Löcher)
function ccw(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i]; const [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0; }
  return a < 0 ? pts.slice().reverse() : pts;
}

function decodeAbs(a) {
  const pts = [[a[0], a[1]]];
  let x = a[0], y = a[1];
  for (let k = 2; k < a.length; k += 2) { x += a[k]; y += a[k + 1]; pts.push([x, y]); }
  return pts;
}

// SVG-Pfade (Gebäude, Flüsse, Bäche) für eine Projektion; je Ausschnitt einmal berechnet
export function osmPaths(zoom, proj) {
  const d = osmdata();
  if (!d) return null;
  if (pathCache[zoom]) return pathCache[zoom];
  const [ox, oy] = d.o;
  const P = ([x, y]) => { const [px, py] = proj(ox + x / 1e5, oy + y / 1e5); return `${px.toFixed(1)} ${py.toFixed(1)}`; };
  const minExt = zoom === 'center' ? 0 : 16; // im Gesamtbild nur grössere Gebäude (ab ca. 17 m)
  let b = '';
  for (const a of d.b) {
    const pts = decodeAbs(a);
    if (minExt) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 - x0 < minExt && y1 - y0 < minExt) continue;
    }
    b += 'M' + ccw(pts).map(P).join('L') + 'Z';
  }
  const lines = (arr) => arr.map((a) => 'M' + decodeAbs(a).map(P).join('L')).join('');
  pathCache[zoom] = { buildings: b, rivers: lines(d.r), creeks: zoom === 'center' ? lines(d.s) : '' };
  return pathCache[zoom];
}

// Ausschnitt um einen Punkt (Gebäude, Flüsse, Bäche) für Minikarten; proj: (lon, lat) → [x, y], d = halbe Breite/Höhe in Grad
export function osmLocal(lon, lat, dLon, dLat, proj) {
  const d = osmdata();
  if (!d) return null;
  const [ox, oy] = d.o;
  const near = (x, y) => Math.abs(ox + x / 1e5 - lon) < dLon && Math.abs(oy + y / 1e5 - lat) < dLat;
  const P = ([x, y]) => { const [px, py] = proj(ox + x / 1e5, oy + y / 1e5); return `${px.toFixed(1)} ${py.toFixed(1)}`; };
  let buildings = '';
  let target = ''; let tBest = Infinity;
  const inRing = (ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i]; const [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c; } return c; };
  for (const a of d.b) {
    // grosse Gebäude: der erste Punkt kann ausserhalb liegen, deshalb Ausdehnung prüfen
    if (Math.abs(ox + a[0] / 1e5 - lon) > dLon + 0.01 || Math.abs(oy + a[1] / 1e5 - lat) > dLat + 0.01) continue;
    const pts = decodeAbs(a);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (ox + x1 / 1e5 < lon - dLon || ox + x0 / 1e5 > lon + dLon || oy + y1 / 1e5 < lat - dLat || oy + y0 / 1e5 > lat + dLat) continue;
    const path = 'M' + ccw(pts).map(P).join('L') + 'Z';
    buildings += path;
    // Gebäude des Betriebs: das Gebäude, das den Punkt enthält (sonst das nächstgelegene Zentrum)
    const ring = pts.map(([x, y]) => [ox + x / 1e5, oy + y / 1e5]);
    if (inRing(ring)) { const area = (x1 - x0) * (y1 - y0); if (area < tBest) { tBest = area; target = path; } }
  }
  const lines = (arr) => arr.map((a) => {
    const pts = decodeAbs(a).filter(([x, y]) => Math.abs(ox + x / 1e5 - lon) < dLon * 2 && Math.abs(oy + y / 1e5 - lat) < dLat * 2);
    return pts.length > 1 ? 'M' + pts.map(P).join('L') : '';
  }).join('');
  return { buildings, target, rivers: lines(d.r), creeks: lines(d.s) };
}
