"""Temporary probe (not part of expert-forecasts): does any open MIM layer split nitrogen load by source (agriculture, background, point)?"""
import json, os, re, time, urllib.request, urllib.parse
UA = "kvantixtech/data probe (github actions; validation@kvantix.tech)"
B = "https://wfs2-miljoegis.mim.dk/ows"
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=180) as r: return r.read().decode("utf-8", "replace")
cap = get(B + "?service=WFS&version=2.0.0&request=GetCapabilities")
names = re.findall(r"<(?:wfs:)?Name>([^<]+)</(?:wfs:)?Name>", cap)
cand = [n for n in names if re.search(r"opland|kystvand|kilde|belast|n_tab|kvaelst|tilfoer|indsats|tabel|landbrug|marin_samlet", n, re.I) and re.search(r"vp4basis2026|vp3_2endelig2025|vp3gen2024", n)]
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "candidates": cand, "samples": {}}
for n in cand[:24]:
    try:
        j = json.loads(get(B + "?" + urllib.parse.urlencode({"service": "WFS", "version": "2.0.0", "request": "GetFeature", "typeNames": n, "count": "2", "outputFormat": "application/json"})))
        f = j.get("features", [])
        out["samples"][n] = {"n_returned": len(f), "props": [x.get("properties") for x in f]}
    except Exception as e:
        out["samples"][n] = {"error": str(e)[:200]}
    time.sleep(0.4)
os.makedirs("probe", exist_ok=True)
for f in os.listdir("probe/data") if os.path.isdir("probe/data") else []: os.remove("probe/data/" + f)
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
