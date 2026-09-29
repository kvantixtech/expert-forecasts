#!/usr/bin/env python3
"""Fetches the sources in tools/sources.json and writes EVIDENCE, not documents.

For every source:
  evidence/index.csv   id, url, HTTP status, bytes, SHA-256 of the downloaded file, fetched_at
  evidence/<id>.txt    only the lines that quote forecast figures (with page numbers), plus
                       PDF links found on HTML pages

The documents themselves are not committed (they are the publishers' copyright). Anyone can
download the URL, check the SHA-256 and find the quoted line on the stated page.

Statistics Denmark: table metadata and data from the public StatBank API are saved in data/dst/.
Needs: python3, curl, pdftotext (poppler-utils). Runs in GitHub Actions (see .github/workflows).
"""
import csv, hashlib, html, json, os, re, subprocess, sys, tempfile, time, urllib.parse, urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = "kvantixtech/expert-forecasts (+https://github.com/kvantixtech/expert-forecasts; validation@kvantix.tech)"
KEY = re.compile(r"(BNP|bruttonationalprodukt|GDP|forbrugerpris|consumer price|HICP|inflation|realvækst|"
                 r"nøgletal|key (economic )?(figures|variables)|centrale skøn|tabel|table|prognose|projection)", re.I)
NUM = re.compile(r"-?\d+[,.]\d")
MAX_LINES = 800
GAP = re.compile(r"\s{3,}")
YEARS = re.compile(r"\b(?:19|20)\d\d\b")


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def download(url, path):
    r = subprocess.run(["curl", "-sSL", "--http1.1", "--max-time", "180", "--retry", "3", "--retry-delay", "5", "--retry-all-errors", "-A", UA, "-o", path,
                        "-w", "%{http_code}", url], capture_output=True, text=True)
    return r.stdout.strip() or "000", r.stderr.strip()


def pdf_lines(path):
    r = subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True)
    out, pages = [], r.stdout.split("\f")
    for pno, page in enumerate(pages, start=1):
        lines = page.splitlines()
        for i, line in enumerate(lines):
            s = line.strip()
            if not s:
                continue
            if KEY.search(s) and (NUM.search(s) or re.match(r"^(tabel|table)\b", s, re.I)):
                out.append("p.%d: %s" % (pno, GAP.sub("  |  ", s)))
            elif (len(NUM.findall(s)) >= 3 or len(YEARS.findall(s)) >= 2) and i > 0 and any(KEY.search(x) for x in lines[max(0, i - 25):i]):
                out.append("p.%d: %s" % (pno, GAP.sub("  |  ", s)))
    return out[:MAX_LINES], len(pages)


def page_lines(path, base):
    raw = open(path, "rb").read().decode("utf-8", "replace")
    links = sorted(set(re.findall(r'href="([^"]+\.pdf[^"]*)"', raw, re.I)))
    links = [html.unescape(l if l.startswith("http") else urllib.parse.urljoin(base, l)) for l in links]
    text = re.sub(r"(?is)<(script|style).*?</\1>", " ", raw)
    text = re.sub(r"(?s)<[^>]+>", "\n", text)
    text = html.unescape(text)
    lines = [re.sub(r"\s+", " ", l).strip() for l in text.splitlines()]
    hits = [l for l in lines if l and KEY.search(l) and NUM.search(l)]
    return hits[:MAX_LINES], links


def statbank(entry):
    os.makedirs(os.path.join(ROOT, "data", "dst"), exist_ok=True)
    tid = entry["id"]
    if entry.get("info"):
        req = urllib.request.Request(f"https://api.statbank.dk/v1/tableinfo/{tid}?format=JSON&lang=en", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as r:
            info = json.load(r)
        slim = {"id": info.get("id"), "text": info.get("text"), "updated": info.get("updated"),
                "variables": [{"id": v["id"], "text": v["text"], "values": v["values"][:60] if v["id"] != "Tid" else v["values"]}
                              for v in info.get("variables", [])]}
        json.dump(slim, open(os.path.join(ROOT, "data", "dst", f"{tid}-info.json"), "w"), indent=1, ensure_ascii=False)
    for q in entry.get("data", []):
        body = json.dumps({"table": tid, "format": "CSV", "lang": "en", "delimiter": "Semicolon", "variables": q["variables"]}).encode()
        req = urllib.request.Request("https://api.statbank.dk/v1/data", data=body, headers={"User-Agent": UA, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=60) as r:
            open(os.path.join(ROOT, "data", "dst", f"{tid}-{q['name']}.csv"), "wb").write(r.read())


def main():
    cfg = json.load(open(os.path.join(ROOT, "tools", "sources.json"), encoding="utf-8"))
    only = set(sys.argv[1:])
    os.makedirs(os.path.join(ROOT, "evidence"), exist_ok=True)
    idx_path = os.path.join(ROOT, "evidence", "index.csv")
    index = {}
    if os.path.exists(idx_path):
        index = {r["id"]: r for r in csv.DictReader(open(idx_path, encoding="utf-8"))}
    with tempfile.TemporaryDirectory() as tmp:
        for s in cfg["sources"]:
            if only and s["id"] not in only:
                continue
            f = os.path.join(tmp, s["id"])
            code, err = download(s["url"], f)
            size = os.path.getsize(f) if os.path.exists(f) else 0
            sha = hashlib.sha256(open(f, "rb").read()).hexdigest() if size else ""
            head = [f"# {s['id']}", f"# url: {s['url']}", f"# http: {code}  bytes: {size}  sha256: {sha}", f"# fetched: {now()}"]
            body = []
            if code.startswith("2") and size:
                is_pdf = open(f, "rb").read(5) == b"%PDF-"
                if s["kind"] == "pdf" and is_pdf:
                    body, npages = pdf_lines(f)
                    head.append(f"# pages: {npages}  (lines below are quotes; p.N = PDF page)")
                else:
                    body, links = page_lines(f, s["url"])
                    head.append(f"# html page{' (expected PDF, got HTML)' if s['kind'] == 'pdf' else ''}")
                    body += ["", "# PDF links on this page:"] + links
            else:
                prev = index.get(s["id"])
                if prev and str(prev.get("http", "")).startswith("2"):
                    print(f"{s['id']:<22} {code} fetch failed, keeping the evidence from {prev['fetched_at']}")
                    continue
                head.append(f"# FAILED: {err[:200]}")
            open(os.path.join(ROOT, "evidence", f"{s['id']}.txt"), "w", encoding="utf-8").write("\n".join(head + [""] + body) + "\n")
            index[s["id"]] = {"id": s["id"], "url": s["url"], "http": code, "bytes": size, "sha256": sha, "fetched_at": now()}
            print(f"{s['id']:<22} {code} {size:>9} {len(body)} lines")
            time.sleep(1.5)
    with open(idx_path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["id", "url", "http", "bytes", "sha256", "fetched_at"])
        w.writeheader()
        for k in sorted(index):
            w.writerow(index[k])
    if cfg.get("statbank_search") and not only:
        try:
            req = urllib.request.Request("https://api.statbank.dk/v1/tables?format=JSON&lang=en", headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                tables = json.load(r)
            pat = re.compile("|".join(cfg["statbank_search"]), re.I)
            hits = [{"id": t["id"], "text": t["text"], "updated": t.get("updated")} for t in tables if pat.search(t.get("text", ""))]
            os.makedirs(os.path.join(ROOT, "data", "dst"), exist_ok=True)
            json.dump(hits, open(os.path.join(ROOT, "data", "dst", "tables-search.json"), "w"), indent=1, ensure_ascii=False)
            print(f"statbank search: {len(hits)} tables")
        except Exception as ex:  # noqa: BLE001
            print(f"statbank search FAILED: {ex}")
    for e in cfg.get("statbank", []):
        if only and e["id"] not in only:
            continue
        try:
            statbank(e)
            print(f"statbank {e['id']} ok")
        except Exception as ex:  # noqa: BLE001
            print(f"statbank {e['id']} FAILED: {ex}")


if __name__ == "__main__":
    main()
