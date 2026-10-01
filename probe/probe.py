"""Temporary probe (not part of expert-forecasts): VP4 layer schemas for a nitrogen-source study, round 5. No analysis."""
import json, os, re, time, urllib.request, urllib.parse, urllib.error
UA = "kvantixtech data access check (github actions; validation@kvantix.tech)"
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "layers": {}}
os.makedirs("probe/docs", exist_ok=True)
for f in os.listdir("probe/docs"): os.remove("probe/docs/" + f)
def get(u, n=None):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=180) as r:
        return r.read(n) if n else r.read()
M = "https://wfs2-miljoegis.mim.dk/ows?service=WFS&version=2.0.0&"
for lay in ["punkt_ferskdam_saml", "punkt_ind_saml", "punkt_spredt_saml", "lulc_map_poly", "opl_delopl", "opl_helopl", "opl_rensekl_pavirk", "kystvandsopland_tabel_1"]:
    t = "vp4basis2026:vp4_ba_26_" + lay; info = {}
    try:
        d = get(M + "request=DescribeFeatureType&typeNames=" + t)
        info["fields"] = [m.decode() for m in re.findall(rb'name="([^"]+)"[^>]*type="(?:xsd|gml):', d)]
        h = get(M + "request=GetFeature&resultType=hits&typeNames=" + t, 3000)
        info["count"] = re.findall(rb'numberMatched="(\d+)"', h)[0].decode()
        props = [k for k in info["fields"] if k not in ("wkb_geometry", "the_geom", "geom")]
        s = get(M + "request=GetFeature&count=3&outputFormat=application/json&typeNames=" + t + "&propertyName=" + ",".join(props), 200000)
        info["sample"] = [f["properties"] for f in json.loads(s)["features"]]
    except Exception as e:
        info["error"] = str(e)[:300]
    out["layers"][lay] = info
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
