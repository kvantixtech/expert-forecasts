"""Temporary probe (not part of expert-forecasts): fetch DCE nutrient reports and list DST agriculture nitrogen tables."""
import json, os, re, time, urllib.request
UA = "Mozilla/5.0 (compatible; kvantixtech data probe; validation@kvantix.tech)"
def get(u, data=None, hdr=None):
    h = {"User-Agent": UA}; h.update(hdr or {})
    with urllib.request.urlopen(urllib.request.Request(u, data=data, headers=h), timeout=180) as r: return r.read()
os.makedirs("probe/docs", exist_ok=True)
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "docs": {}}
for name, u in [("SR681_vand_naeringsstoftransport_2024.pdf", "https://dce.au.dk/fileadmin/dce.au.dk/Udgivelser/Videnskabelige_rapporter_600-699/SR681.pdf"),
                ("SR665_kvaelstofretention.pdf", "https://dce.au.dk/fileadmin/dce.au.dk/Udgivelser/Videnskabelige_rapporter_600-699/SR665.pdf"),
                ("N2024_72.pdf", "https://dce.au.dk/fileadmin/dce.au.dk/Udgivelser/Notater_2024/N2024_72.pdf")]:
    try:
        b = get(u); open("probe/docs/" + name, "wb").write(b); out["docs"][name] = len(b)
    except Exception as e:
        out["docs"][name] = str(e)[:200]
tabs = json.loads(get("https://api.statbank.dk/v1/tables", data=json.dumps({"lang": "da", "format": "JSON"}).encode(), hdr={"Content-Type": "application/json"}))
out["dst"] = [{k: t.get(k) for k in ("id", "text", "unit", "firstPeriod", "latestPeriod")} for t in tabs if re.search(r"kvælstof|gødning|husdyr|næringsstof|fosfor|ammoniak|N-|udvask", t.get("text", ""), re.I)]
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
