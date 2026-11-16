// Verzeichnis der Unterkünfte (Luzern Tourismus, 718 Einträge), bei Bedarf nachgeladen.
import { update } from './store.js';

let data = null;
let pending = false;

export function listing() {
  if (data) return data;
  if (!pending) {
    pending = true;
    fetch('assets/data/unterkuenfte.json').then((r) => r.json()).then((d) => { data = d; update(() => {}); }).catch(() => { pending = false; });
  }
  return null;
}

// Kennzahlen für eine Menge von Gemeinde-IDs der Kantonskarte
export function listingStats(ids) {
  const d = listing();
  if (!d) return null;
  const rows = d.filter((o) => ids.includes(o.g));
  const nightly = rows.filter((o) => o.p && o.u === 'n').map((o) => o.p);
  return { count: rows.length, avg: nightly.length ? Math.round(nightly.reduce((a, b) => a + b, 0) / nightly.length) : null, nPrices: nightly.length };
}
