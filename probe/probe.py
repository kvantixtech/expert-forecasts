"""Temporary probe (not part of expert-forecasts): access check for a nitrogen-source study.
Only checks what can be downloaded and in what format. No analysis."""
import json, os, re, time, urllib.request, urllib.parse
UA = "kvantixtech data access check (github actions; validation@kvantix.tech)"
def get(u, n=None, accept=None):
    h = {"User-Agent": UA}
    if accept: h["Accept"] = accept
    with urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=120) as r:
        return r.status, r.headers.get("Content-Type", ""), (r.read(n) if n else r.read())
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "docs": {}}
os.makedirs("probe/docs", exist_ok=True)
for f in os.listdir("probe/docs"): os.remove("probe/docs/" + f)
def save(name, u, n=None, accept=None):
    try:
        s, ct, b = get(u, n, accept); open("probe/docs/" + name, "wb").write(b)
        out["docs"][name] = {"url": u, "status": s, "type": ct, "bytes": len(b)}
        return b
    except Exception as e:
        out["docs"][name] = {"url": u, "error": str(e)[:200]}
        return b""
def urls_in(b):
    return sorted(set(re.findall(rb"https?://[A-Za-z0-9._/\-?=&%:]+", b)))

# 1. VanDa hydrometry API (flow)
idx = save("vandah_index.js", "https://vandah.miljoeportal.dk/api/swagger/index.js")
for cand in re.findall(rb'url:\s*"([^"]+)"', idx) + [b"/api/swagger/v1/swagger.json", b"/api/swagger/v2/swagger.json"]:
    u = urllib.parse.urljoin("https://vandah.miljoeportal.dk/api/swagger/index.html", cand.decode())
    if save("vandah_swagger_" + re.sub(r"\W", "_", cand.decode())[-40:] + ".json", u): break
save("vandah_stations.json", "https://vandah.miljoeportal.dk/api/stations?format=json", accept="application/json")
save("vandah_exam_types.json", "https://vandah.miljoeportal.dk/api/config/examination-types", accept="application/json")

# 2. Arealdata (Danmarks Miljøportal): frontend config -> API base
home = save("arealdata_home.html", "https://arealdata.miljoeportal.dk/")
found = set()
for js in re.findall(rb'src="([^"]+\.js)"', home)[:8]:
    b = save("arealdata_" + os.path.basename(js.decode())[:60], urllib.parse.urljoin("https://arealdata.miljoeportal.dk/", js.decode()))
    found |= set(u for u in urls_in(b) if b"miljoeportal" in u)
out["arealdata_urls"] = sorted(u.decode() for u in found)[:200]
for base in ["https://arealdata-api.miljoeportal.dk", "https://arealdata.miljoeportal.dk/api"]:
    save("arealdata_ds_" + base.split("//")[1].replace("/", "_") + ".json", base + "/datasets/urn:dmp:ds:vandkemi-vandloeb", accept="application/json")

# 3. Kemidata and ODA pages
save("kemidata_system.html", "https://miljoeportal.dk/systemer/kemidata/")
save("kemidata_launch.html", "https://miljoeportal.dk/nyheder/2025/lancering-af-kemidata-det-nye-miljoedata/")
save("datavejviser_kemi.html", "https://datavejviser.dk/katalog/danmarks-miljoportal/36486fb2-beaa-44fa-b618-d66634144849")
for js in ["MonoRail/JScript/main.js", "JScript/master.js"]:
    save("oda_" + js.replace("/", "_"), "https://odaforalle.au.dk/" + js)

# 4. Catchments and land use: MiljøGIS and Landbrugsstyrelsen capabilities, filtered
for name, u in [("miljoegis_caps.xml", "https://wfs2-miljoegis.mim.dk/ows?service=WFS&version=2.0.0&request=GetCapabilities"),
                ("fvm_caps.xml", "https://geodata.fvm.dk/geoserver/ows?service=WFS&version=2.0.0&request=GetCapabilities")]:
    b = save(name, u)
    names = re.findall(rb"<(?:wfs:)?Name>([^<]+)</(?:wfs:)?Name>", b)
    out[name + "_layers_total"] = len(names)
    out[name + "_layers_match"] = [n.decode() for n in names if re.search(rb"opland|station|maal|m\xc3\xa5l|dyrk|areal|markblok|id15|vandl|kemi|lpis|afgr", n, re.I)][:300]
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
