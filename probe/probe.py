"""Temporary probe (not part of expert-forecasts): access check for a nitrogen-source study, round 3.
Only checks formats and whether access needs a login. No analysis."""
import json, os, re, time, urllib.request, urllib.parse
UA = "kvantixtech data access check (github actions; validation@kvantix.tech)"
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "docs": {}}
os.makedirs("probe/docs", exist_ok=True)
for f in os.listdir("probe/docs"): os.remove("probe/docs/" + f)
def save(name, u, n=None, accept=None):
    try:
        h = {"User-Agent": UA}
        if accept: h["Accept"] = accept
        with urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=180) as r:
            b = r.read(n) if n else r.read()
            out["docs"][name] = {"url": u, "status": r.status, "type": r.headers.get("Content-Type", ""), "final": r.geturl(), "bytes": len(b)}
        open("probe/docs/" + name, "wb").write(b); return b
    except Exception as e:
        out["docs"][name] = {"url": u, "error": str(e)[:300]}; return b""
V = "https://vandah.miljoeportal.dk/api"
for name, q in [("flow_a.json", "/water-flows?stationId=21006853&from=2024-06-01T00:00Z&to=2024-06-02T00:00Z"),
                ("flow_b.json", "/water-flows?stationId=21006853&measurementPointNumber=1&from=2024-06-01T00:00Z&to=2024-06-02T00:00Z&format=json"),
                ("flow_c.json", "/water-flows?stationId=21006853&from=2026-09-29T00:00Z&to=2026-09-30T00:00Z&format=json"),
                ("flow_d.json", "/measurements/results/current?stationId=21006853&examinationTypeSc=27&from=2024-06-01T00:00Z&to=2024-06-02T00:00Z&format=json"),
                ("flow_e.json", "/water-flows?stationId=19000467&from=2020-06-01T00:00Z&to=2020-06-02T00:00Z&format=json")]:
    save(name, V + q, n=200000, accept="application/json")
# Kemidata (new chemistry portal): frontend -> API base, anonymous access?
h = save("kemidata_home.html", "https://kemidata.miljoeportal.dk/")
apis = set()
for js in re.findall(rb'src="([^"]+\.js)"', h)[:10]:
    b = save("kemidata_" + os.path.basename(js.decode())[:50], urllib.parse.urljoin("https://kemidata.miljoeportal.dk/", js.decode()))
    apis |= set(re.findall(rb"https?://[A-Za-z0-9.\-]+miljoeportal\.dk[A-Za-z0-9/_\-.{}]*", b))
    apis |= set(re.findall(rb"[\"'](/api/[A-Za-z0-9/_\-.{}]+)", b))
out["kemidata_api_strings"] = sorted(a.decode() for a in apis)[:150]
for name, u in [("kemidata_api_root", "https://kemidata.miljoeportal.dk/api"), ("kemidata_swagger", "https://kemidata.miljoeportal.dk/swagger/v1/swagger.json"),
                ("kemidata_api_swagger", "https://kemidata-api.miljoeportal.dk/swagger/v1/swagger.json")]:
    save(name, u, n=300000)
# ODA web service description
save("oda_services_wsdl.xml", "https://odaforalle.au.dk/Services.asmx?WSDL")
save("oda_services.html", "https://odaforalle.au.dk/Services.asmx")
# HIP catchments (Klimadatastyrelsen / Dataforsyningen) with and without token
for name, u in [("hip_wms_caps.xml", "https://api.dataforsyningen.dk/wms/hip_oplande?service=WMS&request=GetCapabilities"),
                ("hip_wfs_caps.xml", "https://api.dataforsyningen.dk/wfs/hip_oplande?service=WFS&request=GetCapabilities"),
                ("hip_wfs_caps2.xml", "https://api.dataforsyningen.dk/hip_oplande?service=WFS&request=GetCapabilities")]:
    b = save(name, u, n=400000)
    out[name + "_names"] = [x.decode() for x in re.findall(rb"<(?:wfs:)?Name>([^<]+)</", b)][:60]
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
