"""Temporary probe (not part of expert-forecasts): check the audit findings against the live kvantix.tech."""
import json, os, re, ssl, socket, time, urllib.request, urllib.error
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 kvantix-audit-probe"
def get(url, method="GET"):
    req = urllib.request.Request(url, method=method, headers={"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            body = r.read() if method == "GET" else b""
            return {"status": r.status, "final": r.geturl(), "headers": dict(r.headers.items()), "cookies": r.headers.get_all("Set-Cookie") or [], "body": body.decode("utf-8", "replace")}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "final": url, "headers": dict(e.headers.items()) if e.headers else {}, "cookies": [], "body": ""}
    except Exception as e:
        return {"status": None, "error": str(e)[:200], "body": ""}
B = "https://kvantix.tech"
pages = ["/", "/playground/", "/playground/weather/", "/playground/experts/", "/playground/energy/", "/playground/luck-or-skill/",
         "/playground/lock-your-prediction/", "/playground/track-record/", "/wp-content/uploads/kvantix-data-guide.html"]
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "pages": {}}
pat = {"example_report": r'href="([^"]*example-report[^"]*)"', "portal_request": r'portal\.kvantix\.tech/request', "mailto_request": r'mailto:validation@kvantix\.tech\?subject=Validation',
       "later_2026": r'Later in 2026', "ideas_no_dates": r'Ideas we are working on|no dates yet', "privacy_link": r'href="[^"]*(privacy|privatliv)[^"]*"',
       "terms_link": r'href="[^"]*(terms|vilkaar|vilkår)[^"]*"', "playground_subdomain": r'playground\.kvantix\.tech', "umami": r'umami', "gtag": r'googletagmanager|gtag\(',
       "horizons": r'\b(15m|1h|4h|12h|1d|1w)\b'}
links = set()
for p in pages:
    r = get(B + p); body = r.pop("body", "")
    info = {k: r.get(k) for k in ("status", "final", "error", "cookies")}
    info["title"] = (re.search(r"<title>(.*?)</title>", body, re.S) or [None, None])[1]
    for tag in ("description", "og:image:alt", "og:title", "robots"):
        m = re.search(r'<meta[^>]+(?:name|property)="' + re.escape(tag) + r'"[^>]+content="([^"]*)"', body)
        info[tag] = m.group(1) if m else None
    info["found"] = {k: sorted(set(m if isinstance(m, str) else m[0] for m in re.findall(v, body)))[:12] for k, v in pat.items()}
    info["found"] = {k: v for k, v in info["found"].items() if v}
    if p == "/":
        info["security_headers"] = {h: r["headers"].get(h) for h in ("Strict-Transport-Security", "Content-Security-Policy", "Content-Security-Policy-Report-Only", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "Server", "X-Powered-By")} if r.get("headers") else None
    links |= set(re.findall(r'href="(https://kvantix\.tech/wp-content/uploads/[^"#?]+)"', body))
    out["pages"][p] = info
    time.sleep(1)
out["upload_links"] = {u: get(u, "HEAD").get("status") for u in sorted(links)}
for s in ["/sitemap_index.xml", "/page-sitemap.xml", "/post-sitemap.xml", "/category-sitemap.xml", "/author-sitemap.xml", "/hello-world/", "/robots.txt", "/wp-json/wp/v2/users", "/xmlrpc.php", "/privacy-policy/", "/privacy/"]:
    r = get(B + s); body = r.get("body", "")
    out.setdefault("misc", {})[s] = {"status": r.get("status"), "final": r.get("final"), "locs": re.findall(r"<loc>(.*?)</loc>", body)[:30], "head": body[:300] if s == "/robots.txt" else None}
    time.sleep(0.5)
# certificates
for host in ["kvantix.tech", "playground.kvantix.tech", "portal.kvantix.tech"]:
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, 443), timeout=15) as s:
            with ctx.wrap_socket(s, server_hostname=host) as t:
                c = t.getpeercert(); out.setdefault("tls", {})[host] = {"ok": True, "subjectAltName": [x[1] for x in c.get("subjectAltName", [])][:6], "notAfter": c.get("notAfter")}
    except Exception as e:
        out.setdefault("tls", {})[host] = {"ok": False, "error": str(e)[:200]}
for u in ["https://portal.kvantix.tech/privacy", "https://portal.kvantix.tech/terms", "https://portal.kvantix.tech/request"]:
    r = get(u); body = r.get("body", "")
    out.setdefault("portal", {})[u] = {"status": r.get("status"), "final": r.get("final"), "draft": bool(re.search(r"draft|udkast|legal review|juridisk", body, re.I)),
                                        "hosts": sorted(set(re.findall(r"Hetzner|Simply\.com|Stripe|Umami|Google", body)))}
os.makedirs("probe", exist_ok=True)
json.dump(out, open("probe/result.json", "w"), indent=1, ensure_ascii=False)
print("done")
