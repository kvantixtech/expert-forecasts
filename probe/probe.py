"""Temporary probe (not part of expert-forecasts): which kvantixtech repos are public (unauthenticated GitHub API)."""
import json, time, urllib.request
req = urllib.request.Request("https://api.github.com/users/kvantixtech/repos?per_page=100&type=owner", headers={"User-Agent": "kvantixtech-audit", "Accept": "application/vnd.github+json"})
d = json.load(urllib.request.urlopen(req, timeout=60))
out = {"run_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
       "public": sorted([r["name"], r["archived"], r["description"] is not None, r["fork"]] for r in d)}
json.dump(out, open("probe/result.json", "w"), indent=1)
print("done")
