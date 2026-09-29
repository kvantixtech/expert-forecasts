#!/usr/bin/env python3
"""Is the page on kvantix.tech showing exactly these results?

Downloads the page's data file (kvx-experts.js), reads the embedded results and compares them
with results/results.json. Exit code 1 if anything differs. Standard library only.

  python3 tools/live_check.py [URL]
"""
import json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "https://kvantix.tech/wp-content/uploads/kvx/kvx-experts.js"


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else URL
    req = urllib.request.Request(url, headers={"User-Agent": "kvantixtech/expert-forecasts live check (github actions)"})
    js = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
    m = re.search(r"var DATA = (\{.*?\});\n", js)
    if not m:
        print(f"Could not find the embedded data in {url}")
        return 1
    live = json.loads(m.group(1))
    repo = json.load(open(os.path.join(ROOT, "results", "results.json"), encoding="utf-8"))
    key = lambda r: (r["forecaster"], r["variable"], r["vintage"], r["excluding_2020"])
    pkey = lambda p: (p["forecaster"], p["variable"], p["vintage"], p["target"])
    diffs = []
    for name, k in (("scores", key), ("points", pkey)):
        a = {k(r): r for r in repo[name]}
        b = {k(r): r for r in live.get(name, [])}
        for x in sorted(set(a) | set(b), key=str):
            if a.get(x) != b.get(x):
                diffs.append(f"{name} {x}: repository {a.get(x)} · site {b.get(x)}")
    print(f"Site data: {url} (built from commit {live.get('commit', '?')}, data {live.get('fetched', '?')})\n")
    if diffs:
        print(f"{len(diffs)} difference(s):\n")
        print("\n".join("- " + d for d in diffs[:40]))
        return 1
    print(f"Identical: {len(repo['scores'])} scores and {len(repo['points'])} year-by-year points.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
