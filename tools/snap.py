"""Setzt Betriebe mit Adresse auf das nächstgelegene Gebäude (OpenStreetMap-Grundrisse, assets/data/geo/osm-luzern.json).

Quellkoordinaten und Schätzungen liegen oft auf der Strasse oder im Hof. Für die Karte soll ein Betrieb auf einem Gebäude stehen:
- liegt der Punkt schon in einem Gebäude: unverändert
- sonst: Gebäude in höchstens 150 m, der Punkt wandert in dessen Innenpunkt
- Ferienwohnungen mit nur PLZ/Ort (q = 'p') bleiben bewusst ungenau
Gilt für assets/data/unterkuenfte.json, assets/js/hotels.js (Stadtbetriebe) und HOST_GEO in assets/js/geo.js. Idempotent."""
import json, math, re
ROOT = __file__.rsplit('/tools/', 1)[0] + '/'
M_LON, M_LAT = 75900.0, 111200.0
osm = json.load(open(ROOT + 'assets/data/geo/osm-luzern.json'))
OX, OY = osm['o']
W, S, E, N = osm['bbox']
polys = []
for a in osm['b']:
    x, y = a[0], a[1]; pts = [(OX + x / 1e5, OY + y / 1e5)]
    for k in range(2, len(a), 2):
        x += a[k]; y += a[k + 1]; pts.append((OX + x / 1e5, OY + y / 1e5))
    if len(pts) >= 3: polys.append(pts)

CELL = 0.002
grid = {}
for i, p in enumerate(polys):
    xs = [q[0] for q in p]; ys = [q[1] for q in p]
    for cx in range(int(min(xs) / CELL), int(max(xs) / CELL) + 1):
        for cy in range(int(min(ys) / CELL), int(max(ys) / CELL) + 1):
            grid.setdefault((cx, cy), []).append(i)

def inside(lo, la, ring):
    c = False; j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if (yi > la) != (yj > la) and lo < (xj - xi) * (la - yi) / (yj - yi) + xi: c = not c
        j = i
    return c

def seg_dist(lo, la, a, b):
    ax, ay = a[0] * M_LON, a[1] * M_LAT; bx, by = b[0] * M_LON, b[1] * M_LAT; px, py = lo * M_LON, la * M_LAT
    dx, dy = bx - ax, by - ay; l2 = dx * dx + dy * dy
    t = 0 if l2 == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / l2))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))

def poly_dist(lo, la, ring):
    return min(seg_dist(lo, la, ring[i], ring[(i + 1) % len(ring)]) for i in range(len(ring)))

def inner_point(ring):
    """Punkt im Gebäude nahe am Schwerpunkt"""
    a = cx = cy = 0.0
    for i in range(len(ring)):
        x0, y0 = ring[i]; x1, y1 = ring[(i + 1) % len(ring)]
        f = x0 * y1 - x1 * y0; a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f
    if a != 0:
        c = (cx / (3 * a), cy / (3 * a))
        if inside(c[0], c[1], ring): return c
    xs = [q[0] for q in ring]; ys = [q[1] for q in ring]
    best = None
    for gx in range(1, 12):
        for gy in range(1, 12):
            p = (min(xs) + (max(xs) - min(xs)) * gx / 12, min(ys) + (max(ys) - min(ys)) * gy / 12)
            if inside(p[0], p[1], ring):
                d = math.hypot((p[0] - sum(xs) / len(xs)) * M_LON, (p[1] - sum(ys) / len(ys)) * M_LAT)
                if best is None or d < best[0]: best = (d, p)
    return best[1] if best else ring[0]

def snap(lo, la, radius=150):
    if not (W <= lo <= E and S <= la <= N): return None
    cx, cy = int(lo / CELL), int(la / CELL); rr = int(radius / (CELL * M_LAT)) + 1
    cand = {i for dx in range(-rr, rr + 1) for dy in range(-rr, rr + 1) for i in grid.get((cx + dx, cy + dy), [])}
    for i in cand:
        if inside(lo, la, polys[i]): return (lo, la)  # liegt schon im Gebäude
    best = None
    for i in cand:
        d = poly_dist(lo, la, polys[i])
        if d <= radius and (best is None or d < best[0]): best = (d, i)
    return inner_point(polys[best[1]]) if best else None

n = {'verzeichnis': 0, 'hotels': 0, 'demo': 0}
# 1. Verzeichnis
d = json.load(open(ROOT + 'assets/data/unterkuenfte.json'))
for o in d:
    if o.get('q') == 'p': continue
    r = snap(o['lo'], o['la'])
    if r and (abs(r[0] - o['lo']) > 1e-7 or abs(r[1] - o['la']) > 1e-7):
        o['lo'], o['la'] = round(r[0], 6), round(r[1], 6); o['sn'] = 1; n['verzeichnis'] += 1
json.dump(d, open(ROOT + 'assets/data/unterkuenfte.json', 'w'), ensure_ascii=False, separators=(',', ':'))
# 2. Mitgliederhotels (Stadt): Treffer aus dem Verzeichnis übernehmen, sonst selbst einrasten
byid = {o['lh']: o for o in d if o.get('lh')}
lines = open(ROOT + 'assets/js/hotels.js').read().split('\n')
for i, l in enumerate(lines):
    if not l.startswith('{"id"'): continue
    h = json.loads(l.rstrip(','))
    if 'lon' not in h: continue
    if h['id'] in byid: new = (byid[h['id']]['lo'], byid[h['id']]['la'])
    else: new = snap(h['lon'], h['lat']) or (h['lon'], h['lat'])
    if abs(new[0] - h['lon']) > 1e-7 or abs(new[1] - h['lat']) > 1e-7:
        h['lon'], h['lat'] = round(new[0], 6), round(new[1], 6); n['hotels'] += 1
        lines[i] = json.dumps(h, ensure_ascii=False, separators=(',', ': ')) + (',' if l.endswith(',') else '')
open(ROOT + 'assets/js/hotels.js', 'w').write('\n'.join(lines))
# 3. Demo-Betriebe H1-H6 (HOST_GEO in geo.js)
g = open(ROOT + 'assets/js/geo.js').read()
def fix(m):
    lo, la = float(m.group(2)), float(m.group(3)); r = snap(lo, la, 250)
    if r and (abs(r[0] - lo) > 1e-7 or abs(r[1] - la) > 1e-7): n['demo'] += 1; return f"{m.group(1)}{{ lon: {r[0]:.6f}, lat: {r[1]:.6f} }}"
    return m.group(0)
g = re.sub(r"(H\d: )\{ lon: ([\d.]+), lat: ([\d.]+) \}", fix, g)
open(ROOT + 'assets/js/geo.js', 'w').write(g)
print('verschoben:', n)
