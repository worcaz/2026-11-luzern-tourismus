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

// Summe der Verzeichniseinträge je Gemeinde (Logiernächte Jan-Okt, aus dem Betriebsmodell)
export function listingModel() {
  const d = listing();
  if (!d) return null;
  if (!listingModel.cache) {
    const out = {};
    d.forEach((o) => {
      if (!o.gm || !o.m) return;
      const g = out[o.gm] || (out[o.gm] = { sum: 0, beds: 0, count: 0, monthly: Array(10).fill(0), types: {} });
      o.m.forEach((v, i) => { g.monthly[i] += v; g.sum += v; });
      g.beds += o.bt; g.count += 1;
      g.types[o.t] = (g.types[o.t] || 0) + o.m.reduce((a, b) => a + b, 0);
    });
    listingModel.cache = out;
  }
  return listingModel.cache;
}

const CAT = (o) => (o.t === 'hotel' ? (o.s >= 4 ? 'hotel45' : 'hotel13') : o.t === 'fewo' ? 'fewo' : 'pension');

// Verzeichnis-Eintrag als Betrieb (Kapazität, Logiernächte und Umsatz aus dem Betriebsmodell)
export function asHost(o) {
  const perNight = o.p && o.u === 'n' ? o.p : null;
  return { id: 'U' + o.id.slice(0, 8), name: o.n, cat: CAT(o), type: o.t, address: o.a || `${o.o}`, municipality: 'Luzern', objectNo: null, rooms: o.rm, beds: o.bt, pms: false, lon: o.lo, lat: o.la, m: o.m, rv: o.rv, ad: o.ad, oc: o.oc, price: perNight, src: 'verzeichnis', q: o.q };
}
