# Advisory rules and limitations

## Status values

The engine returns exactly one of:

- `favourable` — available observations pass the provisional checks implemented for the selected crop.
- `moderate` — observations show mixed or borderline conditions.
- `unfavourable` — a supported critical condition breaches a crop-specific screening threshold.
- `insufficient_data` — required observations are missing, too sparse or not relevant to the crop/assessment window.

Headlines are respectively `YOU CAN PLANT NOW`, `CONDITIONS ARE MODERATE`, `IT IS NOT SAFE TO PLANT NOW`, and `NOT ENOUGH DATA TO ASSESS`.

## Inputs and evidence

The planting-window engine examines recent daily NASA POWER observations, including corrected precipitation and temperature. It calculates summaries only where sufficient non-null values exist. It does not infer future rainfall from historical rainfall. Soil information is considered only where explicit farm/field observations exist or a verified external estimate is available; the currently paused SoilGrids REST API is not treated as available.

## Threshold management

All screening ranges live in `server/src/data/plantingThresholds.js`. Values are tagged provisional and must be locally reviewed. They are intentionally broad screening rules, not calibrated Ghana-wide planting prescriptions. See `cropProfiles.js` for per-crop growing context and assumptions.

The logic checks rainfall accumulation / recent wet days and temperature context. A missing value is not converted to zero. A missing series cannot produce an unfavourable result by itself. An unfavourable classification requires a populated series to support the configured critical rule. Insufficient evidence returns `insufficient_data` rather than an invented score.

## Confidence

Confidence is based on evidence coverage and data quality, not model training. Crop profiles are low confidence/provisional. Confidence can be reduced by missing observations, stale observations, lack of soil testing or a limited observation window.

## Important limitations

- The advisory is a decision-support screening tool, not agronomic certification.
- NASA POWER gridded data are not farm measurements and may not capture microclimates or field variability.
- A recent historical window is not a forecast.
- Soil fertility, pH, drainage, pest/disease pressure, variety, planting depth, seed quality, management and local seasonal calendars may materially change suitability.
- Local extension officers and agronomists should review thresholds and recommendations before real-world use.
- Never guarantee harvest, yield, profit or planting success.
