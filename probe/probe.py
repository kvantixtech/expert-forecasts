"""Temporary probe (not part of expert-forecasts): which energy data sources exist, how far back, and on what terms."""
import csv, io, json, os, re, time, urllib.request, urllib.parse

UA = {"User-Agent": "kvantixtech probe (+https://kvantix.tech; validation@kvantix.tech)"}


def fetch(url, data=None, raw=False, timeout=90):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, data=data, headers=dict(UA, **({"Content-Type": "application/json"} if data else {})))
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read()
                return {"status": r.status, "bytes": len(body), "ctype": r.headers.get("Content-Type"), "body": body}
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(20 * (attempt + 1)); continue
            return {"status": e.code, "error": str(e)}
        except Exception as e:
            return {"status": None, "error": str(e)}


def js(url, **kw):
    r = fetch(url, **kw)
    if "body" in r:
        try:
            r["json"] = json.loads(r["body"])
        except Exception:
            r["text"] = r["body"][:1500].decode("utf-8", "replace")
        del r["body"]
    return r


out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}

# 1. Energi Data Service: catalogue, then metadata (dataFrom/dataTo) for every dataset
E = "https://api.energidataservice.dk"
cat_tries = {}
names = []
for p in ["/meta/dataset", "/meta/datasets", "/meta/dataset?limit=500", "/meta/organization", "/meta/organizations", "/dataset"]:
    r = js(E + p)
    j = r.get("json")
    cat_tries[p] = {"status": r.get("status"), "type": type(j).__name__, "preview": json.dumps(j)[:800] if j is not None else r.get("text", r.get("error"))}
    items = j if isinstance(j, list) else (j or {}).get("datasets") or (j or {}).get("result") or (j or {}).get("records") if isinstance(j, dict) else None
    if isinstance(items, list):
        for it in items:
            if isinstance(it, dict):
                n = it.get("datasetName") or it.get("name")
                if n and n not in names:
                    names.append(n)
            elif isinstance(it, str) and it not in names:
                names.append(it)
    time.sleep(1)
out["eds_catalogue_tries"] = cat_tries
guess = ["Elspotprices", "DayAheadPrices", "DatahubPricelist", "ElectricityBalanceNonv", "ImbalancePrice", "RegulatingBalancePowerdata",
         "GasDailyBalancingPrice", "GasMonthlyNeutralPrice", "Gasflow", "StorageUtilization", "ElectricityProdex5MinRealtime",
         "CO2Emis", "DeclarationProduction", "ElectricitySuppliersPerGridarea", "PowerSystemRightNow", "TransmissionLines",
         "CapacityAuctions", "ElspotpricesEUR", "EntryExitGasTariffs", "GasTariffs", "BiogasProduction", "GasQuality"]
out["eds_names_from_catalogue"] = len(names)
for g in guess:
    if g not in names:
        names.append(g)
meta = {}
keep = ["title", "organizationName", "resolution", "dataFrom", "dataTo", "active", "updateFrequency", "lastDataUpdate", "caution", "description"]
for n in names:
    r = js(f"{E}/meta/dataset/{urllib.parse.quote(n)}")
    j = r.get("json")
    meta[n] = {k: (str(j.get(k))[:500] if k in ("caution", "description") else j.get(k)) for k in keep} if isinstance(j, dict) and j.get("datasetName") else {"status": r.get("status"), "error": r.get("error")}
    time.sleep(1.5)
out["eds_meta"] = meta

# Elafgift and Energinet tariffs as stored in DatahubPricelist
for label, flt in [("elafgift", {"Note": ["Elafgift"]}), ("energinet_charges", {"ChargeOwner": ["Energinet Systemansvar A/S (SYO)"]})]:
    r = js(f"{E}/dataset/DatahubPricelist?" + urllib.parse.urlencode({"filter": json.dumps(flt), "limit": 2000, "sort": "ValidFrom asc"}))
    recs = (r.get("json") or {}).get("records", [])
    out[f"pricelist_{label}"] = {"status": r.get("status"), "total": (r.get("json") or {}).get("total"),
                                 "records": [{k: v for k, v in x.items() if k in ("ChargeOwner", "ChargeTypeCode", "Note", "Description", "ValidFrom", "ValidTo", "Price1", "Price18")} for x in recs][:400]}
    time.sleep(2)

# 2. Danmarks Statistik: every table whose text mentions energy prices or taxes
D = "https://api.statbank.dk/v1"
r = js(f"{D}/tables", data=json.dumps({"lang": "da", "format": "JSON", "includeInactive": False}).encode())
tabs = r.get("json") or []
pat = re.compile(r"\b(el|elektricitet|energi\w*|gas\w*|olie\w*|benzin|diesel|brændsel\w*|fjernvarme|afgift\w*|strøm)\b", re.I)
hits = [t for t in tabs if isinstance(t, dict) and pat.search(t.get("text", ""))]
out["dst_tables_total"] = len(tabs)
out["dst_hits"] = [{k: t.get(k) for k in ("id", "text", "unit", "firstPeriod", "latestPeriod", "updated")} for t in hits][:200]

# 3. Eurostat: consumer energy prices for Denmark
X = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
eu = {}
for ds in ["nrg_pc_204", "nrg_pc_202", "nrg_pc_205", "nrg_pc_203", "nrg_pc_204_h", "nrg_pc_202_h", "nrg_pc_204_c"]:
    r = js(f"{X}/{ds}?geo=DK&lang=en")
    j = r.get("json") or {}
    try:
        times = sorted(j["dimension"]["time"]["category"]["index"])
        eu[ds] = {"status": r.get("status"), "label": j.get("label"), "first": times[0], "last": times[-1], "n_time": len(times), "values": len(j.get("value", {}))}
    except Exception as e:
        eu[ds] = {"status": r.get("status"), "error": r.get("error") or str(e)}
    time.sleep(1)
out["eurostat"] = eu

# 4. Oil and gas benchmarks without keys
fred = {}
for sid in ["DCOILBRENTEU", "POILBREUSDM", "DHHNGSP", "PNGASEUUSDM", "DCOILWTICO"]:
    r = fetch(f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}")
    if "body" in r:
        rows = [x for x in csv.reader(io.StringIO(r["body"].decode())) if x]
        vals = [x for x in rows[1:] if len(x) > 1 and x[1] not in ("", ".")]
        fred[sid] = {"status": r["status"], "header": rows[0], "first": vals[0] if vals else None, "last": vals[-1] if vals else None, "n": len(vals)}
    else:
        fred[sid] = r
out["fred"] = fred
other = {}
for label, url in [("eia_brent_daily_xls", "https://www.eia.gov/dnav/pet/hist_xls/RBRTEd.xls"),
                   ("eia_henryhub_daily_xls", "https://www.eia.gov/dnav/ng/hist_xls/RNGWHHDd.xls"),
                   ("eia_api_v2_nokey", "https://api.eia.gov/v2/petroleum/pri/spt/data/?frequency=daily&data[0]=value&facets[series][]=RBRTE&length=1"),
                   ("worldbank_pinksheet_monthly", "https://thedocs.worldbank.org/en/doc/5d903e848db1d1b83e0ec8f744e55570-0350012021/related/CMO-Historical-Data-Monthly.xlsx"),
                   ("ecb_eurdkk_first", "https://data-api.ecb.europa.eu/service/data/EXR/D.DKK.EUR.SP00.A?format=csvdata&firstNObservations=1"),
                   ("ecb_eurusd_first", "https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?format=csvdata&firstNObservations=1"),
                   ("entsoe_nokey", "https://web-api.tp.entsoe.eu/api?documentType=A44&in_Domain=10YDK-1--------W&out_Domain=10YDK-1--------W&periodStart=202609010000&periodEnd=202609020000")]:
    r = fetch(url)
    other[label] = {k: v for k, v in r.items() if k != "body"}
    if "body" in r and label.startswith(("ecb", "eia_api", "entsoe")):
        other[label]["text"] = r["body"][:600].decode("utf-8", "replace")
    time.sleep(1)
out["other"] = other

os.makedirs("probe", exist_ok=True)
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False, default=str)
print("done", len(names), "EDS names;", len(hits), "DST hits")
