import json,re,math
ROOT=__import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))+"/"
d=json.load(open(ROOT+'assets/data/unterkuenfte.json'))
c=json.load(open(ROOT+'tools/crawl_out.json'))
ch=0; st=0; gc=0
for o in d:
    r=c.get(o['id'],{})
    if not r or 'err' in r: continue
    street=(r.get('streetAddress') or '').strip()
    plz=(r.get('postalCode') or '').strip(); loc=(r.get('addressLocality') or o['o']).strip()
    if street or plz:
        o['a']=(street+', ' if street else '')+(plz+' ' if plz else '')+loc
        o['q']='a' if street else o.get('q','o')
        if street: st+=1
        ch+=1
    if 'lat' in r and 'lon' in r and 46.0<r['lat']<48.0 and 7.0<r['lon']<9.5:
        o['la']=round(r['lat'],5); o['lo']=round(r['lon'],5); o['g2']=1; gc+=1
        if not street: o['q']='p'   # nur PLZ-Ort, Koordinate aus Quelle
        else: o['q']='a'
    o.pop('err',None)
print('mit Adresse/PLZ',ch,'mit Strasse',st,'mit Koordinaten',gc,'von',len(d))
json.dump(d,open(ROOT+'assets/data/unterkuenfte.json','w'),ensure_ascii=False,separators=(',',':'))
