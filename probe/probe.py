"""Temporary probe (not part of expert-forecasts): sample the public MIM WFS layers on wastewater and DST VANDUD."""
import json, os, re, time, urllib.request, urllib.error, urllib.parse
UA = "kvantixtech/data probe (github actions; validation@kvantix.tech)"
def get(url, n=30000000, data=None, hdr=None):
    h = {"User-Agent": UA, "Accept": "*/*"}; h.update(hdr or {})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h), timeout=120) as r:
            return r.status, r.read(n).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:
        return None, str(e)[:300]
B = "https://wfs2-miljoegis.mim.dk/ows"
s, cap = get(B + "?service=WFS&version=2.0.0&request=GetCapabilities")
names = re.findall(r"<(?:wfs:)?Name>([^<]+)</(?:wfs:)?Name>", cap)
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
out["vp4_layers"] = [n for n in names if n.startswith("vp4basis2026:")]
out["vp3gen_layers"] = [n for n in names if n.startswith("vp3gen2024:")]
want = [n for n in names if re.search(r"punkt_(rbu|rens|ind|spredt)|rbu_saml|renseanlaeg$|theme-vp2_2016-rbu$", n)]
out["sampled"] = {}
for n in want[:14]:
    q = {"service": "WFS", "version": "2.0.0", "request": "GetFeature", "typeNames": n, "count": "3", "outputFormat": "application/json"}
    s, b = get(B + "?" + urllib.parse.urlencode(q), 3000000)
    try:
        j = json.loads(b); feats = j.get("features", [])
        props = [f.get("properties") for f in feats]
    except Exception as e:
        props = [b[:300]]
    s2, h = get(B + "?" + urllib.parse.urlencode({"service": "WFS", "version": "2.0.0", "request": "GetFeature", "typeNames": n, "resultType": "hits"}), 20000)
    m = re.search(r'numberMatched="(\d+)"', h)
    out["sampled"][n] = {"status": s, "matched": m.group(1) if m else None, "sample": props}
    time.sleep(0.5)
# DST VANDUD / VANDRG4
for t in ["VANDUD", "VANDRG4"]:
    s, b = get("https://api.statbank.dk/v1/tableinfo", data=json.dumps({"table": t, "lang": "da", "format": "JSON"}).encode(), hdr={"Content-Type": "application/json"})
    try:
        j = json.loads(b); out.setdefault("dst", {})[t] = {"text": j.get("text"), "unit": j.get("unit"), "vars": [{"id": v["id"], "text": v["text"], "values": [x["text"] for x in v["values"]][:25]} for v in j.get("variables", [])]}
    except Exception as e:
        out.setdefault("dst", {})[t] = str(e) + b[:200]
os.makedirs("probe", exist_ok=True)
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
