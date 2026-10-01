"""Temporary probe (not part of expert-forecasts): where can Danish wastewater discharge data be fetched without login?"""
import json, os, re, time, urllib.request, urllib.error, urllib.parse
UA = "kvantixtech/data probe (github actions; validation@kvantix.tech)"
def get(url, n=4000000, data=None, hdr=None):
    h = {"User-Agent": UA, "Accept": "*/*"}; h.update(hdr or {})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=60) as r:
            b = r.read(n); return r.status, r.headers.get("Content-Type"), b.decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, None, (e.read(2000).decode("utf-8", "replace") if hasattr(e, "read") else "")
    except Exception as e:
        return None, None, str(e)[:300]
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
# 1. Arealdata SPA: find its API base in the JS bundle
s, ct, b = get("https://arealdata.miljoeportal.dk/")
scripts = re.findall(r'src="([^"]+\.js)"', b); out["arealdata_scripts"] = scripts[:10]
apis = set()
for sc in scripts[:6]:
    u = sc if sc.startswith("http") else "https://arealdata.miljoeportal.dk" + ("" if sc.startswith("/") else "/") + sc
    s2, _, js = get(u, 8000000)
    apis |= set(re.findall(r'https://[a-z0-9\.\-]*miljoeportal\.dk[^"\'`\s\)]*', js))
    apis |= set(re.findall(r'https://[a-z0-9\.\-]*mim\.dk[^"\'`\s\)]*', js))
out["arealdata_api_strings"] = sorted(apis)[:80]
# 2. Candidate dataset metadata endpoints
cands = ["https://arealdata-api.miljoeportal.dk/datasets/urn:dmp:ds:renseanlaeg-udledning",
         "https://arealdata-api.miljoeportal.dk/api/datasets/urn:dmp:ds:renseanlaeg-udledning",
         "https://arealdata.miljoeportal.dk/api/datasets/urn:dmp:ds:renseanlaeg-udledning"]
for a in sorted(apis):
    if "api" in a and len(cands) < 12: cands.append(a.rstrip("/") + "/datasets/urn:dmp:ds:renseanlaeg-udledning")
out["meta_tries"] = {}
for c in cands:
    s, ct, b = get(c, 20000); out["meta_tries"][c] = {"status": s, "ct": ct, "body": b[:1500]}
    time.sleep(0.5)
# 3. MIM GeoServer: list layers that look like wastewater
for base in ["https://wfs2-miljoegis.mim.dk/ows", "https://arealeditering-dist-geo.miljoeportal.dk/geoserver/ows"]:
    s, ct, b = get(base + "?service=WFS&version=2.0.0&request=GetCapabilities", 30000000)
    names = re.findall(r"<(?:wfs:)?Name>([^<]+)</(?:wfs:)?Name>", b)
    titles = re.findall(r"<(?:wfs:)?Title>([^<]+)</(?:wfs:)?Title>", b)
    hits = [n for n in names if re.search(r"rense|udl|overl|rbu|spild|puls|regnb|udløb|punktk|kloak", n, re.I)]
    out.setdefault("geoserver", {})[base] = {"status": s, "n_layers": len(names), "hits": hits[:80], "sample": names[:15],
                                            "title_hits": [t for t in titles if re.search(r"rense|udled|overl|regnb|spild|punktkild|kloak", t, re.I)][:60]}
# 4. Datavejviser catalogue entry
s, ct, b = get("https://datavejviser.dk/katalog/danmarks-miljoportal/2fe0a061-94e3-465c-a3ac-7171e749561a", 400000)
txt = re.sub(r"<[^>]+>", " ", b); out["datavejviser"] = {"status": s, "urls": sorted(set(re.findall(r'https?://[^\s"\'<>]+', b)))[:60], "text": re.sub(r"\s+", " ", txt)[:2500]}
# 5. DST tables on water and wastewater
s, ct, b = get("https://api.statbank.dk/v1/tables", data=json.dumps({"lang": "da", "format": "JSON"}).encode(), hdr={"Content-Type": "application/json"})
try:
    tabs = json.loads(b); out["dst"] = [{k: t.get(k) for k in ("id", "text", "unit", "firstPeriod", "latestPeriod")} for t in tabs if re.search(r"spildevand|vand(?!r)|renseanl", t.get("text", ""), re.I)][:40]
except Exception as e:
    out["dst"] = str(e)
# 6. GEUS Jupiter open access (what is downloadable)
for u in ["https://www.geus.dk/produkter-ydelser-og-faciliteter/data-og-kort/national-boringsdatabase-jupiter/adgang-til-data/",
          "https://data.geus.dk/geusmap/ows/25832.jsp?service=WFS&version=1.0.0&request=GetCapabilities"]:
    s, ct, b = get(u, 3000000)
    out.setdefault("geus", {})[u] = {"status": s, "links": sorted(set(l for l in re.findall(r'href="([^"]+)"', b) if re.search(r"download|zip|pcjupiter|wfs|api", l, re.I)))[:40],
                                    "layers": re.findall(r"<Name>([^<]+)</Name>", b)[:60]}
os.makedirs("probe", exist_ok=True)
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
