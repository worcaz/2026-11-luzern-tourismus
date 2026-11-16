import json,re,math,unicodedata
from collections import Counter
ROOT=__import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.abspath(__file__)))+"/"
d=json.load(open(ROOT+'assets/data/unterkuenfte.json'))
ORT={'Alpnach':(8.2740,46.9430),'Alpnach Dorf':(8.2760,46.9450),'Alpthal':(8.7033,47.0194),'Altdorf UR':(8.6440,46.8800),'Altishofen':(7.9640,47.1890),'Amsteg':(8.6670,46.7740),'Andermatt':(8.5950,46.6350),'Arth':(8.5200,47.0650),'Attinghausen':(8.6290,46.8650),'Ballwil':(8.2760,47.1170),'Beckenried':(8.4770,46.9640),'Bristen':(8.7010,46.7370),'Brunnen':(8.6070,47.0040),'Brunnen SZ':(8.6070,47.0040),'Brünig':(8.1297,46.7544),'Buochs':(8.4210,46.9740),'Bärau':(7.7960,46.9270),'Bürglen OW':(8.1620,46.7970),'Bürglen UR':(8.6670,46.8800),'Ebnet':(8.0200,46.9800),'Eich':(8.1100,47.1470),'Einsiedeln':(8.7500,47.1270),'Emmen':(8.3000,47.0780),'Emmenbrücke':(8.2960,47.0790),'Emmetten':(8.5280,46.9500),'Engelberg':(8.4040,46.8210),'Engi':(9.0800,46.9200),'Ennetbürgen':(8.4040,46.9810),'Entlebuch':(8.0630,46.9970),'Ermensee':(8.2630,47.2150),'Eschenbach LU':(8.3380,47.1370),'Escholzmatt':(7.9440,46.9130),'Feusisberg':(8.7380,47.1840),'Flüelen':(8.6230,46.9030),'Flüeli-Ranft':(8.2970,46.8530),'Flühli LU':(8.0060,46.8830),'Gelfingen':(8.2700,47.2200),'Gersau':(8.5240,46.9950),'Giswil':(8.1890,46.8360),'Gurtnellen':(8.6200,46.7750),'Göschenen':(8.5900,46.6670),'Haldi b. Schattdorf':(8.6750,46.8620),'Hasle LU':(7.9650,47.0020),'Hasliberg':(8.1980,46.7300),'Hergiswil NW':(8.3000,46.9840),'Hergiswil b. Willisau':(7.9420,47.1300),'Horw':(8.3110,47.0180),'Hospental':(8.5690,46.6240),'Ibach SZ':(8.6350,47.0000),'Illgau':(8.6800,47.0000),'Immensee':(8.4640,47.0970),'Isenthal':(8.5430,46.9150),'Kastanienbaum':(8.3470,47.0120),'Kehrsiten':(8.3450,46.9760),'Kerns':(8.2720,46.9000),'Kleinwangen':(8.2200,47.2230),'Knutwil':(8.0800,47.1700),'Kriens':(8.2790,47.0340),'Küssnacht am Rigi':(8.4410,47.0850),'Lachen SZ':(8.8540,47.1960),'Lauerz':(8.6080,47.0270),'Lenzburg':(8.1710,47.3880),'Lucerne':(8.3090,47.0500),'Lungern':(8.1620,46.7850),'Luzern':(8.3090,47.0500),'Malters':(8.1850,47.0340),'Marbach':(7.9000,46.8100),'Marbach LU':(7.9000,46.8100),'Meggen':(8.3730,47.0460),'Meisterschwanden':(8.2390,47.2930),'Melchsee-Frutt':(8.2780,46.7740),'Melchtal':(8.2530,46.8700),'Menzberg':(7.9400,47.0930),'Merlischachen':(8.4350,47.0780),'Morschach':(8.6340,46.9910),'Muotathal':(8.7600,46.9770),'Neuheim':(8.5760,47.1790),'Nottwil':(8.1400,47.1400),'Obbürgen':(8.3560,46.9780),'Oberiberg':(8.8000,47.0230),'Oberkirch LU':(8.1060,47.1030),'Oberägeri':(8.5870,47.1330),'Ohmstal':(8.0230,47.1620),'Perlen':(8.3790,47.1170),'Pfäffikon SZ':(8.7780,47.2000),'Ramersberg':(8.2470,46.9330),'Rickenbach SZ':(8.6600,47.0000),'Rickenbach b. Schwyz':(8.6600,47.0000),'Rigi Kaltbad':(8.4660,47.0400),'Rigi Klösterli':(8.4890,47.0510),'Rigi Scheidegg':(8.5290,47.0330),'Romoos':(8.0250,46.9960),'Root':(8.3920,47.1130),'Rothenburg':(8.2690,47.0950),'Rothenthurm':(8.6780,47.1280),'Ruswil':(8.1280,47.0800),'Sachseln':(8.2400,46.8730),'Sarnen':(8.2450,46.8960),'Sattel':(8.6200,47.0850),'Schangnau':(7.8610,46.8710),'Schindellegi':(8.7110,47.1730),'Schwarzenberg LU':(8.1220,47.0130),'Schwyz':(8.6540,47.0210),'Schüpfheim':(8.0150,46.9520),'Seedorf UR':(8.6200,46.8870),'Seelisberg':(8.5760,46.9650),'Seengen':(8.1860,47.3270),'Seewen':(8.6200,47.0150),'Seewen SZ':(8.6200,47.0150),'Sempach Station':(8.2000,47.1250),'Sins':(8.3930,47.1930),'Sisikon':(8.6340,46.9610),'St. Niklausen OW':(8.2900,46.8800),'St. Urban':(7.9210,47.2260),'Stans':(8.3660,46.9580),'Stansstad':(8.3380,46.9770),'Steinen':(8.6070,47.0600),'Steinen SZ':(8.6070,47.0600),'Steinerberg':(8.6400,47.0500),'Stoos SZ':(8.6700,46.9780),'Sursee':(8.1090,47.1710),'Sörenberg':(8.0307,46.8218),'Trub':(7.8650,46.9840),'Ufhusen':(7.9090,47.1450),'Unteriberg':(8.8000,47.0500),'Unterkulm':(8.1180,47.3070),'Unterschächen':(8.7700,46.8400),'Vitznau':(8.4820,47.0090),'Wassen UR':(8.5970,46.7050),'Weggis':(8.4300,47.0310),'Werthenstein':(8.0620,47.0750),'Wilen (Sarnen)':(8.2230,46.8850),'Willerzell':(8.7200,47.1150),'Willisau':(7.9920,47.1200),'Wolfenschiessen':(8.4020,46.9100),'Wolhusen':(8.0720,47.0600),'Zug':(8.5170,47.1660),'Blatten-Belalp':(8.0300,46.3920)}
print('missing',sorted({o['o'] for o in d}-set(ORT)))
cnt=Counter(o['o'] for o in d)
def h(s):
    x=2166136261
    for ch in s: x=((x^ord(ch))*16777619)&0xffffffff
    return x
src=open(ROOT+'assets/js/hotels.js').read()
H=[json.loads(l.rstrip(',')) for l in src.split('\n') if l.startswith('{"id"')]
def norm(s): return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',s.lower()).encode('ascii','ignore').decode())
hn=[(norm(x['name']),x) for x in H]
matched=0
for o in d:
    o.pop('a',None)
    lo,la=ORT[o['o']]
    r=0.004+0.0035*math.sqrt(cnt[o['o']]) if cnt[o['o']]>1 else 0
    a=(h(o['id'])%10000)/10000*2*math.pi; rr=r*math.sqrt(((h(o['id'][::-1])%10000)+1)/10000)
    o['lo']=round(lo+rr*math.cos(a)/0.682,5); o['la']=round(la+rr*math.sin(a),5); o['q']='o'
    k=norm(o['n'])
    for kk,x in hn:
        same=(kk==k) or (len(k)>8 and (k in kk or kk in k))
        mun=x['municipality'].lower(); ort=o['o'].lower()
        if same and (mun in ort or ort in mun or (mun=='luzern' and ort in('luzern','lucerne'))):
            o['a']=x['address']; o['q']='a'; matched+=1
            if 'lon' in x: o['lo'],o['la']=x['lon'],x['lat']
            break
print('Adressen aus Mitgliederliste:',matched, Counter(o['q'] for o in d))
json.dump(d,open(ROOT+'assets/data/unterkuenfte.json','w'),ensure_ascii=False,separators=(',',':'))
