# Did the experts get it right?

Denmark's official forecasters publish next year's GDP growth and inflation every autumn. This repository checks those forecasts against what actually happened, and against a simple rule anyone could have used: *next year like this year*.

**Status: collecting sources.** The method in [`METHOD.md`](METHOD.md) was fixed before any result was computed. No results yet.

| | |
|---|---|
| Forecasters | Økonomisk Redegørelse (the government's forecast), Danmarks Nationalbank, De Økonomiske Råd |
| Years | Forecasts made in 2015–2024 for 2016–2025 |
| Outcomes | Statistics Denmark (StatBank API), latest vintage and first estimate |
| Evidence | [`evidence/`](evidence/): for each publication, the URL, its SHA-256 and the quoted lines with page numbers. The documents themselves are not copied here. |

Part of the Kvantix [Data Playground](https://kvantix.tech/playground/). Same method as the [weather forecast test](https://github.com/kvantixtech/weather-forecast-test): lock it, measure it against data nobody controls, compare it with a lazy guess.

## Licence

Code: MIT. Compiled tables: CC BY 4.0, credit "Kvantix expert-forecasts". Quoted figures belong to their publishers and are cited with source. Statistics Denmark data is used under its terms of use, with source stated.
