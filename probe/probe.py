"""Temporary probe (not part of expert-forecasts): what do Energi Data Service datasets contain?"""
import json, time, urllib.request, urllib.parse, os
B = "https://api.energidataservice.dk"
UA = {"User-Agent": "kvantixtech probe (+https://kvantix.tech; validation@kvantix.tech)"}
def get(path, **q):
    url = B + path + ("?" + urllib.parse.urlencode(q) if q else "")
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
            return json.load(r)
    except Exception as e:
        return {"error": str(e), "url": url}
out = {}
names = ["CO2EmisProg", "CO2Emis", "Forecasts_Hour", "Forecasts_5Min", "ProductionConsumptionSettlement", "ElectricityProdex5MinRealtime", "DeclarationEmissionHour"]
for n in names:
    out[n] = {"meta": get(f"/meta/dataset/{n}"),
              "latest": get(f"/dataset/{n}", limit=6, sort=(("Minutes5UTC" if "5Min" in n or "CO2Emis" in n or "Prodex" in n else "HourUTC") + " desc")),
              "oldest": get(f"/dataset/{n}", limit=3, sort=(("Minutes5UTC" if "5Min" in n or "CO2Emis" in n or "Prodex" in n else "HourUTC") + " asc"))}
    time.sleep(2)
# Forecasts_Hour: a past day, DK1, to see forecast vintages next to each other
out["Forecasts_Hour_pastday"] = get("/dataset/Forecasts_Hour", start="2026-09-01T00:00", end="2026-09-01T03:00", filter=json.dumps({"PriceArea": ["DK1"]}))
# CO2EmisProg: is a future value overwritten between two issues? Fetch the next 12 hours twice, 20 minutes apart.
q = dict(start="now", end="now+P0DT12H", filter=json.dumps({"PriceArea": ["DK1"]}), limit=500)
a = get("/dataset/CO2EmisProg", **q); time.sleep(1200); b = get("/dataset/CO2EmisProg", **q)
ra = {r["Minutes5UTC"]: r["CO2Emission"] for r in a.get("records", [])}
rb = {r["Minutes5UTC"]: r["CO2Emission"] for r in b.get("records", [])}
common = sorted(set(ra) & set(rb))
out["CO2EmisProg_overwrite_test"] = {"n_first": len(ra), "n_second": len(rb), "common": len(common),
    "changed": sum(1 for k in common if ra[k] != rb[k]), "rows_per_timestamp_first": (len(a.get("records", [])) / max(1, len(ra))),
    "examples": [(k, ra[k], rb[k]) for k in common if ra[k] != rb[k]][:10], "first_range": [min(ra, default=None), max(ra, default=None)]}
os.makedirs("probe", exist_ok=True)
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
