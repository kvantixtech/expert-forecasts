"""Temporary probe (not part of expert-forecasts): live-site asset check for kvantix.tech."""
import hashlib, json, os, re, time, urllib.request, urllib.parse
UA = "kvantixtech/site-audit check (github actions)"
LOCAL = {"kvx-experts.js": "3c17abdf4c0be89d48d1e373cb51bd3732ddbc33c3d756a6fc4af714d717338b", "kvx-energy.js": "fff47e2a43f071e362f0aa45bbb1309d5fb84c7cadbf7587fbb0e7fba9d6e388", "kvx-luck.js": "61077915a0c609a3238969e266787deb83ebd073881846d57774a6f6788fa604", "kvx-weather.js": "0fb58ff6f5cf0d9a39926fff4784fee9fd3d9a40775b9b0a71912a76811f6b17", "kvx-seal.js": "dccd34f173642d8d5cf92d68a2895f6e4ff94be9423952369311c6331b867072", "kvx-wastewater.js": "2887b63d8611e04562b9b066a67c52d392b7571422a0f1e5bfa842ea0c333afb", "kvx-track.js": "2e8b0f5d02f85331966b143cbda3c536c9edd6d96e2c85f5c11a0338bdddde64"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA, "Cache-Control": "no-cache"}), timeout=60) as r:
        return r.status, r.headers.get("Content-Type", ""), r.read()
pages = ["", "playground/", "playground/energy/", "playground/experts/", "playground/lock-your-prediction/", "playground/luck-or-skill/",
         "playground/track-record/", "playground/weather/", "playground/wastewater/", "privacy/"]
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "pages": {}, "assets": {}}
assets = set()
for p in pages:
    u = "https://kvantix.tech/" + p
    try:
        st, ct, b = get(u); h = b.decode("utf-8", "replace")
        refs = set(re.findall(r'(?:src|href)=["\']([^"\']+)["\']', h)) | set(re.findall(r'url\(["\']?([^"\')]+)', h))
        refs |= set(re.findall(r'["\'](/wp-content/uploads/kvx/[^"\']+)["\']', h))
        # kvx loader: base + file + ?v=
        for m in re.findall(r'(kvx-[a-z]+\.js)\?v=([0-9a-z]+)', h): refs.add("/wp-content/uploads/kvx/%s?v=%s" % m)
        mine = sorted(urllib.parse.urljoin(u, r) for r in refs if ("kvantix.tech" in urllib.parse.urljoin(u, r)) and "/wp-content/uploads/" in urllib.parse.urljoin(u, r))
        out["pages"][p or "/"] = {"status": st, "uploads_refs": len(mine), "v": sorted(set(re.findall(r'kvx-[a-z]+\.js\?v=[0-9a-z]+', h))), "fixed_card": "kvx-ww-fixedtable" in h}
        assets |= set(mine)
    except Exception as e:
        out["pages"][p or "/"] = {"error": str(e)[:150]}
for a in sorted(assets):
    try:
        st, ct, b = get(a); name = os.path.basename(urllib.parse.urlparse(a).path)
        out["assets"][a] = {"status": st, "type": ct, "bytes": len(b), "same_as_build": (hashlib.sha256(b).hexdigest() == LOCAL[name]) if name in LOCAL else None}
    except Exception as e:
        out["assets"][a] = {"error": str(e)[:120]}
json.dump(out, open("probe/result.json", "w"), indent=1)
print("done")
