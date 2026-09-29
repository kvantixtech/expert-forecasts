#!/usr/bin/env python3
"""Monthly check: has Statistics Denmark revised any outcome since the published results?

Fetches the StatBank tables listed in tools/sources.json into a temporary folder, rebuilds the
outcomes, and compares them with data/outcomes.csv (the figures the published results use).
It writes drift/REPORT.md. It never changes data/, results/ or the website: published results
change only in a new, dated edition (see CHANGELOG.md).

  python3 tools/drift.py            (standard library only)
"""
import csv, json, os, sys, tempfile, urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import outcomes as OC  # noqa: E402
import score as SC  # noqa: E402

UA = "kvantixtech/expert-forecasts drift check (+https://github.com/kvantixtech/expert-forecasts)"
NAMES = {"gdp": "GDP growth", "cpi": "CPI", "hicp": "HICP", "pce_deflator": "private consumption deflator"}


def fetch(dst):
    cfg = json.load(open(os.path.join(ROOT, "tools", "sources.json"), encoding="utf-8"))
    for e in cfg.get("statbank", []):
        for q in e.get("data", []):
            body = json.dumps({"table": e["id"], "format": "CSV", "lang": "en", "delimiter": "Semicolon",
                               "variables": q["variables"]}).encode()
            req = urllib.request.Request("https://api.statbank.dk/v1/data", data=body,
                                         headers={"User-Agent": UA, "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as r:
                open(os.path.join(dst, f"{e['id']}-{q['name']}.csv"), "wb").write(r.read())


def headline(outcomes):
    f = SC.load("forecasts.csv")
    rows, _, _ = SC.score(f, outcomes)
    return {(r["forecaster"], r["variable"]): r for r in rows if r["vintage"] == "latest" and not r["excluding_2020"]}


def main():
    published = SC.load("outcomes.csv")
    with tempfile.TemporaryDirectory() as tmp:
        fetch(tmp)
        fresh = [{k: str(v) for k, v in r.items()} for r in OC.build(tmp)]
    old = {(r["index"], r["year"]): r["value"] for r in published if r["vintage"] == "latest"}
    new = {(r["index"], r["year"]): r["value"] for r in fresh if r["vintage"] == "latest"}
    changed = sorted(k for k in set(old) | set(new) if old.get(k) != new.get(k))
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out = ["# Drift check", "",
           f"Checked **{today}** against Statistics Denmark (StatBank API). Written by `tools/drift.py`, run monthly by "
           "the `drift` workflow. This report never changes the published results; they change only in a new, dated edition.", ""]
    if not changed:
        out += ["**No change.** Every outcome used by the published results is still what Statistics Denmark publishes.", ""]
    else:
        out += [f"**{len(changed)} outcome(s) differ** from the figures the published results use.", "",
                "| Index | Year | In published results | Statistics Denmark now | Change |", "|---|---|---|---|---|"]
        for k in changed:
            o, n = old.get(k), new.get(k)
            d = f"{float(n) - float(o):+.2f}" if o and n else "new" if n else "removed"
            out.append(f"| {NAMES.get(k[0], k[0])} | {k[1]} | {o or '–'} | {n or '–'} | {d} |")
        before, after = headline(published), headline(published_like(published, fresh))
        out += ["", "What the headline scoreboard would say with today's figures (latest vintage, all years):", "",
                "| Forecaster | Variable | Forecast error: published → today | Lazy guess error: published → today | Beat the lazy guess: published → today |", "|---|---|---|---|---|"]
        for key in before:
            b, a = before[key], after.get(key)
            if not a:
                continue
            out.append(f"| {key[0]} | {key[1]} | {b['mae_forecast']:.2f} → {a['mae_forecast']:.2f} | "
                       f"{b['mae_baseline']:.2f} → {a['mae_baseline']:.2f} | {b['beat_baseline']} → {a['beat_baseline']} of {a['years_with_baseline']} |")
        out += ["", "\"Published\" is the current edition. \"Today\" is what a new edition would show if it were made now.", ""]
    os.makedirs(os.path.join(ROOT, "drift"), exist_ok=True)
    open(os.path.join(ROOT, "drift", "REPORT.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    print("\n".join(out))
    if changed and os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as fh:
            fh.write(f"changed={len(changed)}\n")


def published_like(published, fresh):
    """Fresh latest-vintage outcomes, with the published first-estimate rows unchanged."""
    return [r for r in fresh if r["vintage"] == "latest"] + [r for r in published if r["vintage"] != "latest"]


if __name__ == "__main__":
    main()
