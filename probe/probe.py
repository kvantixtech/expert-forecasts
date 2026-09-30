"""Temporary probe (not part of expert-forecasts): third-party hosts, tracking snippets and the data guide source."""
import json, os, re, time, urllib.request
UA = "kvantixtech/site-audit check (github actions)"
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"}), timeout=40) as r:
        return r.read().decode("utf-8", "replace")
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "pages": {}}
for p in ["/", "/playground/", "/playground/energy/"]:
    b = get("https://kvantix.tech" + p)
    hosts = sorted(set(re.findall(r'(?:src|href|action)=["\'](?:https?:)?//([^/"\']+)', b)))
    ctx = [b[max(0, m.start() - 300):m.end() + 300] for m in re.finditer(r"googletagmanager|gtag\(|umami|data-website-id|recaptcha|gstatic|fonts\.googleapis", b)][:8]
    scripts = re.findall(r'<script[^>]*src=["\']([^"\']+)["\']', b)
    out["pages"][p] = {"hosts": hosts, "scripts": scripts, "tracking_context": ctx, "bytes": len(b)}
    time.sleep(1)
os.makedirs("probe", exist_ok=True)
open("probe/dataguide.html", "w", encoding="utf-8").write(get("https://kvantix.tech/wp-content/uploads/kvantix-data-guide.html"))
open("probe/home.html", "w", encoding="utf-8").write(get("https://kvantix.tech/"))
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
