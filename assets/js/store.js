import { initialState, TARIFFS, DEMO_TODAY } from './data.js';

const KEY = 'luma-demo-state';
let mem = null;
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === initialState().v) return s;
    }
  } catch (e) { /* Speicher nicht verfügbar */ }
  return initialState();
}

export const state = (mem = load());

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignorieren */ }
}

export function update(fn, opts = {}) {
  fn(state);
  save();
  if (!opts.silent) listeners.forEach((l) => l());
}

export function subscribe(fn) { listeners.add(fn); }

export function reset() {
  const keepLang = state.lang;
  const fresh = initialState();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh, { lang: keepLang });
  save();
  listeners.forEach((l) => l());
}

export function nowIso() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${DEMO_TODAY}T${hh}:${mm}`;
}

export function feed(k, v) {
  state.feed.unshift({ at: nowIso(), k, v });
}

// ---------- Abfragen ----------
export const host = (id) => state.hosts.find((h) => h.id === id);
export const booking = (id) => state.bookings.find((b) => b.id === id);
export const demoBooking = () => booking('B-24017');

export function rateFor(cat) {
  const k = TARIFFS.kurtaxe[cat] ?? TARIFFS.kurtaxe.fewo;
  return { kurtaxe: k, oertlich: TARIFFS.oertlich, kantonal: TARIFFS.kantonal, total: +(k + TARIFFS.oertlich + TARIFFS.kantonal).toFixed(2) };
}

export function ageAt(birth, date = DEMO_TODAY) {
  if (!birth) return null;
  const b = new Date(birth), d = new Date(date);
  let a = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) a--;
  return a;
}

// Abgaben für eine Buchung
export function bookingLevy(b) {
  const h = host(b.host);
  const r = rateFor(h.cat);
  let payers = 0, exempt = 0;
  if (b.guests && b.guests.length >= (b.adults + b.children)) {
    b.guests.forEach((g) => { const a = ageAt(g.birth, b.arrival); if (a !== null && a < TARIFFS.childAge) exempt++; else payers++; });
  } else { payers = b.adults; exempt = b.children; }
  const nights = payers * b.nights;
  return { rate: r, payers, exempt, nights, exemptNights: exempt * b.nights, total: +(nights * r.total).toFixed(2) };
}

export function invoiceAmounts(inv) {
  if (inv.platform) return { total: inv.amount, kurtaxe: +(inv.amount * 0.4615).toFixed(2), oertlich: +(inv.amount * 0.1282).toFixed(2), kantonal: +(inv.amount * 0.4103).toFixed(2), chargeable: inv.nights };
  const h = host(inv.host);
  const r = rateFor(h.cat);
  const chargeable = inv.nights - inv.exempt;
  const kurtaxe = +(chargeable * r.kurtaxe).toFixed(2);
  const oertlich = +(chargeable * r.oertlich).toFixed(2);
  const kantonal = +(chargeable * r.kantonal).toFixed(2);
  return { chargeable, kurtaxe, oertlich, kantonal, total: +(kurtaxe + oertlich + kantonal).toFixed(2), rate: r };
}

// Meldescheine (aktuelle Buchungen + Archiv)
export function meldescheine() {
  const fromBookings = state.bookings.filter((b) => b.status === 'checkedin').flatMap((b) => {
    const list = (b.guests || []).map((g, i) => ({
      ms: b.ms, host: b.host, first: g.first, last: g.last, birth: g.birth, nat: g.nat,
      arrival: b.arrival, departure: b.departure, persons: b.adults + b.children,
      doc: i === 0 && b.doc ? `${docLabel(b.doc.type)} · ${b.doc.no}` : '–', companion: i > 0,
    }));
    return list;
  });
  return [...fromBookings, ...state.archive];
}

export function docLabel(t) {
  return { passport: 'Pass', idcard: 'ID', other: 'Ausweis' }[t] || t;
}

// Laufender Monat (November) für Hotel H1
export function runningNights(hostId) {
  const base = { H1: 1204 }[hostId] || 0;
  const add = state.bookings.filter((b) => b.host === hostId && b.status === 'checkedin' && b.arrival >= '2026-11-04').reduce((s, b) => s + bookingLevy(b).nights + bookingLevy(b).exemptNights, 0);
  return base + add;
}
