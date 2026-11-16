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
