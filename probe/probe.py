"""Temporary probe (not part of expert-forecasts): can the CC0 dataset "Vandkemi Vandløb" be downloaded without a personal login?"""
import json, re, time, urllib.request, urllib.parse, urllib.error
UA = "kvantixtech data access check (github actions; validation@kvantix.tech)"
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
def get(u, n=None, rng=None):
    h = {"User-Agent": UA}
    if rng: h["Range"] = rng
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=120) as r:
            b = r.read(n) if n else r.read()
            return {"status": r.status, "type": r.headers.get("Content-Type"), "length": r.headers.get("Content-Length"),
                    "range": r.headers.get("Content-Range"), "disp": r.headers.get("Content-Disposition"), "final": r.geturl()[:120]}, b
    except urllib.error.HTTPError as e:
        return {"status": e.code, "body": e.read(300).decode("utf-8", "replace")}, b""
cfg = {}
for u in ["https://arealdata.miljoeportal.dk/config", "https://arealdata.miljoeportal.dk/config.json", "https://arealdata-api.miljoeportal.dk/config"]:
    info, b = get(u, 20000); out[u] = info
    try:
        j = json.loads(b); cfg = j if isinstance(j, dict) and not cfg else cfg
        out[u]["keys"] = list(j.keys()) if isinstance(j, dict) else None
    except Exception: pass
cid = cfg.get("clientId") or cfg.get("ClientId")
out["clientId_found"] = bool(cid)
if cid:
    info, b = get("https://arealdata-api.miljoeportal.dk/data/vanda-ue-27/file?clientid=" + urllib.parse.quote(cid), n=4000, rng="bytes=0-3999")
    out["download_with_public_clientid"] = info
    out["first_bytes"] = b[:1500].decode("utf-8", "replace")
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
