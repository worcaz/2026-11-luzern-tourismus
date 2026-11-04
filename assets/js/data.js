// Fiktive Demodaten. Alle Betriebe, Personen und Zahlen sind erfunden.
export const DEMO_TODAY = '2026-11-04';

export const TARIFFS = {
  // Beispieltarife (CHF pro Person und Logiernacht)
  kantonal: 1.10,
  oertlich: 0.50,
  kurtaxe: {
    hotel45: 2.30,
    hotel13: 2.00,
    pension: 1.90,
    fewo: 1.80,
  },
  pauschale: 300,
  childAge: 12,
};

export function initialState() {
  return {
    v: 3,
    lang: null,
    guestLang: null,
    tour: { active: false, step: 0 },
    hosts: [
      { id: 'H1', name: 'Hotel Seerose am Quai', type: 'hotel', stars: 4, cat: 'hotel45', address: 'Quaiweg 12, 6006 Luzern', municipality: 'Luzern', bfs: 1061, objectNo: 'LU-1061-0042', rooms: 48, beds: 92, contact: 'Sandra Meier', email: 'frontoffice@seerose-quai.example', color: '#135D66', pms: true },
      { id: 'H2', name: 'Boutique Hotel Kapellgasse', type: 'hotel', stars: 3, cat: 'hotel13', address: 'Kapellgasse 7, 6004 Luzern', municipality: 'Luzern', bfs: 1061, objectNo: 'LU-1061-0057', rooms: 22, beds: 40, contact: 'Marc Wyss', pms: true },
      { id: 'H3', name: 'B&B Altstadt Musegg', type: 'bnb', cat: 'pension', address: 'Museggstrasse 30, 6004 Luzern', municipality: 'Luzern', bfs: 1061, objectNo: 'LU-1061-0113', rooms: 4, beds: 8, contact: 'Rita Amrein', pms: false },
      { id: 'H4', name: 'Apartments Reussbühl', type: 'fewo', cat: 'fewo', address: 'Hauptstrasse 41, 6015 Luzern', municipality: 'Luzern', bfs: 1061, objectNo: 'LU-1061-0208', rooms: 9, beds: 26, contact: 'Ivan Kovač', pms: true },
      { id: 'H5', name: 'Ferienwohnung Wesemlin', type: 'fewo', cat: 'fewo', address: 'Wesemlinrain 5, 6006 Luzern', municipality: 'Luzern', bfs: 1061, objectNo: 'LU-1061-0311', rooms: 2, beds: 4, contact: 'Beat Fischer', pms: false },
      { id: 'H6', name: 'Pension Tribschen', type: 'bnb', cat: 'pension', address: 'Tribschenstrasse 18, 6005 Luzern', municipality: 'Luzern', bfs: 1061, objectNo: 'LU-1061-0094', rooms: 11, beds: 20, contact: 'Nadia Imhof', pms: false },
    ],
    bookings: [
      { id: 'B-24017', host: 'H1', lang: 'fr', status: 'invited', arrival: '2026-11-04', departure: '2026-11-07', nights: 3, room: 'Deluxe Seesicht 412', email: 'claire.martin@example.fr', invitedAt: '2026-11-01T09:14',
        main: { first: 'Claire', last: 'Martin', nat: 'FR' }, adults: 2, children: 1, guests: [] },
      { id: 'B-24018', host: 'H1', lang: 'en', status: 'precheckin', arrival: '2026-11-04', departure: '2026-11-06', nights: 2, room: 'Superior 207', email: 'k.watanabe@example.jp', invitedAt: '2026-10-30T18:02',
        main: { first: 'Kenji', last: 'Watanabe', nat: 'JP' }, adults: 1, children: 0,
        guests: [{ first: 'Kenji', last: 'Watanabe', birth: '1979-03-22', nat: 'JP' }], doc: { type: 'passport', no: 'TR4471920', exp: '2032-08-01' } },
      { id: 'B-24019', host: 'H1', lang: 'it', status: 'precheckin', arrival: '2026-11-04', departure: '2026-11-06', nights: 2, room: 'Classic 115', email: 'rossi.anna@example.it', invitedAt: '2026-10-31T11:40',
        main: { first: 'Anna', last: 'Rossi', nat: 'IT' }, adults: 2, children: 0,
        guests: [{ first: 'Anna', last: 'Rossi', birth: '1988-07-09', nat: 'IT' }, { first: 'Marco', last: 'Rossi', birth: '1986-01-30', nat: 'IT' }], doc: { type: 'idcard', no: 'CA12345XY', exp: '2030-02-11' } },
      { id: 'B-24020', host: 'H1', lang: 'de', status: 'invited', arrival: '2026-11-04', departure: '2026-11-05', nights: 1, room: 'Classic 118', email: 't.keller@example.ch', invitedAt: '2026-11-02T08:05',
        main: { first: 'Thomas', last: 'Keller', nat: 'CH' }, adults: 1, children: 0, guests: [] },
      { id: 'B-24021', host: 'H1', lang: 'en', status: 'precheckin', group: true, arrival: '2026-11-04', departure: '2026-11-05', nights: 1, room: '6 Zimmer, 3. Stock', email: 'ops@globaltours.example', invitedAt: '2026-10-28T14:20',
        main: { first: 'Linda', last: 'Ng', nat: 'SG' }, adults: 12, children: 0,
        guests: [{ first: 'Linda', last: 'Ng', birth: '1975-05-03', nat: 'SG' }], doc: { type: 'passport', no: 'K1928374A', exp: '2029-12-01' } },
      { id: 'B-24009', host: 'H1', lang: 'en', status: 'checkedin', arrival: '2026-11-03', departure: '2026-11-06', nights: 3, room: 'Junior Suite 501', email: 'sarah.j@example.com', invitedAt: '2026-10-27T10:00', checkedInAt: '2026-11-03T15:42', ms: 'MS-2026-118702',
        main: { first: 'Sarah', last: 'Johnson', nat: 'US' }, adults: 2, children: 0,
        guests: [{ first: 'Sarah', last: 'Johnson', birth: '1990-11-14', nat: 'US' }, { first: 'Daniel', last: 'Johnson', birth: '1989-02-02', nat: 'US' }], doc: { type: 'passport', no: '583920174', exp: '2031-04-30' } },
    ],
    // Ältere Meldungen (für Polizeisuche und Gastgeber-Liste)
    archive: [
      { ms: 'MS-2026-118455', host: 'H1', first: 'Hans', last: 'Müller', birth: '1961-06-12', nat: 'DE', arrival: '2026-11-01', departure: '2026-11-03', persons: 2, doc: 'Personalausweis · L01X00T47' },
      { ms: 'MS-2026-118391', host: 'H2', first: 'Pierre', last: 'Martin', birth: '1972-09-28', nat: 'BE', arrival: '2026-10-29', departure: '2026-11-02', persons: 1, doc: 'Carte d’identité · 592-1183011-77' },
      { ms: 'MS-2026-118220', host: 'H1', first: 'Wei', last: 'Zhang', birth: '1994-12-01', nat: 'CN', arrival: '2026-10-27', departure: '2026-10-30', persons: 2, doc: 'Passport · EJ4471902' },
      { ms: 'MS-2026-118104', host: 'H6', first: 'Maria', last: 'García', birth: '1983-04-17', nat: 'ES', arrival: '2026-10-24', departure: '2026-10-26', persons: 3, doc: 'DNI · 45128833K' },
      { ms: 'MS-2026-117980', host: 'H4', first: 'Ole', last: 'Hansen', birth: '1999-08-05', nat: 'NO', arrival: '2026-10-20', departure: '2026-10-27', persons: 1, doc: 'Pass · 32904417' },
    ],
    invoices: [
      { id: 'R-2026-10-H1', host: 'H1', period: '2026-10', nights: 2846, exempt: 214, status: 'review', due: '2026-11-30' },
      { id: 'R-2026-09-H1', host: 'H1', period: '2026-09', nights: 3312, exempt: 268, status: 'paid', paidAt: '2026-10-08' },
      { id: 'R-2026-08-H1', host: 'H1', period: '2026-08', nights: 3570, exempt: 402, status: 'paid', paidAt: '2026-09-09' },
      { id: 'R-2026-10-H2', host: 'H2', period: '2026-10', nights: 1180, exempt: 61, status: 'paid', paidAt: '2026-11-03' },
      { id: 'R-2026-10-H3', host: 'H3', period: '2026-10', nights: 96, exempt: 4, status: 'open', due: '2026-11-30' },
      { id: 'R-2026-10-H4', host: 'H4', period: '2026-10', nights: 512, exempt: 38, status: 'paid', paidAt: '2026-11-02' },
      { id: 'R-2026-09-H5', host: 'H5', period: '2026-09', nights: 54, exempt: 6, status: 'overdue', due: '2026-10-31' },
      { id: 'R-2026-10-H5', host: 'H5', period: '2026-10', nights: 41, exempt: 2, status: 'open', due: '2026-11-30' },
      { id: 'R-2026-10-H6', host: 'H6', period: '2026-10', nights: 388, exempt: 22, status: 'paid', paidAt: '2026-11-04' },
      { id: 'R-2026-10-AB', host: 'AB', period: '2026-10', nights: 6120, exempt: 0, status: 'paid', paidAt: '2026-11-03', platform: true, amount: 23868.00 },
    ],
    alerts: [
      { id: 'A1', type: 'platform', status: 'open' },
      { id: 'A2', type: 'overdue', status: 'open' },
      { id: 'A3', type: 'anomaly', status: 'open' },
      { id: 'A4', type: 'dispute', status: 'open' },
    ],
    policeLog: [
      { at: '2026-11-02T10:12', user: 'R. Studer', purpose: 'missing', ref: 'VM-2026-0412', query: 'Hansen, Ole', hits: 1 },
      { at: '2026-10-28T16:40', user: 'R. Studer', purpose: 'control', ref: 'GG-2026-1187', query: 'Pension Tribschen, 20.–27.10.', hits: 14 },
    ],
    registrations: [],
    feed: [
      { at: '2026-11-04T06:00', k: 'feed.deletion', v: { n: 1284 } },
      { at: '2026-11-03T15:42', k: 'feed.ms', v: { ms: 'MS-2026-118702', name: 'Sarah Johnson', host: 'Hotel Seerose am Quai' } },
      { at: '2026-11-02T08:05', k: 'feed.invite', v: { name: 'Thomas Keller', id: 'B-24020' } },
      { at: '2026-11-01T09:14', k: 'feed.invite', v: { name: 'Claire Martin', id: 'B-24017' } },
      { at: '2026-11-01T02:00', k: 'feed.invoices', v: { n: 386, period: '10.2026' } },
    ],
    ui: {},
    drafts: {},
  };
}

// Aggregierte Kennzahlen (fiktiv)
export const MUNI_MONTHS = [68.2, 71.9, 84.3, 101.4, 121.0, 138.6, 162.3, 165.1, 142.7, 118.4]; // Tsd. Logiernächte Stadt Luzern 2026
export const CANTON_REGIONS = [
  { name: 'Luzern-Vierwaldstättersee', v: 1412 },
  { name: 'Sempachersee', v: 141 },
  { name: 'Sursee-Mittelland', v: 118 },
  { name: 'Willisau', v: 84 },
  { name: 'Entlebuch / UNESCO Biosphäre', v: 135 },
];
