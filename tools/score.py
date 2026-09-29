#!/usr/bin/env python3
"""Scores the forecasts in data/forecasts.csv against data/outcomes.csv, following METHOD.md.

  python3 tools/score.py          writes results/scores.csv, results/tables.md, results/results.json
  python3 tools/score.py --check  only validates the data (every quote must appear in its evidence file)

Standard library only. Deterministic: same inputs, same bytes out.
"""
import csv, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORECASTERS = [("ØR", "Økonomisk Redegørelse (Ministry of Finance / Economy)"),
               ("NB", "Danmarks Nationalbank"),
               ("DØR", "De Økonomiske Råd (Danish Economic Councils)")]
VARIABLES = [("gdp", "Real GDP growth"), ("inflation", "Inflation")]
INDEX_NAMES = {"gdp": "real GDP", "cpi": "consumer price index (CPI)", "hicp": "harmonised index (HICP)",
               "pce_deflator": "private consumption deflator"}
MAIN_STATUS = {"primary", "restated"}
EXCLUDED_TARGET = 2020  # METHOD.md: tables are also shown excluding 2020 (fixed before results)


def num(s):
    s = (s or "").strip()
    return float(s) if s else None


def norm(s):
    """Whitespace-insensitive comparison of quotes with evidence (pdftotext layout varies)."""
    return re.sub(r"\s+", " ", s).strip()


def load(name):
    with open(os.path.join(ROOT, "data", name), encoding="utf-8") as fh:
        return [r for r in csv.DictReader(fh) if not (r.get(next(iter(r))) or "").startswith("#")]


def check(forecasts):
    """Every recorded value must be backed by a verbatim quote in the committed evidence."""
    errors, cache = [], {}
    for i, r in enumerate(forecasts, start=2):
        if r["status"] == "missing":
            continue
        ev = r["source_id"]
        if ev not in cache:
            p = os.path.join(ROOT, "evidence", ev + ".txt")
            cache[ev] = norm(open(p, encoding="utf-8").read()) if os.path.exists(p) else None
        if cache[ev] is None:
            errors.append(f"line {i}: evidence/{ev}.txt not found")
            continue
        for q in [x for x in r["quote"].split(" || ") if x.strip()]:
            src = ev
            m = re.match(r"^@(\S+) p\.\d+: (.*)$", q)  # a quote from another evidence file: "@<id> p.N: <text>"
            if m:
                src, q = m.group(1), m.group(2)
                if src not in cache:
                    p = os.path.join(ROOT, "evidence", src + ".txt")
                    cache[src] = norm(open(p, encoding="utf-8").read()) if os.path.exists(p) else ""
            if norm(q) not in cache[src]:
                errors.append(f"line {i}: quote not in evidence/{src}.txt: {q[:90]}")
        quoted = {float(t.replace(",", ".").replace("−", "-")) for t in re.findall(r"[−-]?\d+[.,]\d(?!\d)", r["quote"])}
        for f in ("current", "forecast"):
            v = r[f].strip()
            if v and not re.fullmatch(r"-?\d+(\.\d+)?", v):
                errors.append(f"line {i}: {f} is not a number: {v}")
            elif v and float(v) not in quoted:
                errors.append(f"line {i}: {f} {v} does not appear in the quote")
    fe = os.path.join(ROOT, "data", "first_estimates.csv")
    if os.path.exists(fe):
        for i, r in enumerate(csv.DictReader(open(fe, encoding="utf-8")), start=2):
            ev = r["source_id"]
            txt = norm(open(os.path.join(ROOT, "evidence", ev + ".txt"), encoding="utf-8").read())
            for q in r["quote"].split(" || "):
                if norm(q) not in txt:
                    errors.append(f"first_estimates.csv line {i}: quote not in evidence/{ev}.txt: {q[:90]}")
    return errors


def outcome_table(outcomes):
    t = {}
    for r in outcomes:
        t[(r["index"], int(r["year"]), r["vintage"])] = num(r["value"])
    return t


def score(forecasts, outcomes):
    ot = outcome_table(outcomes)
    vintages = sorted({k[2] for k in ot})
    rows, detail = [], []
    for fc, _ in FORECASTERS:
        for var, _ in VARIABLES:
            recs = [r for r in forecasts if r["forecaster"] == fc and r["variable"] == var and r["status"] in MAIN_STATUS]
            for vint in vintages:
                for excl in (False, True):
                    pts = []
                    for r in sorted(recs, key=lambda r: int(r["year"])):
                        y, idx = int(r["year"]), r["index"]
                        f, c = num(r["forecast"]), num(r["current"])
                        o1, o0 = ot.get((idx, y + 1, vint)), ot.get((idx, y, vint))
                        if f is None or o1 is None or (excl and y + 1 == EXCLUDED_TARGET):
                            continue
                        pts.append((y, f, c, o1, o0))
                        if not excl:
                            detail.append({"forecaster": fc, "variable": var, "index": idx, "vintage": vint,
                                           "made_in": y, "target": y + 1, "forecast": f, "baseline": c,
                                           "outcome": o1, "error": round(f - o1, 2),
                                           "baseline_error": None if c is None else round(c - o1, 2)})
                    if not pts:
                        continue
                    both = [p for p in pts if p[2] is not None]
                    dirs = [p for p in both if p[4] is not None]
                    mae = lambda xs: round(sum(xs) / len(xs), 2) if xs else None
                    rows.append({
                        "forecaster": fc, "variable": var, "vintage": vint, "excluding_2020": excl,
                        "years": len(pts),
                        "mae_forecast_all": mae([abs(p[1] - p[3]) for p in pts]),
                        "years_with_baseline": len(both),
                        "mae_forecast": mae([abs(p[1] - p[3]) for p in both]),
                        "mae_baseline": mae([abs(p[2] - p[3]) for p in both]),
                        "bias": mae([p[1] - p[3] for p in pts]),
                        "beat_baseline": sum(1 for p in both if abs(p[1] - p[3]) < abs(p[2] - p[3])),
                        "tied_baseline": sum(1 for p in both if abs(p[1] - p[3]) == abs(p[2] - p[3])),
                        "direction_right": sum(1 for p in dirs if (p[1] - p[2]) * (p[3] - p[4]) > 0),
                        "direction_years": len(dirs),
                    })
    return rows, detail, vintages


def fmt(v, signed=False):
    if v is None:
        return "–"
    return (f"{v:+.2f}" if signed else f"{v:.2f}").replace("-", "−")


def tables_md(rows, forecasts):
    out = ["# Results", "",
           "Generated by `tools/score.py` from `data/forecasts.csv` and `data/outcomes.csv`. Do not edit by hand.", ""]
    for vint, vname in (("latest", "Statistics Denmark, latest vintage"), ("first", "first published estimate (GDP only)")):
        for excl in (False, True):
            sub = [r for r in rows if r["vintage"] == vint and r["excluding_2020"] == excl]
            if not sub:
                continue
            out += [f"## Outcome: {vname}{', excluding 2020' if excl else ', all years'}", "",
                    "| Forecaster | Variable | Years | MAE forecast | MAE “next year like this year” | Beat baseline | Bias | Direction right |",
                    "|---|---|---|---|---|---|---|---|"]
            for r in sub:
                out.append(f"| {r['forecaster']} | {r['variable']} | {r['years']} | {fmt(r['mae_forecast'])} | "
                           f"{fmt(r['mae_baseline'])} | {r['beat_baseline']} of {r['years_with_baseline']} | "
                           f"{fmt(r['bias'], True)} | {r['direction_right']} of {r['direction_years']} |")
            out.append("")
    out += ["MAE: mean absolute error in percentage points, over years where both the forecast and the baseline exist. "
            "Bias: mean of forecast − outcome over all scored years. With about ten years per forecaster, differences "
            "of a few tenths between forecasters are not meaningful.", ""]
    miss = [r for r in forecasts if r["status"] == "missing"]
    if miss:
        out += ["## Missing values", "", "| Forecaster | Year | Variable | Why |", "|---|---|---|---|"]
        out += [f"| {r['forecaster']} | {r['year']} | {r['variable']} | {r['note']} |" for r in miss]
        out.append("")
    return "\n".join(out)


def main():
    forecasts, outcomes = load("forecasts.csv"), load("outcomes.csv")
    errors = check(forecasts)
    if errors:
        print("\n".join(errors))
        sys.exit(1)
    print(f"check ok: {sum(1 for r in forecasts if r['status'] != 'missing')} values backed by quotes")
    if "--check" in sys.argv:
        return
    rows, detail, vintages = score(forecasts, outcomes)
    os.makedirs(os.path.join(ROOT, "results"), exist_ok=True)
    with open(os.path.join(ROOT, "results", "scores.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    open(os.path.join(ROOT, "results", "tables.md"), "w", encoding="utf-8").write(tables_md(rows, forecasts) + "\n")
    payload = {"method": "https://github.com/kvantixtech/expert-forecasts/blob/main/METHOD.md",
               "forecasters": dict(FORECASTERS), "indexes": INDEX_NAMES, "scores": rows, "points": detail,
               "forecasts": [{k: r[k] for k in ("forecaster", "year", "variable", "index", "current", "forecast",
                                                  "edition", "title", "url", "page", "status")} for r in forecasts],
               "outcomes": outcomes}
    with open(os.path.join(ROOT, "results", "results.json"), "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=1, sort_keys=True)
        fh.write("\n")
    print(f"scored {len(rows)} rows; vintages: {', '.join(vintages)}")


if __name__ == "__main__":
    main()
