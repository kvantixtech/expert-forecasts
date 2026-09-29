#!/usr/bin/env python3
"""Builds data/outcomes.csv from the Statistics Denmark data in data/dst/ (written by fetch.py)
and the first published GDP estimates in data/first_estimates.csv.

  gdp           NAN1, B.1*g GDP, period-to-period real growth (published to one decimal)
  cpi           PRIS9, consumer price index, annual rate of change (published to one decimal)
  hicp          PRIS07, all-items HICP, monthly index -> annual average -> growth, two decimals
  pce_deflator  NAN1, P.31 private consumption, current prices / chained 2020 prices -> growth, two decimals

Vintages: "latest" (as fetched; the fetch date is in the output) and "first" (GDP only; the growth rate
stated in Statistics Denmark's first full release for the year, see data/first_estimates.csv).
Standard library only.
"""
import csv, os
from decimal import Decimal, ROUND_HALF_UP

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, "data", "dst")
YEARS = range(2014, 2026)


def rows(name, dst=DST):
    with open(os.path.join(dst, name), encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh, delimiter=";"))


def r2(x):
    """Computed rates are kept to two decimals. Rounding them to one decimal would add up to 0.05 points
    of noise that depends on the index base (e.g. HICP 2022: 8.55 from the 2025=100 index)."""
    return str(Decimal(repr(x)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def build(dst=DST):
    """Outcome rows from the StatBank CSVs in `dst` plus data/first_estimates.csv."""
    rows_ = lambda name: rows(name, dst)
    out = []
    note = "Statistics Denmark StatBank table {} via api.statbank.dk"
    for r in rows_("NAN1-gdp-real-growth.csv"):
        y = int(r["TID"])
        if y in YEARS and r["INDHOLD"] not in ("..", ""):
            out.append({"index": "gdp", "year": y, "vintage": "latest", "value": r["INDHOLD"], "source": note.format("NAN1")})
    for r in rows_("PRIS9-cpi-annual.csv"):
        y = int(r["TID"])
        if y in YEARS:
            out.append({"index": "cpi", "year": y, "vintage": "latest", "value": r["INDHOLD"], "source": note.format("PRIS9")})
    months = {}
    for r in rows_("PRIS07-hicp-index.csv"):
        y, m = int(r["TID"][:4]), r["TID"][5:]
        months.setdefault(y, {})[m] = float(r["INDHOLD"])
    avg = {y: sum(v.values()) / 12 for y, v in months.items() if len(v) == 12}
    for y in YEARS:
        if y in avg and y - 1 in avg:
            out.append({"index": "hicp", "year": y, "vintage": "latest", "value": r2(100 * (avg[y] / avg[y - 1] - 1)),
                        "source": note.format("PRIS07") + "; annual average of the monthly index, computed"})
    cur, fixed = {}, {}
    for r in rows_("NAN1-private-consumption-deflator.csv"):
        if r["INDHOLD"] in ("..", ""):
            continue
        (cur if r["PRISENHED"].startswith("Current") else fixed)[int(r["TID"])] = float(r["INDHOLD"])
    defl = {y: cur[y] / fixed[y] for y in cur if y in fixed}
    for y in YEARS:
        if y in defl and y - 1 in defl:
            out.append({"index": "pce_deflator", "year": y, "vintage": "latest", "value": r2(100 * (defl[y] / defl[y - 1] - 1)),
                        "source": note.format("NAN1") + "; P.31 current prices / chained 2020 prices, computed"})
    fe = os.path.join(ROOT, "data", "first_estimates.csv")
    if os.path.exists(fe):
        for r in csv.DictReader(open(fe, encoding="utf-8")):
            out.append({"index": "gdp", "year": int(r["year"]), "vintage": "first", "value": r["value"],
                        "source": f"{r['release']} ({r['date']}), evidence/{r['source_id']}.txt"})
    out.sort(key=lambda r: (r["vintage"] != "latest", r["index"], r["year"]))
    return out


def main():
    out = build()
    with open(os.path.join(ROOT, "data", "outcomes.csv"), "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["index", "year", "vintage", "value", "source"])
        w.writeheader()
        w.writerows(out)
    print(f"{len(out)} outcomes")


if __name__ == "__main__":
    main()
