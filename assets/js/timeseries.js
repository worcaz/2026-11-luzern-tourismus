// Zeitreihen ab 1.1.2020 bis 16.11.2026: aus den Betriebsmodellen (2026) rückwärts abgeleitet.
// Annahmen (fiktiv, an das reale Muster angelehnt): Corona-Einbruch ab März 2020, Erholung 2021/22,
// Städte (internationale Gäste) erholen sich langsamer als Berg- und Seegebiete (Inlandgäste).
export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
export const TODAY = { year: 2026, month: 10, day: 16 }; // 16.11.2026 (month 0-basiert)
export const AREA_OF = { city: 'city', lake: 'lake', rural: 'rural', alpine: 'alpine' };

// Nachfrage je Monat relativ zu 2019 (Jan-Dez)
const L = {
  city: {
    2020: [1.02, 1.0, 0.55, 0.03, 0.07, 0.30, 0.62, 0.68, 0.55, 0.35, 0.15, 0.18],
    2021: [0.14, 0.14, 0.20, 0.17, 0.28, 0.50, 0.78, 0.85, 0.74, 0.62, 0.40, 0.35],
    2022: [0.40, 0.68, 0.82, 0.88, 0.92, 0.95, 0.96, 0.97, 0.97, 0.93, 0.90, 0.94],
    2023: [0.96, 0.98, 0.97, 0.97, 0.98, 0.99, 1.0, 1.0, 0.99, 0.99, 0.98, 1.0],
    2024: [1.02, 1.03, 1.02, 1.03, 1.03, 1.04, 1.04, 1.04, 1.03, 1.03, 1.03, 1.04],
    2025: Array(12).fill(1.05),
  },
  lake: {
    2020: [1.0, 1.0, 0.55, 0.05, 0.12, 0.45, 0.85, 0.92, 0.75, 0.50, 0.20, 0.25],
    2021: [0.20, 0.20, 0.30, 0.20, 0.40, 0.65, 0.90, 0.95, 0.85, 0.72, 0.50, 0.45],
    2022: [0.60, 0.80, 0.90, 0.92, 0.95, 0.97, 0.98, 0.99, 0.98, 0.95, 0.93, 0.95],
    2023: Array(12).fill(1.0), 2024: Array(12).fill(1.03), 2025: Array(12).fill(1.05),
  },
  alpine: {
    2020: [1.02, 1.0, 0.60, 0.10, 0.15, 0.50, 0.90, 0.95, 0.80, 0.55, 0.25, 0.30],
    2021: [0.50, 0.55, 0.60, 0.35, 0.40, 0.70, 0.95, 1.0, 0.90, 0.80, 0.70, 0.75],
    2022: [0.90, 0.95, 0.97, 0.95, 0.97, 1.0, 1.02, 1.02, 1.0, 0.98, 0.97, 1.0],
    2023: Array(12).fill(1.02), 2024: Array(12).fill(1.05), 2025: Array(12).fill(1.08),
  },
};
L.rural = Object.fromEntries(YEARS.slice(0, 6).map((y) => [y, L.lake[y].map((v, i) => (v + L.alpine[y][i]) / 2)]));

// Verhältnis Nov/Dez zu Oktober (Saisonform je Gebiet), für den Rest des Jahres 2026
const NOVDEC = { city: [0.76, 0.88], lake: [0.55, 0.62], rural: [0.70, 0.78], alpine: [0.50, 1.25] };
// Zimmerpreisindex je Jahr (Preise stiegen nach Corona)
const ADR = { 2020: 0.90, 2021: 0.88, 2022: 0.95, 2023: 1.0, 2024: 1.04, 2025: 1.07, 2026: 1.10 };

// Faktor Nachfrage (Jahr, Monat) relativ zum 2026er-Wert desselben Monats; g = Wachstum 2026 gegenüber 2025 der Region
export function demandFactor(area, year, month, g = 0.05) {
  if (year === 2026) return 1;
  const a = L[area] || L.city;
  const r2025 = year === 2025 ? 1 : a[year][month] / a[2025][month];
  return r2025 / (1 + g);
}
export const priceFactor = (year) => ADR[year] / ADR[2026];

// 12 Monatswerte eines Jahres aus den 10 Monaten Januar-Oktober 2026 (m) → Personen-Logiernächte
export function year12(m10, area, year, g = 0.05, { upTo } = {}) {
  const nd = NOVDEC[area] || NOVDEC.city;
  const base = m10.concat([m10[9] * nd[0], m10[9] * nd[1]]);
  const out = base.map((v, i) => v * demandFactor(area, year, i, g));
  if (year === TODAY.year) { out[10] = out[10] * (TODAY.day / 30); out[11] = 0; } // bis 16.11.2026
  return out;
}
export const monthsOf = (year) => (year === TODAY.year ? 11 : 12);
