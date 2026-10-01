"""Temporary probe (not part of expert-forecasts): live-site marker scan of kvantix.tech pages (rerun)."""
import json, os, re, time, urllib.request
UA = "kvantixtech/site-audit check (github actions)"
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA, "Cache-Control": "no-cache"}), timeout=60) as r:
        return r.status, r.read().decode("utf-8", "replace")
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "pages": {}}
urls = set(["https://kvantix.tech/", "https://kvantix.tech/privacy/"])
try:
    _, idx = get("https://kvantix.tech/sitemap_index.xml")
    for sm in re.findall(r"<loc>([^<]+)</loc>", idx):
        try:
            _, s = get(sm); urls |= set(re.findall(r"<loc>([^<]+)</loc>", s))
        except Exception as e: out.setdefault("sitemap_errors", []).append(f"{sm}: {e}")
except Exception as e: out["sitemap_error"] = str(e)
markers = {"ga": r"googletagmanager|gtag\(|G-KGXZK5RQ0T", "monsterinsights": r"monsterinsights", "webmcp": r"WebMCP|modelContext",
           "userfeedback": r"userfeedback", "wpconsent": r"wpconsent", "wpforms": r"wpforms", "extendify": r"extendify",
           "old_landing_566": r"LIVE_SIGNAL_MATRIX|Transparent<br>|ENGINE LIVE", "mobilepay": r"MobilePay", "wpcode_566": r"wpcode[^>]*566",
           "google_fonts": r"fonts\.googleapis|fonts\.gstatic", "binance_fetch": r"api\.binance\.com", "umami": r"umami", "privacy_link": r"kvantix\.tech/privacy/", "umami_cloud_text": r"Umami Cloud"}
for u in sorted(urls)[:80]:
    try:
        st, h = get(u)
        out["pages"][u] = {"status": st, **{k: len(re.findall(p, h, re.I)) for k, p in markers.items()}}
    except Exception as e:
        out["pages"][u] = {"error": str(e)[:150]}
os.makedirs("probe", exist_ok=True)
import urllib.error
class NR(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
op = urllib.request.build_opener(NR)
for u in ["https://kvantix.tech/privacy-policy/", "https://kvantix.tech/privacy"]:
    try:
        r = op.open(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=60); out.setdefault("redirects", {})[u] = [r.status, r.headers.get("Location")]
    except urllib.error.HTTPError as e:
        out.setdefault("redirects", {})[u] = [e.code, e.headers.get("Location")]
json.dump(out, open("probe/result.json", "w"), indent=1)
print("done")
