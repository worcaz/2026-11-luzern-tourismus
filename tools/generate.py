"""Erzeugt realistische (fiktive) Betriebsdaten aus Preis, Art, Sternen, Ausstattung, Kapazität und Region.

Je Betrieb entstehen: Zimmer (rm), Betten (bt), Ø Zimmerpreis (ad), Belegung Jan-Okt (oc, %),
Logiernächte je Monat (m, Personen) und Beherbergungsumsatz je Monat (rv, CHF), Januar bis Oktober.
Deterministisch: gleiche Eingabe ergibt gleiche Ausgabe (Zufall nur über Hash der ID).
Gilt für das Verzeichnis (assets/data/unterkuenfte.json) und die Mitgliederhotels (assets/js/hotels.js).
"""
import json, re, math
ROOT = __file__.rsplit('/tools/', 1)[0] + '/'
DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31]  # Januar-Oktober 2026

# Saisonprofile der Nachfrage (relativ, Januar-Oktober); Preisindex je Saison
SEASON = {
    'city':   [68, 72, 84, 101, 121, 139, 162, 165, 143, 118],
    'lake':   [38, 40, 62, 98, 132, 168, 208, 214, 160, 104],
    'rural':  [70, 72, 82, 96, 118, 134, 150, 152, 130, 100],
    'alpine': [128, 124, 96, 72, 76, 100, 150, 156, 98, 84],
}
PRICE_IDX = {
    'city':   [0.88, 0.90, 0.95, 1.00, 1.08, 1.15, 1.22, 1.22, 1.12, 1.02],
    'lake':   [0.85, 0.85, 0.90, 1.00, 1.10, 1.18, 1.28, 1.28, 1.12, 0.98],
    'rural':  [0.95, 0.95, 0.97, 1.00, 1.04, 1.08, 1.12, 1.12, 1.05, 1.00],
    'alpine': [1.15, 1.15, 1.02, 0.90, 0.90, 0.98, 1.10, 1.12, 0.95, 0.92],
}
# Mittlere Zimmerbelegung Januar-Oktober je Gebietstyp und Art (Annahmen nach Branchenwerten, gerundet)
OCC = {'city': {'hotel': .58, 'bnb': .52, 'hostel': .62, 'fewo': .45, 'group': .30, 'camping': .30},
       'lake': {'hotel': .52, 'bnb': .44, 'hostel': .50, 'fewo': .42, 'group': .28, 'camping': .30},
       'rural': {'hotel': .42, 'bnb': .36, 'hostel': .40, 'fewo': .36, 'group': .26, 'camping': .30},
       'alpine': {'hotel': .47, 'bnb': .38, 'hostel': .45, 'fewo': .50, 'group': .30, 'camping': .35}}
LAKE = {'Weggis', 'Vitznau', 'Meggen', 'Küssnacht am Rigi', 'Gersau', 'Brunnen', 'Brunnen SZ', 'Beckenried', 'Hergiswil NW', 'Kastanienbaum', 'Kehrsiten', 'Merlischachen', 'Immensee', 'Sisikon', 'Flüelen', 'Seelisberg', 'Emmetten', 'Ennetbürgen', 'Obbürgen', 'Buochs', 'Stansstad', 'Lauerz', 'Seewen', 'Seewen SZ', 'Sempach Station', 'Nottwil', 'Eich', 'Sarnen', 'Wilen (Sarnen)', 'Sachseln'}
ALPINE = {'Sörenberg', 'Flühli LU', 'Engelberg', 'Andermatt', 'Melchsee-Frutt', 'Stoos SZ', 'Rigi Kaltbad', 'Rigi Klösterli', 'Rigi Scheidegg', 'Hasliberg', 'Brünig', 'Marbach LU', 'Marbach', 'Hospental', 'Göschenen', 'Morschach', 'Oberiberg', 'Unterschächen', 'Wassen UR', 'Gurtnellen', 'Isenthal', 'Lungern', 'Giswil', 'Melchtal', 'Escholzmatt', 'Schangnau', 'Trub'}
CITY = {'Luzern', 'Lucerne', 'Kriens', 'Horw', 'Emmen', 'Emmenbrücke', 'Ebikon', 'Rothenburg', 'Root'}

def kind(ort):
    if ort in CITY: return 'city'
    if ort in ALPINE: return 'alpine'
    if ort in LAKE: return 'lake'
    return 'rural'

def h01(s, salt=''):
    x = 2166136261
    for ch in s + salt: x = ((x ^ ord(ch)) * 16777619) & 0xffffffff
    return x / 4294967295

def mean_season(area):
    p = SEASON[area]; return sum(p) / len(p)

def model(e):
    """e: dict mit id, ort, t (hotel|fewo|bnb|hostel|group|camping), s (Sterne), p/u (Preis), pp, bd, f (Ausstattung)"""
    area = kind(e['ort']); t = e['t']; stars = e.get('s') or 0
    f = set(e.get('f') or []); r1, r2, r3 = h01(e['id'], 'a'), h01(e['id'], 'b'), h01(e['id'], 'c')
    # --- Preis (Zimmer bzw. Einheit je Nacht) ---
    p, u = e.get('p'), e.get('u')
    if t == 'fewo':
        base = (p / 7) if p and u == 'w' else (p if p else 140 + 80 * r1)
    elif p and u == 'n':
        base = p
    else:  # Preis unbekannt: nach Sternen und Gebiet schätzen
        tier = {5: 380, 4: 230, 3: 165, 2: 125}.get(stars, 130 if t == 'hotel' else 95)
        if t == 'hostel': tier = 110
        base = tier * (1.1 if area == 'lake' else 0.9 if area == 'rural' else 1.0) * (0.85 + 0.3 * r1)
    ad_mean = base * (1.22 if t in ('hotel', 'bnb', 'hostel', 'group', 'camping') else 1.08)  # «ab»-Preis ist der niedrigste
    # --- Kapazität ---
    if t == 'fewo':
        units = 1; beds = e.get('pp') or 4; rooms = e.get('bd') or max(1, round(beds / 2))
    elif t == 'hostel': rooms = int(25 + 30 * r1); beds = rooms * 4
    elif t == 'group': rooms = int(10 + 15 * r1); beds = rooms * 4
    elif t == 'camping': rooms = int(40 + 40 * r1); beds = rooms * 3
    elif t == 'bnb': rooms = int(3 + 9 * r1); beds = int(rooms * 1.9)
    else:
        size = {5: 95, 4: 75, 3: 45, 2: 28}.get(stars, 32)
        size *= {'city': 1.0, 'lake': 0.85, 'alpine': 0.8, 'rural': 0.6}[area]
        if 'Schwimmbad' in f: size *= 1.2
        if p and p > 300: size *= 0.9  # sehr teure Häuser sind oft kleiner
        rooms = max(8, int(size * (0.6 + 0.9 * r1))); beds = int(rooms * 1.9)
    # --- Belegung je Monat ---
    base_occ = OCC[area][t if t in OCC[area] else 'hotel']
    adj = 1.0
    if t == 'hotel':
        rel = base / {'city': 190, 'lake': 190, 'alpine': 200, 'rural': 150}[area]
        adj *= 1.12 - 0.22 * min(max(rel, 0.4), 2.0) / 2 * 2 * 0.5  # teurer als der Markt: etwas tiefer, günstiger: etwas höher
        if 'Restaurant' in f: adj *= 1.03
        if 'Schwimmbad' in f: adj *= 1.04
        if 'Parking' in f and area in ('rural', 'alpine'): adj *= 1.02
    adj *= 0.88 + 0.24 * r2  # betriebsindividuell
    sm = mean_season(area)
    occ = []
    for i in range(10):
        noise = 1 + (h01(e['id'], 'm%d' % i) - 0.5) * 0.10
        occ.append(min(0.95, max(0.05, base_occ * adj * SEASON[area][i] / sm * noise)))
    # --- Logiernächte und Umsatz je Monat ---
    pers = 1.0 if t == 'hostel' else (e.get('pp') or 4) * 0.7 if t == 'fewo' else (1.7 + 0.3 * r3 if area == 'city' else 2.0 + 0.25 * r3)
    if t in ('group', 'camping'): pers = 2.2
    m, rv = [], []
    for i in range(10):
        occupied = occ[i] * rooms * DAYS[i] if t != 'fewo' else occ[i] * DAYS[i]
        nights = occupied * pers
        adr = ad_mean * PRICE_IDX[area][i]
        m.append(int(round(nights))); rv.append(int(round(occupied * adr)))
    avail = rooms * sum(DAYS) if t != 'fewo' else sum(DAYS)
    oc = round(100 * sum((occ[i] * DAYS[i]) for i in range(10)) / sum(DAYS))
    return {'rm': rooms, 'bt': beds, 'ad': int(round(ad_mean)), 'oc': oc, 'm': m, 'rv': rv}

CITY_TARGET = 0.95 * 1173900  # Stadt Luzern: Verzeichnis deckt rund 95 % der Logiernächte Januar-Oktober (Anker der App)

def calibrate(rows, target):
    """Skaliert Logiernächte und Umsatz gleichmässig, damit die Summe dem Anker entspricht (Belegung höchstens 95 %)."""
    raw = sum(sum(r['m']) for r in rows)
    f = target / raw
    cap = max((r['oc'] for r in rows), default=0) * f
    if cap > 95: f *= 95 / cap
    for r in rows:
        r['m'] = [int(round(x * f)) for x in r['m']]; r['rv'] = [int(round(x * f)) for x in r['rv']]; r['oc'] = int(round(r['oc'] * f))
    return f

if __name__ == '__main__':
    d = json.load(open(ROOT + 'assets/data/unterkuenfte.json'))
    for o in d:
        o.update(model({'id': o['id'], 'ort': o['o'], 't': o['t'], 's': o.get('s'), 'p': o.get('p'), 'u': o.get('u'), 'pp': o.get('pp'), 'bd': o.get('bd'), 'f': o.get('f')}))
    # Mitgliederhotels laden; solche ohne Verzeichniseintrag in der Stadt zählen zur Kalibrierung
    lines = open(ROOT + 'assets/js/hotels.js').read().split('\n')
    typ = {'hotel45': ('hotel', 4), 'hotel13': ('hotel', 3), 'pension': ('bnb', 0), 'fewo': ('fewo', 0)}
    byid = {o['lh']: o for o in d if o.get('lh')}
    own = {}  # LH-ID -> eigenes Modell (ohne Verzeichniseintrag)
    for l in lines:
        if not l.startswith('{"id"'): continue
        h = json.loads(l.rstrip(','))
        if h['id'] in byid: continue
        t, stars = typ.get(h['cat'], ('hotel', 3))
        r = model({'id': h['id'], 'ort': h['municipality'], 't': t, 's': stars, 'p': h.get('price'), 'u': 'n' if h.get('price') else None})
        scale = (h['rooms'] / r['rm']) if r['rm'] else 1
        r['m'] = [x * scale for x in r['m']]; r['rv'] = [x * scale for x in r['rv']]
        own[h['id']] = (h, r)
    city_rows = [o for o in d if o.get('gm') == 'Luzern'] + [r for h, r in own.values() if h['municipality'] == 'Luzern' and 'lon' in h]
    f_city = calibrate(city_rows, CITY_TARGET)
    json.dump(d, open(ROOT + 'assets/data/unterkuenfte.json', 'w'), ensure_ascii=False, separators=(',', ':'))
    for i, l in enumerate(lines):
        if not l.startswith('{"id"'): continue
        h = json.loads(l.rstrip(','))
        for k in ('m', 'rv', 'ad', 'oc', 'bt', 'rm', 'oct'): h.pop(k, None)
        if h['id'] in byid:
            src = byid[h['id']]
            h['rooms'], h['beds'] = src['rm'], src['bt']
            h.update({k: src[k] for k in ('m', 'rv', 'ad', 'oc')})
        else:
            _, r = own[h['id']]
            h['m'] = [int(round(x)) for x in r['m']]; h['rv'] = [int(round(x)) for x in r['rv']]; h['ad'] = r['ad']; h['oc'] = min(95, r['oc'])
        lines[i] = json.dumps(h, ensure_ascii=False, separators=(',', ': ')) + (',' if l.endswith(',') else '')
    open(ROOT + 'assets/js/hotels.js', 'w').write('\n'.join(lines))
    print('Kalibrierungsfaktor Stadt Luzern: %.2f' % f_city)
