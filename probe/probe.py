"""Temporary probe (not part of expert-forecasts): DCE background-load note and ODA open data access."""
import json, os, re, time, urllib.request
UA = "Mozilla/5.0 (compatible; kvantixtech data probe; validation@kvantix.tech)"
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=180) as r: return r.read()
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "docs": {}}
os.makedirs("probe/docs", exist_ok=True)
for f in os.listdir("probe/docs"): os.remove("probe/docs/" + f)
for name, u in [("baggrund_2014.pdf", "https://dce.au.dk/fileadmin/dce.au.dk/Udgivelser/Notater_2014/Baggrundsbelastning_med_total_N_opdatering.pdf"),
                ("oda_home.html", "https://odaforalle.au.dk/"),
                ("oda_api.html", "https://odaforalle.au.dk/api"),
                ("vandah_api.html", "https://vandah.miljoeportal.dk/api/swagger/index.html")]:
    try:
        b = get(u); open("probe/docs/" + name, "wb").write(b); out["docs"][name] = len(b)
    except Exception as e:
        out["docs"][name] = str(e)[:200]
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
