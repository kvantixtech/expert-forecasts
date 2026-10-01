"""Temporary probe (not part of expert-forecasts): access check for a nitrogen-source study, round 4. No analysis."""
import json, os, re, time, urllib.request, urllib.parse, urllib.error
UA = "kvantixtech data access check (github actions; validation@kvantix.tech)"
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "docs": {}}
os.makedirs("probe/docs", exist_ok=True)
for f in os.listdir("probe/docs"): os.remove("probe/docs/" + f)
def save(name, u, n=None):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA, "Accept": "application/json, */*"}), timeout=180) as r:
            b = r.read(n) if n else r.read(); out["docs"][name] = {"url": u, "status": r.status, "bytes": len(b)}
    except urllib.error.HTTPError as e:
        b = e.read(4000); out["docs"][name] = {"url": u, "status": e.code, "body": b.decode("utf-8", "replace")[:600]}
    except Exception as e:
        b = b""; out["docs"][name] = {"url": u, "error": str(e)[:300]}
    if b: open("probe/docs/" + name, "wb").write(b)
    return b
save("hip_wms.txt", "https://api.dataforsyningen.dk/wms/hip_oplande?service=WMS&request=GetCapabilities")
save("hip_wms_DAF.txt", "https://api.dataforsyningen.dk/hip_oplande_DAF?service=WMS&request=GetCapabilities")
save("df_wfs_test.txt", "https://api.dataforsyningen.dk/wfs/hip_oplande_DAF?service=WFS&request=GetCapabilities")
M = "https://wfs2-miljoegis.mim.dk/ows?service=WFS&version=2.0.0&"
save("nbel12_describe.xml", M + "request=DescribeFeatureType&typeNames=vp2_2016:theme-vp2_2016nbel12_deloplande")
save("nbel12_hits.xml", M + "request=GetFeature&resultType=hits&typeNames=vp2_2016:theme-vp2_2016nbel12_deloplande", n=3000)
save("nbel12_sample.json", M + "request=GetFeature&count=2&outputFormat=application/json&typeNames=vp2_2016:theme-vp2_2016nbel12_deloplande", n=300000)
V = "https://vandah.miljoeportal.dk/api/water-flows?format=json&stationId="
cov = {}
for st in ["21006853", "19000467", "42001223", "60000991", "62000010"]:
    for y in [2022, 2023, 2024, 2025]:
        b = save(f"flow_{st}_{y}.json", V + f"{st}&from={y}-03-01T00:00Z&to={y}-03-02T00:00Z", n=500000)
        try:
            d = json.loads(b or b"[]"); r = d[0]["results"] if d and isinstance(d[0], dict) and "results" in d[0] else d
            cov[f"{st}_{y}"] = len(r) if isinstance(r, list) else str(type(r))
        except Exception as e:
            cov[f"{st}_{y}"] = "err " + str(e)[:60]
out["flow_points_1day"] = cov
save("vg_kemi_steder_describe.xml", "https://vanda-geo.miljoeportal.dk/geoserver/wfs?service=WFS&version=2.0.0&request=DescribeFeatureType&typeNames=vanda:steder")
save("vg_kemi_steder_sample.json", "https://vanda-geo.miljoeportal.dk/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&count=3&outputFormat=application/json&typeNames=vanda:steder", n=100000)
save("vg_kemi_19000467.json", "https://vanda-geo.miljoeportal.dk/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&typeNames=vanda:vandkemi-vandloeb&CQL_FILTER=Stationsnummer%20IN%20(%2719000467%27,%2721006853%27,%2742001223%27)", n=100000)
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
