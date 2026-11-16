"""Ergänzt unterkuenfte.json: Gemeinde (gm) aus den echten Gemeindegrenzen (Punkt-in-Polygon)
und Verweis auf das passende Mitgliederhotel (lh), damit nichts doppelt gezeigt wird."""
import json, re, unicodedata
ROOT = __file__.rsplit('/tools/', 1)[0] + '/'
d = json.load(open(ROOT + 'assets/data/unterkuenfte.json'))
G = json.load(open(ROOT + 'assets/data/geo/gemeinden.json'))

def inside(x, y, ring):
    c = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c

polys = []
for f in G['features']:
    g = f['geometry']
    for poly in ([g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']):
        xs = [p[0] for p in poly[0]]; ys = [p[1] for p in poly[0]]
        polys.append((f['properties']['name'], poly, min(xs), max(xs), min(ys), max(ys)))

def gemeinde(lo, la):
    for name, poly, x0, x1, y0, y1 in polys:
        if x0 <= lo <= x1 and y0 <= la <= y1 and inside(lo, la, poly[0]) and not any(inside(lo, la, h) for h in poly[1:]):
            return name
    return None

def norm(s):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', s.lower()).encode('ascii', 'ignore').decode())

hotels = [json.loads(l.rstrip(',')) for l in open(ROOT + 'assets/js/hotels.js').read().split('\n') if l.startswith('{"id"')]
hn = [(norm(h['name']), h) for h in hotels]
n_gm = n_lh = 0
for o in d:
    o.pop('lh', None)
    gm = gemeinde(o['lo'], o['la'])
    if gm: o['gm'] = gm; n_gm += 1
    else: o.pop('gm', None)
    k = norm(o['n'])
    if len(k) >= 6 and o['t'] in ('hotel', 'bnb', 'hostel', 'group', 'camping'):
        for kk, h in hn:
            same = kk == k or (len(k) > 8 and (k in kk or kk in k))
            mun, ort = h['municipality'].lower(), o['o'].lower()
            if same and (mun in ort or ort in mun or (mun == 'luzern' and ort in ('luzern', 'lucerne'))):
                o['lh'] = h['id']; n_lh += 1
                break
json.dump(d, open(ROOT + 'assets/data/unterkuenfte.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('Gemeinde im Kanton Luzern:', n_gm, '| Verweis auf Mitgliederhotel:', n_lh)
import collections
print(collections.Counter(o.get('gm') for o in d).most_common(12))
