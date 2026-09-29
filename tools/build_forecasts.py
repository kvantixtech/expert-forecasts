#!/usr/bin/env python3
"""Builds data/forecasts.csv from the committed evidence.

Every value is taken from a table row quoted in evidence/<id>.txt: the row is found by a pattern on
a stated page, and the value is the number at a stated column position. The column positions and
the reasons for them are written out below and in the `note` field, so each choice can be checked
against the quoted header line. tools/score.py --check then verifies every quote and value again.

  python3 tools/build_forecasts.py      (from the repository root; standard library only)
"""
import csv, os, re, sys

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

EV = "evidence/%s.txt"
TOK = re.compile(r"^[−-]?\d+[.,]\d$")


def lines(src):
    out = []
    for l in open(EV % src, encoding="utf-8"):
        m = re.match(r"^p\.(\d+)[|:] ?(.*)$", l.rstrip("\n"))
        if m:
            out.append((int(m.group(1)), m.group(2).strip()))
    return out


def find(src, page, rx):
    rxc = re.compile(rx)
    hits = [t for p, t in lines(src) if p == page and rxc.search(re.sub(r"\s*\|\s*", " ", t))]
    if not hits:
        sys.exit(f"NOT FOUND {src} p.{page} /{rx}/")
    return re.sub(r"\s+", " ", hits[0]).strip()


def nums(row):
    toks = [t for t in re.split(r"\s+|\s*\|\s*", row) if t]
    return [float(t.replace(",", ".").replace("−", "-")) for t in toks if TOK.match(t)]


def rec(fc, y, var, idx, edition, title, url, status, note, src, page, header, row, ci, fi, extra=()):
    h = [find(src, page, header)] if header else []
    r = find(src, page, row)
    n = nums(r)
    cur = n[ci] if ci is not None else None
    fct = n[fi]
    quote = " || ".join(h + [r] + [(find(*e) if e[0] == src else "@%s p.%d: %s" % (e[0], e[1], find(*e))) for e in extra])
    return {"forecaster": fc, "year": y, "variable": var, "index": idx,
            "current": "" if cur is None else f"{cur:g}", "forecast": f"{fct:g}",
            "edition": edition, "title": title, "url": url, "source_id": src, "page": page,
            "quote": quote, "status": status, "note": note}


def url(src):
    for l in open(EV % src, encoding="utf-8"):
        if l.startswith("# url: "):
            return l[7:].strip()


R = []
# ---------------- ØR: Økonomisk Redegørelse (CPI) ----------------
ORT = "Økonomisk Redegørelse, %s"
# forecast for 2016 is the next BNP row; build it by hand from two rows
def two_rows(fc, y, var, idx, edition, title, u, status, note, src, page, header, row_cur, row_fct, col):
    h = find(src, page, header); a = find(src, page, row_cur); b = find(src, page, row_fct)
    return {"forecaster": fc, "year": y, "variable": var, "index": idx, "current": f"{nums(a)[col]:g}",
            "forecast": f"{nums(b)[col]:g}", "edition": edition, "title": title, "url": u, "source_id": src,
            "page": page, "quote": " || ".join([h, a, b]), "status": status, "note": note}
R = [
 two_rows("ØR", 2015, "gdp", "gdp", "2015-12", ORT % "december 2015", url("or-2016-12"), "restated",
     "December 2015 edition not reachable; values as restated by the ministry in Tabel B.29 of the December 2016 edition (Dec. 2015 column; rows for 2015 and 2016). Cross-check: ØR May 2016 Tabel 1.5 gives the same Dec. figure for 2016 (1.9).",
     "or-2016-12", 174, r"^Dec\. +Maj +Aug\. +Sep\.", r"^BNP \(realvækst, pct\.\) +1,4 +1,7", r"^BNP \(realvækst, pct\.\) +2,0 +2,0 +1,9", 4),
 two_rows("ØR", 2015, "inflation", "cpi", "2015-12", ORT % "december 2015", url("or-2016-12"), "restated",
     "As above (Tabel B.29, December 2016 edition). Cross-check: ØR May 2016 Tabel 1.5 gives 1.1 for 2016 (Dec. column).",
     "or-2016-12", 174, r"^Dec\. +Maj +Aug\. +Sep\.", r"^Forbrugerpriser \(pct\. stigning\) +0,8 +0,8", r"^Forbrugerpriser \(pct\. stigning\) +1,5 +1,5 +1,5", 4),
]
for y, src, pg, pg2, hdr, grow, prow, gci, pci, en in [
    (2016, "or-2016-12", 38, 39, r"Aug\. +Dec\. +Aug\. +Dec\. +Dec\.", r"^BNP +0,9", r"^Forbrugerprisindeks +0,5", (1, 3), (1, 3), False),
    (2017, "or-2017-12", 46, 47, r"Aug\. +Dec\. +Aug\. +Dec\. +Dec\.", r"^BNP +2,0", r"^Forbrugerprisindeks +1,1", (1, 3), (1, 3), False),
    (2018, "or-2018-12", 29, 30, r"Aug\. +Dec\. +Aug\. +Dec\. +Dec\.", r"^BNP +1,8", r"^Forbrugerprisindeks +1,1", (1, 3), (1, 3), False),
    (2019, "or-2019-12-en", 17, 18, r"Oct\. +Dec\. +Oct\. +Dec\. +Dec\.", r"^GDP +1\.7", r"^Consumer prices +1\.0", (1, 3), (1, 3), True),
    (2020, "or-2020-12", 27, 28, r"Aug\. +Dec\. +Aug\. +Dec\. +Dec\.", r"^BNP +-4,5", r"^Forbrugerprisindeks +0,3", (1, 3), (1, 3), False),
    (2021, "or-2021-12", 28, 29, r"^2021 +2022 +2023", r"^BNP +3,8", r"^Forbrugerprisindeks +1,3", (1, 3), (1, 3), False),
    (2022, "or-2022-08", 36, 37, r"Maj +August +Maj +August", r"^BNP +4,9", r"^Forbrugerprisindeks +1,9", (2, 4), (2, 4), False),
    (2023, "or-2023-12", 31, 32, r"Aug\. +Dec\. +Aug\. +Dec\. +Dec\.", r"^BNP +1,2", r"^Forbrugerprisindeks +3,8", (1, 3), (1, 3), False),
    (2024, "or-2024-12", 29, 30, r"Aug\. +Dec\. +Aug\. +Dec\. +Dec\.", r"^BNP +1,9", r"^Forbrugerprisindeks +1,8", (1, 3), (1, 3), False)]:
    ed = "2022-08" if y == 2022 else f"{y}-12"
    title = ("Economic Survey, December 2019 (English edition)" if en else
             ORT % ("august 2022" if y == 2022 else f"december {y}"))
    note = {2022: "No December 2022 edition (general election 1 Nov 2022); the August 2022 edition is the latest on or before 31 Dec 2022. The ministry's own history table in the December 2023 edition (p.216) goes Aug. 2022 -> Mar. 2023.",
            2021: "Columns: 2021 Aug., Dec.; 2022 Aug., Dec.; 2023 Dec."}.get(y, "Columns: Y Aug./Oct., Dec.; Y+1 Aug./Oct., Dec.; Y+2 Dec. The December columns are used.")
    extra = [("or-2023-12", 216, r"^Maj +Aug\. +Mar\. +Maj")] if y == 2022 else []
    R.append(rec("ØR", y, "gdp", "gdp", ed, title, url(src), "primary", note, src, pg, hdr, grow, gci[0], gci[1], extra))
    R.append(rec("ØR", y, "inflation", "cpi", ed, title, url(src), "primary", note, src, pg2, hdr, prow, pci[0], pci[1]))

# ---------------- NB: Danmarks Nationalbank (HICP) ----------------
R += [
 rec("NB", 2015, "gdp", "gdp", "2015-12", "Monetary Review, 4th Quarter 2015", url("nb-2015-12"), "primary",
     "Table 2, Key economic variables. Columns 2014, 2015, 2016, 2017.", "nb-2015-12", 26, r"^per cent +2014 +2015", r"^GDP +1\.3 +1\.4", 1, 2),
 rec("NB", 2015, "inflation", "hicp", "2015-12", "Monetary Review, 4th Quarter 2015", url("nb-2015-12"), "primary",
     "Table 2 row 'Consumer prices'; the same figures appear as the HICP row on p.32.", "nb-2015-12", 26, None, r"^Consumer prices, per cent year-on-year +0\.3 +0\.3", 1, 2,
     [("nb-2015-12", 32, r"^HICP +0\.3 +0\.3 +1\.3")]),
]
R += [
 rec("NB", 2016, "gdp", "gdp", "2016-12", "Monetary Review, 4th Quarter 2016", url("nb-2016-12"), "primary",
     "Table 1, Key economic variables. Columns 2015-2018. The same figures are printed as 'Projection, December 2016' in the March 2017 outlook (Table A2).",
     "nb-2016-12", 30, r"^per cent +2015 +2016", r"^GDP +1\.6 +1\.0", 1, 2),
 rec("NB", 2016, "inflation", "hicp", "2016-12", "Monetary Review, 4th Quarter 2016", url("nb-2016-12"), "primary",
     "Table 1 row 'Consumer prices'; the same figures are the HICP row of Table 2 (p.37).",
     "nb-2016-12", 30, r"^per cent +2015 +2016", r"^Consumer prices, per cent year-on-year +0\.2 +0\.0", 1, 2,
     [("nb-2016-12", 37, r"^HICP +0\.2 +0\.0 +1\.1")]),
]
note17 = ("Original (Outlook for the Danish economy, December 2017) could not be retrieved; values as restated by Danmarks Nationalbank "
          "in Tabel A2 of its March 2018 outlook, row 'Prognose fra december 2017': BNP for 2017-2019, then Forbrugerpriser, HICP for 2017-2019.")
R.append(rec("NB", 2017, "gdp", "gdp", "2017-12", "Outlook for the Danish economy, December 2017", url("nb-2018-03"), "restated", note17,
             "nb-2018-03", 19, r"BNP +Forbrugerpriser, HICP", r"^Prognose fra december 2017", 0, 1, [("nb-2018-03", 19, r"^Pct\., år-år +2017 +2018 +2019")]))
R.append(rec("NB", 2017, "inflation", "hicp", "2017-12", "Outlook for the Danish economy, December 2017", url("nb-2018-03"), "restated", note17,
             "nb-2018-03", 19, r"BNP +Forbrugerpriser, HICP", r"^Prognose fra december 2017", 3, 4, [("nb-2018-03", 19, r"^Pct\., år-år +2017 +2018 +2019")]))
note18 = ("Table 1. Columns 2017-2020. Danmarks Nationalbank's next outlook (March 2019) compares with 'Projection, September 2018' "
          "in its revision table, so there was no December 2018 projection; that table also names the price index: 'Consumer prices, HICP'.")
x18 = [("nb-2019-03", 22, r"GDP +Consumer prices, HICP"), ("nb-2019-03", 22, r"^Projection, September 2018")]
R.append(rec("NB", 2018, "gdp", "gdp", "2018-09", "Outlook for the Danish economy, September 2018", url("nb-2018-09"), "primary", note18,
             "nb-2018-09", 10, r"previous year, per cent +2017 +2018", r"^GDP +2\.3 +1\.3", 1, 2, x18))
R.append(rec("NB", 2018, "inflation", "hicp", "2018-09", "Outlook for the Danish economy, September 2018", url("nb-2018-09"), "primary", note18,
             "nb-2018-09", 10, r"previous year, per cent +2017 +2018", r"^Consumer prices, per cent year-on-year +1\.1 +0\.8", 1, 2, x18))
for y, src, pg, ed, title, hdr, g, p, note in [
    (2019, "nb-2019-09", 14, "2019-09", "Outlook for the Danish economy, September 2019", r"2018 +2019 +2020 +2021", r"^GDP +1\.5 +1\.8", r"^Consumer prices \(HICP\)", "Table 1. Columns 2018-2021. In 2019 the Nationalbank's outlook came in March and September; no December 2019 edition was found."),
    (2020, "nb-2020-12", 9, "2020-12", "Udsigter for dansk økonomi, december 2020", r"2019 +2020 +2021 +2022", r"^BNP +2,8 +-3,9", r"^Forbrugerpriser \(HICP\)", "Tabel 1. Columns 2019-2022. Extra December edition during the pandemic."),
    (2021, "nb-2021-09", 18, "2021-09", "Outlook for the Danish economy, September 2021", r"2020 +2021 +2022 +2023", r"^GDP +-2\.1 +3\.8", r"^Consumer prices \(HICP\)", "Table 1. Columns 2020-2023."),
    (2022, "nb-2022-09", 16, "2022-09", "Outlook for the Danish economy, September 2022", r"2021 +2022 +2023 +2024", r"^GDP +4\.9 +2\.0", r"^Consumer prices \(HICP\)", "Table 2. Columns 2021-2024. No December 2022 projection: the revision table of the March 2023 outlook (p.45) compares with 'Projection from September'."),
    (2023, "nb-2023-09", 31, "2023-09", "Outlook for the Danish economy, September 2023", r"2022 +2023 +2024 +2025", r"^GDP +2\.7 +1\.7", r"^Consumer prices \(HICP\)", "Table 1. Columns 2022-2025."),
    (2024, "nb-2024-09", 54, "2024-09", "Outlook for the Danish economy, September 2024", r"2023 +2024\* +2025\*", r"^GDP +2\.5 +2\.1", r"^Consumer prices \(HICP\)", "Table 2. Columns 2023-2026.")]:
    x = [("nb-2023-03", 45, r"^Projection from September")] if y == 2022 else []
    R.append(rec("NB", y, "gdp", "gdp", ed, title, url(src), "primary", note, src, pg, hdr, g, 1, 2, x))
    R.append(rec("NB", y, "inflation", "hicp", ed, title, url(src), "primary", note, src, pg, hdr, p, 1, 2, x))

# ---------------- DØR: De Økonomiske Råd (private consumption deflator) ----------------
DT = "Dansk Økonomi, efterår %d"
DEFL = "Inflation is the private consumption deflator (table note: 'Forbrugerpriserne er udtrykt ved deflatoren for det private forbrug')."
for y, src, pg, hdr, g, gi, p_pg, p, pi, note_src in [
    (2015, "dor-2015-kap1", 3, r"^2014 2015 2016 2017 2025", r"^BNP \(realvækst i pct\.\)", (1, 2), 3, r"^Inflation \(pct\.\)", (1, 2), ("dor-2015-kap1", 9, r"deflatoren for det private forbrug")),
    (2016, "dor-2016-kap1", 2, r"^2015 +2016 +2017 +2018 2025", r"^BNP \(realvækst i pct\.\)", (1, 2), 2, r"^Inflation \(pct\.\)", (1, 2), ("dor-2016-kap1", 11, r"deflatoren for det private forbrug")),
    (2017, "dor-2017-kap1", 5, r"^2016 +2017 2018 2019 2025", r"^Bruttonationalprodukt", (0, 1), 5, r"^Forbrugerpriser", (1, 2), ("dor-2017-kap1", 5, r"deflatoren for det private forbrug")),
    (2018, "dor-2018-kap1", 5, r"^2017 +2018 +2019 +2020", r"^BNP \(realvækst i pct\.\)", (1, 2), 5, r"^Inflation \(pct\.\)", (1, 2), ("dor-2018-kap1", 9, r"deflatoren for det private forbrug")),
    (2019, "dor-2019-kap1", 9, r"^2018 +2019 +2020 +2025", r"^BNP \(realvækst i pct\.\)", (1, 2), 9, r"^Forbrugerpriser \(pct\.\)", (1, 2), ("dor-2019-kap1", 29, r"deflatoren for det private forbrug")),
    (2020, "dor-2020-kap2", 4, r"^2019 +2020 +2021 +2025", r"^BNP \(realvækst i pct\.\)", (1, 2), 13, r"^Forbrugerpriser", (2, 3), ("dor-2020-kap2", 13, r"deflatoren for det private forbrug")),
    (2021, "dor-2021", 48, r"^2019 +2020 +2021 +2022", r"^BNP \(realvækst i pct\.\)", (2, 3), 63, r"^Forbrugerpriser", (2, 3), ("dor-2021", 63, r"deflatoren for det private forbrug")),
    (2022, "dor-2022-kap2", 4, r"^2021 +2022 +2023 +2024", r"^BNP \(realvækst i pct\.\)", (1, 2), 4, r"^Inflation \(pct\.\)", (1, 2), ("dor-2022-kap2", 4, r"deflatoren for det private forbrug")),
    (2023, "dor-2023-kap2", 4, r"^2022 +2023 +2024 +2025", r"^BNP \(realvækst i pct\.\)", (1, 2), 4, r"^Inflation \(pct\.\)", (1, 2), ("dor-2023-kap2", 4, r"deflatoren for det private forbrug")),
    (2024, "dor-2024-kap2", 3, r"^2023 +2024 +2025 +2030", r"^BNP \(realvækst i pct\.\)", (1, 2), 45, r"^Forbrugerpriser", (1, 2), ("dor-2024-kap2", 45, r"deflatoren for det private forbrug"))]:
    note = DEFL
    if y == 2022:
        note += " Published 11 October 2022 (press release embargo). Source is the original chapter II; the full report now on dors.dk is a version revised in May 2023 with the same figures (p.48)."
    if y == 2020:
        note += " Inflation from Tabel II.2 (p.13): columns 2019 (bn DKK), 2019, 2020, 2021, 2025."
    if y == 2024:
        note += " Inflation from Tabel II.3 (p.45)."
    extra = [note_src]
    R.append(rec("DØR", y, "gdp", "gdp", f"{y}-autumn", DT % y, url(src), "primary", note, src, pg, hdr, g, gi[0], gi[1]))
    ph = hdr if p_pg == pg else None
    R.append(rec("DØR", y, "inflation", "pce_deflator", f"{y}-autumn", DT % y, url(src), "primary", note, src, p_pg, ph, p, pi[0], pi[1], extra))

cols = ["forecaster", "year", "variable", "index", "current", "forecast", "edition", "title", "url", "source_id", "page", "quote", "status", "note"]
with open("data/forecasts.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=cols); w.writeheader(); w.writerows(R)
for r in R:
    print(f"{r['forecaster']:4} {r['year']} {r['variable']:9} {r['index']:12} {r['current']:>5} {r['forecast']:>5}  {r['status']:8} {r['source_id']} p.{r['page']}")
