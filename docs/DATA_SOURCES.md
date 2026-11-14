# Data sources and provenance

## NASA POWER (primary environmental source)

NASA POWER distributes analysis-ready solar and meteorological data assembled from satellite observations and assimilation/model products. SeasonLens uses the official temporal daily point endpoint:

```text
https://power.larc.nasa.gov/api/temporal/daily/point
```

The backend sends `community=AG` (Agroclimatology), `format=JSON`, `time-standard=UTC`, coordinates, the inclusive `start` and `end` dates, and a comma-separated `parameters` list. The official POWER documentation describes AG data as daily mean time series for agricultural decision-support use. Date strings in requests are `YYYYMMDD`; returned keys are normalized to `YYYY-MM-DD`.

### Parameters used

| Code | SeasonLens meaning | Unit presented | Daily availability |
|---|---|---|---|
| `PRECTOTCORR` | Corrected precipitation | mm/day | Daily |
| `T2M` | Air temperature at 2 m | °C | Daily |
| `T2M_MAX` | Daily maximum air temperature at 2 m | °C | Daily |
| `T2M_MIN` | Daily minimum air temperature at 2 m | °C | Daily |
| `RH2M` | Relative humidity at 2 m | % | Daily |

Parameter availability and community units are defined by NASA POWER, not by SeasonLens. The application uses a fixed, documented parameter metadata catalog based on NASA documentation; it should be checked whenever the source catalog changes. Parameter catalogs are subject to NASA maintenance and should be checked before expanding the parameter set.

### Interpretation and limitations

- NASA POWER values are gridded/model-assimilated data, not measurements taken on the farmer's field.
- Daily aggregation may follow POWER's local-solar-time processing unless a supported request option changes it; SeasonLens explicitly requests UTC and records that choice. Verify the source's time convention when comparing with field logs.
- Grid resolution differs by variable and source. NASA's meteorological source documentation describes a native MERRA-2 grid of roughly 0.5° latitude by 0.625° longitude (about 50–70 km depending on latitude); a farm coordinate identifies the requested grid point and does not imply field-scale resolution.
- Near-real-time GEOS-IT daily values are generally available about two days behind real time; the default farm query ends two days before the current UTC date. NASA also notes that retrospective MERRA-2 values may be updated periodically.
- Missing/fill values (including `-999`) are converted to JSON `null`. They are never treated as zero.
- The service records requested coordinates, dates, actual returned date range, retrieval timestamp, source metadata, parameter metadata and warnings.
- Historical precipitation is not a rainfall forecast. SeasonLens does not infer next week's weather from past observations.
- Live calls can fail because of service outages, rate limits, network connectivity, timeouts or dates not yet available. The API reports an error/quality state rather than substituting sample values.
- The app's in-memory cache has a configurable 15-minute default TTL and is process-local. It is an optimization, not durable data storage.

Official references:

- [NASA POWER API overview](https://power.larc.nasa.gov/docs/services/api/)
- [NASA POWER temporal daily API](https://power.larc.nasa.gov/docs/services/api/temporal/)
- [NASA POWER user communities](https://power.larc.nasa.gov/docs/methodology/communities/)
- [NASA POWER parameter dictionary](https://power.larc.nasa.gov/parameters/)
- [NASA POWER parameter tutorial](https://power.larc.nasa.gov/docs/tutorials/parameters/)
- [NASA POWER data processing](https://power.larc.nasa.gov/docs/methodology/data/processing/)

## SoilGrids / ISRIC (not a NASA source)

SoilGrids is a global digital soil mapping product maintained by ISRIC – World Soil Information. It provides model-derived estimates of soil properties, not in-field measurements. Its REST API is currently announced as temporarily paused by ISRIC, with no restoration estimate. Accordingly, the SeasonLens soil service does **not** call the paused endpoint and returns `temporarily_unavailable` with attribution and a warning. The interface can display farmer-entered field/laboratory observations when supplied; those are explicitly labeled as user-provided measurements and are not represented as SoilGrids data.

Official references:

- [ISRIC SoilGrids status and product overview](https://isric.org/explore/soilgrids)
- [SoilGrids documentation and access status](https://docs.isric.org/globaldata/soilgrids/index.html)
- [SoilGrids REST entry page](https://rest.isric.org/)

When the REST service is restored, a future adapter should pin the supported API version, verify response schema and units, request only the needed properties/depth intervals, obey the 5 calls/minute fair-use guidance, cache results, and preserve property, depth, unit, source date and estimated-data classification.

## Crop reference data

Crop profiles are explicitly provisional screening profiles for maize, cowpea, groundnut, rice, cassava and okra. They are not a local extension recommendation. Profile-level references include:

- [FAO Ecocrop database](https://www.fao.org/ecocrop/)
- [FAO Crop Water Information](https://www.fao.org/land-water/databases-and-software/crop-information/en/)
- [FAO crop production and protection resources](https://www.fao.org/plant-production-protection/en/)

Thresholds and assumptions require review by Ghanaian agronomists and adaptation to variety, planting system, soil test, local season calendars, drainage, management and farmer knowledge. Crop profiles carry a low/provisional confidence label by default.

## Source hierarchy

1. NASA POWER daily observations for environmental context.
2. ISRIC SoilGrids only when its service is available and validated; currently unavailable through the paused REST API.
3. Farmer-entered field/laboratory measurements, clearly separated from gridded estimates.
4. Provisional crop profiles and rules, visibly labeled as screening assumptions.

SeasonLens never silently promotes a provisional profile to a validated scientific fact.
