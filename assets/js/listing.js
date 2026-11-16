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

// Kennzahlen für eine Menge von Gemeindenamen (swissBOUNDARIES3D)
export function listingStats(names) {
  const d = listing();
  if (!d) return null;
  const rows = d.filter((o) => names.includes(o.gm));
  const nightly = rows.filter((o) => o.p && o.u === 'n').map((o) => o.p);
  return { count: rows.length, avg: nightly.length ? Math.round(nightly.reduce((a, b) => a + b, 0) / nightly.length) : null, nPrices: nightly.length };
}

// Unterkünfte der Stadt Luzern (ohne die Mitgliederhotels, die schon im Register stehen)
export function cityListing() {
  const d = listing();
  return d ? d.filter((o) => o.gm === 'Luzern' && !o.lh) : null;
}

const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const CAT = (o) => (o.t === 'hotel' ? (o.s >= 4 ? 'hotel45' : 'hotel13') : o.t === 'fewo' ? 'fewo' : 'pension');
const OCC = { hotel45: 0.68, hotel13: 0.6, pension: 0.5, fewo: 0.45 };

// Verzeichnis-Eintrag als Betrieb mit (fiktiven) Logiernächten, Kapazität nach Angaben, Preis laut Verzeichnis
export function asHost(o) {
  const cat = CAT(o);
  const h = hash(o.id);
  const beds = o.pp || (o.t === 'hotel' ? 40 + (h % 60) : o.t === 'hostel' ? 60 : 8);
  const occ = OCC[cat] + (((h >> 5) % 11) - 5) / 100;
  const perNight = o.p && o.u === 'n' ? o.p : null;
  const ppn = perNight ? perNight / 2 : o.p && o.u === 'w' ? o.p / 7 / (o.pp || 2) : null;
  return { id: 'U' + o.id.slice(0, 8), name: o.n, cat, type: o.t, address: o.a || `${o.o}`, municipality: 'Luzern', objectNo: null, rooms: o.bd || null, beds, pms: false, lon: o.lo, lat: o.la, oct: Math.round(beds * 31 * occ), price: perNight, ppn, src: 'verzeichnis', q: o.q };
}
