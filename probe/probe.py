"""Temporary probe (not part of expert-forecasts): DatahubPricelist and DayAheadPrices structure for a price collector."""
import hashlib, json, os, time, urllib.request, urllib.parse
from collections import Counter
UA = {"User-Agent": "kvantixtech probe (+https://kvantix.tech; validation@kvantix.tech)"}
E = "https://api.energidataservice.dk/dataset/"
def get(ds, **q):
    url = E + ds + "?" + urllib.parse.urlencode(q)
    for i in range(4):
        try:
            t = time.time()
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r:
                b = r.read(); return {"url": url, "status": r.status, "bytes": len(b), "secs": round(time.time() - t, 1), "sha": hashlib.sha256(b).hexdigest(), "json": json.loads(b)}
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(30 * (i + 1)); continue
            return {"url": url, "status": e.code, "error": str(e)}
        except Exception as e:
            return {"url": url, "status": None, "error": str(e)}
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
# 1. full pricelist, twice, to see size and whether the bytes are stable
a = get("DatahubPricelist", limit=0); time.sleep(5); b = get("DatahubPricelist", limit=0)
recs = a.get("json", {}).get("records", [])
out["pricelist"] = {k: a.get(k) for k in ("status", "bytes", "secs", "sha", "error")}
out["pricelist_second_sha_equal"] = a.get("sha") == b.get("sha")
out["pricelist_total"] = a.get("json", {}).get("total")
out["pricelist_columns"] = list(recs[0].keys()) if recs else None
out["pricelist_sample"] = recs[:3]
out["chargeowners"] = Counter(r.get("ChargeOwner") for r in recs).most_common(120)
out["chargetypes"] = Counter(r.get("ChargeType") for r in recs).most_common()
out["validfrom_years"] = sorted(Counter((r.get("ValidFrom") or "")[:4] for r in recs).items())
out["notes_top"] = Counter(r.get("Note") for r in recs).most_common(60)
out["energinet_like"] = [r for r in recs if "nerginet" in (r.get("ChargeOwner") or "")][:40]
key = lambda r: (r.get("GLN_Number"), r.get("ChargeType"), r.get("ChargeTypeCode"), r.get("ValidFrom"))
out["dup_keys"] = sum(1 for k, n in Counter(map(key, recs)).items() if n > 1)
# order stability: same records in same order?
rb = b.get("json", {}).get("records", [])
out["same_records_ignoring_order"] = sorted(json.dumps(r, sort_keys=True) for r in recs) == sorted(json.dumps(r, sort_keys=True) for r in rb)
out["sorted_request"] = {k: v for k, v in get("DatahubPricelist", limit=5, sort="ValidFrom desc").items() if k != "json"}
# future-dated rows (announced changes)
now = time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime())
out["future_rows"] = sum(1 for r in recs if (r.get("ValidFrom") or "") > now)
# 2. DayAheadPrices: latest rows and when they appear
d = get("DayAheadPrices", start="now-P1D", end="now+P2D", filter=json.dumps({"PriceArea": ["DK1", "DK2"]}), limit=0)
dr = d.get("json", {}).get("records", [])
out["dayahead"] = {k: d.get(k) for k in ("status", "bytes", "error")}
out["dayahead_columns"] = list(dr[0].keys()) if dr else None
out["dayahead_first_last"] = [dr[0], dr[-1]] if dr else None
out["dayahead_n"] = len(dr)
os.makedirs("probe", exist_ok=True)
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False, default=str)
print("done")
