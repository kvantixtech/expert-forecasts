"""Temporary probe (not part of expert-forecasts): access check for a nitrogen-source study, round 2.
Only checks formats, field names and sizes. No analysis."""
import json, os, re, time, urllib.request, urllib.parse
UA = "kvantixtech data access check (github actions; validation@kvantix.tech)"
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "docs": {}}
os.makedirs("probe/docs", exist_ok=True)
for f in os.listdir("probe/docs"): os.remove("probe/docs/" + f)
def save(name, u, n=None, method="GET"):
    try:
        req = urllib.request.Request(u, headers={"User-Agent": UA}, method=method)
        with urllib.request.urlopen(req, timeout=180) as r:
            b = b"" if method == "HEAD" else (r.read(n) if n else r.read())
            info = {"url": u, "status": r.status, "type": r.headers.get("Content-Type", ""), "length": r.headers.get("Content-Length"),
                    "disposition": r.headers.get("Content-Disposition"), "bytes": len(b)}
        if b: open("probe/docs/" + name, "wb").write(b)
        out["docs"][name] = info; return b
    except Exception as e:
        out["docs"][name] = {"url": u, "error": str(e)[:300]}; return b""
def wfs(base, layer, tag, count=3):
    q = lambda **k: base + "?" + urllib.parse.urlencode(dict(service="WFS", version="2.0.0", **k))
    save(tag + "_describe.xml", q(request="DescribeFeatureType", typeNames=layer))
    save(tag + "_hits.xml", q(request="GetFeature", typeNames=layer, resultType="hits"), n=4000)
    save(tag + "_sample.json", q(request="GetFeature", typeNames=layer, count=count, outputFormat="application/json"), n=400000)
FVM = "https://geodata.fvm.dk/geoserver/ows"
MIM = "https://wfs2-miljoegis.mim.dk/ows"
VG = "https://vanda-geo.miljoeportal.dk/geoserver/wfs"
for layer, tag in [("Vandmiljoeplaner:ID15oplande_2024", "fvm_id15_2024"), ("Vandmiljoeplaner:ID15_VP3_II_2025", "fvm_id15_2025"),
                   ("Markblokke:Markblokke_2024", "fvm_markblok_2024"), ("GB_MFO_og_groenne_krav:Arealanvendelse_2024", "fvm_arealanv_2024"),
                   ("Jordbunds_og_terraenforhold:Kvaelstofretention", "fvm_retention")]:
    wfs(FVM, layer, tag)
for layer, tag in [("vp3_2endelig2025:vp3_2e2025_ov_maalestation_vandl", "mim_station_vandl"), ("vp4basis2026:vp4_ba_26_kystvand_opland_afg", "mim_kystopland"),
                   ("novana:novana_2017_21_point", "mim_novana_point"), ("vp4basis2026:vp4_ba_26_hovedoplande", "mim_hovedopland")]:
    wfs(MIM, layer, tag)
caps = save("vandageo_caps.xml", VG + "?service=WFS&version=2.0.0&request=GetCapabilities")
out["vandageo_layers"] = [n.decode() for n in re.findall(rb"<(?:wfs:)?Name>([^<]+)</", caps)][:200]
wfs(VG, "vanda:vandkemi-vandloeb", "vg_kemi", count=5)
save("kemi_csv_head", "https://arealdata-api.miljoeportal.dk/data/vanda-ue-27/file", method="HEAD")
save("kemi_csv_first.bin", "https://arealdata-api.miljoeportal.dk/data/vanda-ue-27/file", n=300000)
save("kemi_preview.json", "https://arealdata-api.miljoeportal.dk/data/urn:dmp:ds:vandkemi-vandloeb/preview")
save("kemi_wfs_doc.md", "https://arealdata-api.miljoeportal.dk/datasets/urn:dmp:ds:vandkemi-vandloeb/geoserver-information/wfs/markdown")
save("flow_sample.json", "https://vandah.miljoeportal.dk/api/water-flows?stationId=21006853&from=2024-01-01T00:00Z&to=2024-01-02T00:00Z&format=json")
save("qm_sample.json", "https://vandah.miljoeportal.dk/api/quality-assurance/quality-marks?stationId=21006853&year=2024")
g = save("geus_caps.xml", "https://data.geus.dk/geusmap/ows/25832.jsp?service=WFS&version=1.1.0&request=GetCapabilities")
out["geus_layers_match"] = [n.decode() for n in re.findall(rb"<(?:wfs:)?Name>([^<]+)</", g) if re.search(rb"jord|landsk|geomorf|soil", n, re.I)][:80]
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
