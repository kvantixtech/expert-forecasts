# Did the experts get it right?

Denmark's official forecasters publish next year's GDP growth and inflation every autumn. This repository checks those forecasts against what actually happened, and against a simple rule anyone could have used: *next year like this year*.

**Status: first results, 29 September 2026.** The method in [`METHOD.md`](METHOD.md) was fixed before any result was computed. How it was applied where it didn't say is in [`CHANGELOG.md`](CHANGELOG.md), committed before the first scoring run.

## Results

Forecasts made in 2015–2024 for the following year, scored against Statistics Denmark's latest figures. Error is the mean absolute error in percentage points. The baseline is "next year like this year", taken from the same publication.

| | GDP: forecast error | GDP: baseline error | GDP: beat baseline | Inflation: forecast error | Inflation: baseline error | Inflation: beat baseline |
|---|---|---|---|---|---|---|
| **Økonomisk Redegørelse** (government) | 1.56 | 2.66 | 8 of 10 | 1.07 | 1.57 | 6 of 10 |
| **Danmarks Nationalbank** | 1.78 | 2.65 | 8 of 10 | 1.40 | 1.92 | 6 of 10 |
| **De Økonomiske Råd** | 1.68 | 2.64 | 6 of 10 | 1.66 | 1.88 | 4 of 10 |

- **All three beat the lazy guess on GDP**, by about one percentage point on average. On inflation, the government and the Nationalbank beat it; De Økonomiske Råd's forecast was only slightly better than the lazy guess on average and beat it in 4 of 10 years.
- **Against today's figures, all three look too pessimistic about GDP** (bias −0.2 to −0.6 points). Against the first published figures, the bias is close to zero (−0.15 to +0.21). Most of the "pessimism" is later revisions of GDP, which the forecasters could not have known.
- **Nobody saw 2022 coming.** The forecasts for 2022 inflation were 1.4–2.2 per cent. The outcome was 7.7–8.6 per cent, depending on the index.
- **Excluding 2020** (fixed in advance, because nobody forecast the pandemic in December 2019), the conclusions are the same.
- With ten years per forecaster, **differences of a few tenths between the three forecasters are not meaningful.** This is not a ranking of competence.

Full tables, including the first-estimate comparison, direction and year by year: [`results/tables.md`](results/tables.md). Machine-readable: [`results/scores.csv`](results/scores.csv), [`results/results.json`](results/results.json).

Each forecaster is scored on the index it forecasts: the government on CPI, the Nationalbank on HICP, De Økonomiske Råd on the private consumption deflator.

## How to check it

```
python3 tools/build_forecasts.py   # data/forecasts.csv from the quoted table rows in evidence/
python3 tools/outcomes.py          # data/outcomes.csv from Statistics Denmark data in data/dst/
python3 tools/score.py             # checks every quote and value, then writes results/
```

Standard library only. The [`check`](.github/workflows/check.yml) workflow runs all three on every push and fails if anything differs from what is committed. Each of the 60 values has the publication URL, page, the quoted table row and the document's SHA-256 in [`evidence/index.csv`](evidence/index.csv). 56 come from the original publication and 4 from the forecaster's own later restatement (marked `restated`, see the changelog).

| | |
|---|---|
| Forecasters | Økonomisk Redegørelse (the government's forecast), Danmarks Nationalbank, De Økonomiske Råd |
| Years | Forecasts made in 2015–2024 for 2016–2025 |
| Outcomes | Statistics Denmark (StatBank API), latest vintage and first estimate |
| Evidence | [`evidence/`](evidence/): for each publication, the URL, its SHA-256 and the quoted lines with page numbers. The documents themselves are not copied here. |

Part of the Kvantix [Data Playground](https://kvantix.tech/playground/). Same method as the [weather forecast test](https://github.com/kvantixtech/weather-forecast-test): lock it, measure it against data nobody controls, compare it with a lazy guess.

## Licence

Code: MIT. Compiled tables: CC BY 4.0, credit "Kvantix expert-forecasts". Quoted figures belong to their publishers and are cited with source. Statistics Denmark data is used under its terms of use, with source stated.
