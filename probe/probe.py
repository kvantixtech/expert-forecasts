"""Temporary probe (not part of expert-forecasts): re-check the audit items on the live site."""
import json, os, re, time, urllib.request, urllib.error
UA = "kvantixtech/site-audit check (github actions)"
def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"}), timeout=40) as r:
            return r.status, r.geturl(), dict(r.headers.items()), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, url, dict(e.headers.items()) if e.headers else {}, ""
    except Exception as e:
        return None, url, {}, str(e)
pats = {"googletagmanager": r"googletagmanager", "monsterinsights": r"monsterinsights", "webmcp": r"WebMCP", "umami": r"cloud\.umami\.is",
        "privacy_link": r'href="[^"]*/privacy/"', "portal_request": r"portal\.kvantix\.tech/request", "horizons_1h_12h": r"15m, 1h, 4h, 12h"}
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "pages": {}}
for p in ["/", "/playground/", "/playground/weather/", "/playground/experts/", "/playground/energy/", "/playground/luck-or-skill/",
          "/playground/lock-your-prediction/", "/playground/track-record/", "/privacy/", "/privacy-policy/", "/wp-content/uploads/kvantix-data-guide.html"]:
    s, final, h, b = get("https://kvantix.tech" + p)
    out["pages"][p] = {"status": s, "final": final, "title": (re.search(r"<title>(.*?)</title>", b, re.S) or [None, None])[1],
                       "hits": {k: len(re.findall(v, b)) for k, v in pats.items()}}
    if p == "/":
        out["headers"] = {k: h.get(k) for k in ("Strict-Transport-Security", "X-Frame-Options", "Content-Security-Policy", "Content-Security-Policy-Report-Only", "Referrer-Policy")}
        m = re.search(r'<meta[^>]+property="og:image:alt"[^>]+content="([^"]*)"', b); out["og_image_alt"] = m.group(1) if m else None
    time.sleep(1)
os.makedirs("probe", exist_ok=True)
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
for f in ("dataguide.html", "home.html"):
    if os.path.exists("probe/" + f): os.remove("probe/" + f)
print("done")
