"""Temporary probe (not part of expert-forecasts): fetch full open wastewater data (DST VANDUD + MIM WFS 2024)."""
import csv, hashlib, io, json, os, re, time, urllib.request, urllib.error, urllib.parse
UA = "kvantixtech/data probe (github actions; validation@kvantix.tech)"
def get(url, data=None, hdr=None):
    h = {"User-Agent": UA, "Accept": "*/*"}; h.update(hdr or {})
    with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=300) as r:
        return r.read()
os.makedirs("probe/data", exist_ok=True)
man = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "files": {}}
def save(name, b, src):
    open("probe/data/" + name, "wb").write(b); man["files"][name] = {"sha256": hashlib.sha256(b).hexdigest(), "bytes": len(b), "source": src}
# DST VANDUD, all cells
q = {"table": "VANDUD", "format": "BULK", "lang": "da", "variables": [{"code": c, "values": ["*"]} for c in ("OMRÅDE", "UDL", "ANLAEG", "Tid")]}
save("dst_vandud.csv", get("https://api.statbank.dk/v1/data", data=json.dumps(q).encode(), hdr={"Content-Type": "application/json"}), "https://api.statbank.dk/v1/data VANDUD")
ti = get("https://api.statbank.dk/v1/tableinfo", data=json.dumps({"table": "VANDUD", "lang": "da", "format": "JSON"}).encode(), hdr={"Content-Type": "application/json"})
save("dst_vandud_tableinfo.json", ti, "https://api.statbank.dk/v1/tableinfo VANDUD")
# MIM WFS: field definitions, licence text, and all features without geometry
B = "https://wfs2-miljoegis.mim.dk/ows"
cap = get(B + "?service=WFS&version=2.0.0&request=GetCapabilities").decode("utf-8", "replace")
man["wfs_service"] = {k: re.findall(r"<ows:%s>([^<]*)</ows:%s>" % (k, k), cap)[:3] for k in ("Title", "Abstract", "Fees", "AccessConstraints")}
for layer, tag in [("vp4basis2026:vp4_ba_26_punkt_rens_saml", "rens_2024"), ("vp4basis2026:vp4_ba_26_punkt_rbu_saml", "rbu_2024"),
                   ("vp3_2endelig2025:vp3_2e2025_punkt_rens_saml", "rens_2017_21"), ("vp3_2endelig2025:vp3_2e2025_punkt_rbu_saml", "rbu_2017_21")]:
    dft = get(B + "?" + urllib.parse.urlencode({"service": "WFS", "version": "2.0.0", "request": "DescribeFeatureType", "typeNames": layer}))
    save(tag + "_schema.xsd", dft, layer)
    rows, start = [], 0
    while True:
        u = B + "?" + urllib.parse.urlencode({"service": "WFS", "version": "2.0.0", "request": "GetFeature", "typeNames": layer, "outputFormat": "application/json",
                                             "count": "5000", "startIndex": str(start), "sortBy": "pkt_id"})
        j = json.loads(get(u)); f = j.get("features", [])
        rows += [x["properties"] for x in f]
        if len(f) < 5000: break
        start += 5000
    cols = sorted({k for r in rows for k in r})
    buf = io.StringIO(); w = csv.DictWriter(buf, fieldnames=cols); w.writeheader()
    for r in rows: w.writerow({k: (v.strip() if isinstance(v, str) else v) for k, v in r.items()})
    save(tag + ".csv", buf.getvalue().encode("utf-8"), layer)
    man["files"][tag + ".csv"]["rows"] = len(rows)
    time.sleep(1)
json.dump(man, open("probe/data/manifest.json", "w"), indent=1, ensure_ascii=False)
open("probe/result.json", "w").write(json.dumps(man, indent=1, ensure_ascii=False))
print("done")
