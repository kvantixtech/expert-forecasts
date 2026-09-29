# Method: did the experts get it right?

Fixed before any result was computed. The outcomes are already history, so this lock can't prove we didn't know them. What it does prove is that the rules weren't tuned afterwards to favour anyone, including the baseline. Changes after this commit are listed in `CHANGELOG.md` with the reason.

## Question

How close did Denmark's official forecasters get to the next year's GDP growth and inflation? Did they beat a simple rule that anyone could have used?

## Forecasters

| Short name | Publication | Which edition counts for year Y |
|---|---|---|
| **ØR** | Økonomisk Redegørelse (Finansministeriet / Økonomi- og Indenrigsministeriet / Økonomiministeriet) | The December edition of year Y. If there was none, the latest edition published on or before 31 December of year Y. |
| **NB** | Danmarks Nationalbank, projection for the Danish economy | The latest projection published on or before 31 December of year Y. |
| **DØR** | De Økonomiske Råd, *Dansk Økonomi, efterår Y* | The autumn report of year Y. |

The rule "on or before 31 December of year Y" is applied strictly. A forecast published later knows more, so it is never used in place of a missing one. A missing forecast stays missing and is shown as such.

## What is forecast

For each forecaster and each year Y from 2015 to 2024, the forecast for the **following** year Y+1 of:

1. **Real GDP growth**, per cent.
2. **Inflation**, per cent, annual average. Each forecaster is scored on the index it forecasts: consumer price index (CPI, *forbrugerprisindeks*) or the harmonised index (HICP). The outcome uses the same index.

Every value is recorded with the URL of the original publication, the page or table, and a verbatim quote. The document's SHA-256 is in `evidence/index.csv`. Values found only in a press release or news report are marked `secondary` and reported separately; they are not mixed into the main table.

## Outcomes

- **Main:** Statistics Denmark, latest published vintage when the data was fetched. GDP: table NAN1, real growth. CPI: annual average inflation. HICP: annual average. The fetch date is recorded.
- **Also shown, where available:** the first annual estimate of GDP growth, published in February–March of the following year. Revisions can move GDP growth by more than a percentage point. A forecaster can be "wrong" by today's figure and right by the figure available at the time, and both are shown.

## The baseline

**"Next year like this year."** The forecast for Y+1 equals the same forecaster's own estimate for year Y, taken from the same publication. It uses only what the forecaster knew at the time, so the comparison is fair: the question is whether the forecast added anything to "no change".

## Scoring

For each forecaster, variable and outcome vintage:

- **Mean absolute error** (percentage points) of the forecasts and of the baseline, over the years where both exist.
- **Bias:** mean of (forecast − outcome). A positive value means too optimistic for growth, too high for inflation.
- **Beat the baseline:** the number of years where the forecast was closer than "next year like this year".
- **Direction:** the number of years where the forecast said correctly whether growth or inflation would rise or fall compared with year Y.

Every year counts. Tables are also shown **excluding 2020**, because nobody forecast the pandemic in December 2019. That split is fixed here, not chosen after seeing the numbers.

With about ten years per forecaster, differences of a few tenths of a percentage point between forecasters are not meaningful. The page says so next to the tables.

## What this is not

It is not a ranking of institutions' competence. Forecasts are conditional on policy assumptions, and some of them are made to inform policy that then changes the outcome. The question is only how the published numbers compare with what happened and with a simple rule.
