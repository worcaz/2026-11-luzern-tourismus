import json,re,time,urllib.request,sys
ROOT=__import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))+"/"
d=json.load(open(ROOT+'assets/data/unterkuenfte.json'))
out={}
try: out=json.load(open(ROOT+'tools/crawl_out.json'))
except: pass
def get(id_):
    req=urllib.request.Request(f'https://openbooking.ch/de/unterkuenfte/{id_}',headers={'User-Agent':'luma-prototype/1.0 (research prototype)'})
    with urllib.request.urlopen(req,timeout=30) as r: return r.read().decode('utf-8','replace')
def parse(s):
    r={}
    m=re.search(r'"address":\{"@type":"PostalAddress"(.*?)\}',s)
    if m:
        for k in ('streetAddress','postalCode','addressLocality'):
            mm=re.search(r'"%s":"(.*?)"'%k,m.group(1))
            if mm: r[k]=mm.group(1)
    g=re.search(r'"geo":\{"@type":"GeoCoordinates","latitude":([\d.]+),"longitude":([\d.]+)',s)
    if g: r['lat']=float(g.group(1)); r['lon']=float(g.group(2))
    return r
n=0
for o in d:
    if o['id'] in out: continue
    for attempt in range(3):
        try:
            out[o['id']]=parse(get(o['id'])); break
        except Exception as e:
            time.sleep(2*(attempt+1))
            if attempt==2: out[o['id']]={'err':str(e)[:80]}
    n+=1
    if n%25==0: json.dump(out,open(ROOT+'tools/crawl_out.json','w'),ensure_ascii=False); print(n,len(out),flush=True)
    time.sleep(0.5)
json.dump(out,open(ROOT+'tools/crawl_out.json','w'),ensure_ascii=False); print('done',len(out))
