// Schematische Geodaten für die Kartenansicht (fiktive Werte, Koordinaten gerundet).
// Keine externen Kartenkacheln: Die Karte wird als SVG im Browser gezeichnet.

export const MONTH_COUNT = 10; // Januar–Oktober 2026

// Saisonprofile (relative Gewichte je Monat Jan–Okt)
const PROFILES = {
  city: [68.2, 71.9, 84.3, 101.4, 121.0, 138.6, 162.3, 165.1, 142.7, 118.4],
  lake: [38, 40, 62, 98, 132, 168, 208, 214, 160, 104],
  rural: [70, 72, 82, 96, 118, 134, 150, 152, 130, 100],
  alpine: [128, 124, 96, 72, 76, 100, 150, 156, 98, 84],
};
export const profile = (key) => {
  const p = PROFILES[key] || PROFILES.city;
  const s = p.reduce((a, b) => a + b, 0);
  return p.map((v) => v / s);
};
export const profileRaw = (key) => PROFILES[key] || PROFILES.city;

// ---------- Kanton ----------
// lon/lat → SVG (x = Längengrad · cos 47° , y = Breitengrad)
const K = { lon0: 7.74, lat0: 47.33, s: 1200, c: 0.682 };
export const kProj = (lon, lat) => [(lon - K.lon0) * K.c * K.s, (K.lat0 - lat) * K.s];
export const K_VIEW = [0, 0, 640, 700];

const toPath = (pts, proj, close = true) => pts.map(([lo, la], i) => { const [x, y] = proj(lo, la); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('') + (close ? 'Z' : '');

const CANTON_OUTLINE = [[7.90, 47.25], [7.99, 47.29], [8.12, 47.265], [8.22, 47.30], [8.31, 47.275], [8.305, 47.21], [8.345, 47.15], [8.39, 47.12], [8.37, 47.075], [8.44, 47.05], [8.51, 47.02], [8.47, 46.985], [8.36, 46.985], [8.27, 46.965], [8.20, 46.94], [8.11, 46.90], [8.07, 46.80], [7.97, 46.78], [7.89, 46.80], [7.84, 46.86], [7.86, 46.95], [7.80, 47.03], [7.84, 47.10], [7.88, 47.16], [7.87, 47.21]];
const SEMPACH = [[8.19, 47.175], [8.215, 47.150], [8.205, 47.115], [8.17, 47.095], [8.13, 47.115], [8.135, 47.150], [8.16, 47.175]];
const BALDEGG = [[8.27, 47.205], [8.285, 47.185], [8.275, 47.165], [8.255, 47.175], [8.255, 47.200]];
const VIERWALD = [[8.295, 47.058], [8.335, 47.066], [8.385, 47.078], [8.425, 47.072], [8.455, 47.050], [8.495, 47.020], [8.47, 46.995], [8.42, 47.000], [8.37, 47.005], [8.335, 47.010], [8.300, 47.005], [8.265, 46.985], [8.255, 46.975], [8.285, 47.000], [8.315, 47.030]];

export const K_SHAPES = {
  outline: toPath(CANTON_OUTLINE, kProj),
  lakes: [SEMPACH, BALDEGG, VIERWALD].map((p) => toPath(p, kProj)),
};

// Regionen (Summe Logiernächte Jan–Okt, Tsd.) – entsprechen CANTON_REGIONS
export const REGIONS = [
  { id: 'R1', name: 'Luzern-Vierwaldstättersee', lon: 8.37, lat: 47.045 },
  { id: 'R2', name: 'Sempachersee', lon: 8.15, lat: 47.12 },
  { id: 'R3', name: 'Sursee-Mittelland', lon: 8.20, lat: 47.205 },
  { id: 'R4', name: 'Willisau', lon: 7.96, lat: 47.14 },
  { id: 'R5', name: 'Entlebuch / UNESCO Biosphäre', lon: 8.01, lat: 46.90 },
];

// Gemeinden: n = Logiernächte Jan–Okt in Tsd. (fiktiv, Summe je Region wie CANTON_REGIONS)
export const MUNIS = [
  { id: 'luzern', name: 'Luzern', r: 'R1', lon: 8.309, lat: 47.050, n: 1173.9, p: 'city' },
  { id: 'weggis', name: 'Weggis', r: 'R1', lon: 8.431, lat: 47.033, n: 72.1, p: 'lake' },
  { id: 'vitznau', name: 'Vitznau', r: 'R1', lon: 8.483, lat: 47.009, n: 58.0, p: 'lake' },
  { id: 'kriens', name: 'Kriens', r: 'R1', lon: 8.277, lat: 47.034, n: 30.0, p: 'city' },
  { id: 'horw', name: 'Horw', r: 'R1', lon: 8.310, lat: 47.018, n: 27.0, p: 'city' },
  { id: 'meggen', name: 'Meggen', r: 'R1', lon: 8.375, lat: 47.047, n: 22.0, p: 'lake' },
  { id: 'emmen', name: 'Emmen', r: 'R1', lon: 8.300, lat: 47.077, n: 17.0, p: 'city' },
  { id: 'ebikon', name: 'Ebikon', r: 'R1', lon: 8.340, lat: 47.083, n: 12.0, p: 'city' },
  { id: 'nottwil', name: 'Nottwil', r: 'R2', lon: 8.138, lat: 47.141, n: 41.0, p: 'rural' },
  { id: 'sempach', name: 'Sempach', r: 'R2', lon: 8.195, lat: 47.133, n: 34.0, p: 'rural' },
  { id: 'oberkirch', name: 'Oberkirch', r: 'R2', lon: 8.108, lat: 47.100, n: 26.0, p: 'rural' },
  { id: 'neuenkirch', name: 'Neuenkirch', r: 'R2', lon: 8.203, lat: 47.093, n: 22.0, p: 'rural' },
  { id: 'hildisrieden', name: 'Hildisrieden', r: 'R2', lon: 8.215, lat: 47.170, n: 18.0, p: 'rural' },
  { id: 'sursee', name: 'Sursee', r: 'R3', lon: 8.100, lat: 47.172, n: 46.0, p: 'rural' },
  { id: 'hochdorf', name: 'Hochdorf', r: 'R3', lon: 8.292, lat: 47.168, n: 26.0, p: 'rural' },
  { id: 'hitzkirch', name: 'Hitzkirch', r: 'R3', lon: 8.280, lat: 47.230, n: 24.0, p: 'rural' },
  { id: 'beromuenster', name: 'Beromünster', r: 'R3', lon: 8.186, lat: 47.205, n: 22.0, p: 'rural' },
  { id: 'willisau', name: 'Willisau', r: 'R4', lon: 7.990, lat: 47.120, n: 42.0, p: 'rural' },
  { id: 'menznau', name: 'Menznau', r: 'R4', lon: 8.045, lat: 47.080, n: 18.0, p: 'rural' },
  { id: 'dagmersellen', name: 'Dagmersellen', r: 'R4', lon: 7.985, lat: 47.210, n: 14.0, p: 'rural' },
  { id: 'zell', name: 'Zell', r: 'R4', lon: 7.915, lat: 47.140, n: 10.0, p: 'rural' },
  { id: 'fluehli', name: 'Flühli-Sörenberg', r: 'R5', lon: 8.020, lat: 46.880, n: 62.0, p: 'alpine' },
  { id: 'escholzmatt', name: 'Escholzmatt-Marbach', r: 'R5', lon: 7.930, lat: 46.910, n: 38.0, p: 'alpine' },
  { id: 'entlebuch', name: 'Entlebuch', r: 'R5', lon: 8.070, lat: 46.990, n: 20.0, p: 'rural' },
  { id: 'schuepfheim', name: 'Schüpfheim', r: 'R5', lon: 8.020, lat: 46.950, n: 15.0, p: 'alpine' },
];

// ---------- Stadt Luzern ----------
const S = { lon0: 8.215, lat0: 47.094, s: 5400, c: 0.682 };
export const sProj = (lon, lat) => [(lon - S.lon0) * S.c * S.s, (S.lat0 - lat) * S.s];
export const S_VIEW = [0, 0, 640, 440];

const SEE = [[8.3112, 47.0494], [8.3170, 47.0518], [8.3260, 47.0541], [8.3340, 47.0548], [8.3600, 47.0580], [8.4100, 47.0600], [8.4100, 47.0000], [8.2900, 47.0000], [8.2960, 47.0180], [8.3040, 47.0320], [8.3092, 47.0415], [8.3112, 47.0445]];
const REUSS = [[8.3083, 47.0512], [8.3040, 47.0530], [8.2990, 47.0555], [8.2935, 47.0600], [8.2880, 47.0660], [8.2820, 47.0725], [8.2765, 47.0790], [8.2720, 47.0860]];
const EMME = [[8.2000, 47.0700], [8.2500, 47.0740], [8.2640, 47.0800], [8.2720, 47.0830]];
export const S_SHAPES = {
  lake: toPath(SEE, sProj),
  rivers: [toPath(REUSS, sProj, false), toPath(EMME, sProj, false)],
};
export const S_LABELS = [
  { name: 'Vierwaldstättersee', lon: 8.36, lat: 47.0400, lake: true },
  { name: 'Altstadt', lon: 8.3045, lat: 47.0515 },
  { name: 'Reussbühl', lon: 8.2745, lat: 47.0845 },
  { name: 'Tribschen', lon: 8.3135, lat: 47.0405 },
  { name: 'Wesemlin', lon: 8.3225, lat: 47.0625 },
];

// Standorte der Demo-Betriebe (H1–H6) – georeferenziert
export const HOST_GEO = {
  H1: { lon: 8.3098, lat: 47.0528 },
  H2: { lon: 8.3055, lat: 47.0508 },
  H3: { lon: 8.3020, lat: 47.0548 },
  H4: { lon: 8.2755, lat: 47.0765 },
  H5: { lon: 8.3190, lat: 47.0590 },
  H6: { lon: 8.3125, lat: 47.0430 },
};
// Logiernächte Oktober 2026 je Betrieb (aus den Monatsabrechnungen der Demo-Daten)
export const HOST_OCT = { H1: 2846, H2: 1180, H3: 96, H4: 512, H5: 41, H6: 388 };

// Veränderung der Logiernächte gegenüber Vorjahr je Region (fiktiv)
export const REGION_YOY = { R1: 0.057, R2: 0.031, R3: 0.012, R4: -0.024, R5: 0.089 };

// Alert-Zuordnung zu Standorten (Demo): A1 = Inserat ohne Registrierung (kein Betrieb)
export const ALERT_LOC = { A1: 'unreg', A2: 'H5', A3: 'H3', A4: 'H4' };
export const UNREG_GEO = { lon: 8.3070, lat: 47.0562 };
