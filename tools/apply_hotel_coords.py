"""Ersetzt Adresse und Standort der Mitgliederhotels (assets/js/hotels.js) durch die Angaben
des Unterkunftsverzeichnisses (assets/data/unterkuenfte.json), sofern der Name übereinstimmt."""
import json, re, unicodedata, math
ROOT = __file__.rsplit('/tools/', 1)[0] + '/'
d = json.load(open(ROOT + 'assets/data/unterkuenfte.json'))
lines = open(ROOT + 'assets/js/hotels.js').read().split('\n')

def norm(s):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', s.lower()).encode('ascii', 'ignore').decode())

cand = [(norm(o['n']), o) for o in d if o['t'] in ('hotel', 'bnb', 'hostel', 'group', 'camping') and len(norm(o['n'])) >= 6]
n = 0
for i, l in enumerate(lines):
    if not l.startswith('{"id"'):
        continue
    h = json.loads(l.rstrip(','))
    k = norm(h['name'])
    best = None
    for kk, o in cand:
        same = kk == k or (len(k) > 8 and (k in kk or kk in k))
        mun, ort = h['municipality'].lower(), o['o'].lower()
        if same and (mun in ort or ort in mun or (mun == 'luzern' and ort in ('luzern', 'lucerne'))):
            best = o
            if kk == k:
                break
    if not best:
        continue
    if best.get('a'):
        h['address'] = best['a']
    if 'lon' in h:  # nur Stadtbetriebe haben Kartenkoordinaten
        h['lon'], h['lat'] = best['lo'], best['la']
    n += 1
    lines[i] = json.dumps(h, ensure_ascii=False, separators=(',', ': ')) + (',' if l.endswith(',') else '')
open(ROOT + 'assets/js/hotels.js', 'w').write('\n'.join(lines))
print('aktualisiert:', n)
