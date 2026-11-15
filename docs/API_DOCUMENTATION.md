# API documentation

Base URL in development: `http://localhost:4000/api`. All responses are JSON. Successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": { "code", "message", "details?", "requestId" } }`. Dates are UTC-oriented `YYYY-MM-DD` for normalized data and `YYYYMMDD` for POWER query parameters.

## Health and catalogs

### `GET /api/health`
Returns service name, status, database provider (`sqlite` in local development/tests or `tidb` when hosted), and server timestamp. The health check also executes a lightweight database ping.

### `GET /api/nasa/health`
Returns adapter status and NASA POWER service URL. This checks application readiness, not guaranteed upstream uptime.

### `GET /api/nasa/parameters`
Returns the supported parameter catalog and labels/units/resolution.

### `GET /api/crops`
Returns the six crop profiles, including family, duration, provisional climate/soil requirements, rotation notes, reference links and confidence.

### `GET /api/crops/:cropId`
Returns one supported crop profile; unknown crop IDs return `404`.

### `GET /api/soil/status`
Returns the SoilGrids status notice and the soil-property profile catalog. The current status is unavailable while ISRIC's REST endpoint is paused.

### `GET /api/voice/status`
Returns whether a verified external voice provider is configured (none by default) and the browser capabilities required for optional client-side speech.

## Farm management

### `POST /api/farms`
Create a farm. Example:

```json
{
  "farmName": "Coastal Demonstration Farm",
  "farmerName": "Ama",
  "phoneNumber": "",
  "latitude": 4.89,
  "longitude": -1.75,
  "areaHectares": 2.5,
  "locationDescription": "Takoradi, Western Region, Ghana",
  "priorities": ["waterEfficiency", "soilCare"]
}
```

Returns `201` and the saved farm with `farmId`, `createdAt` and `updatedAt`. Coordinates and positive farm area are validated.

### `GET /api/farms`
Returns `{ "farms": [...] }` inside the `data` envelope.

### `GET /api/farms/:farmId`
Returns one farm; unknown IDs return `404`.

### `GET /api/farms/:farmId/environment?start=YYYYMMDD&end=YYYYMMDD`
Fetches live NASA POWER daily observations for the saved farm. The default period is a recent historical window when dates are omitted. Returns normalized source metadata, coordinates, requested and actual period, retrieval time, parameter series, quality and environmental summary. This route can fail if NASA POWER is unreachable; no demo values are substituted.

### `GET /api/farms/:farmId/soil`
Returns SoilGrids service status, the latest farmer-entered soil observation and an assessment label. At the time of this release, SoilGrids REST is reported temporarily paused by ISRIC.

### `POST /api/farms/:farmId/soil/observations`
Save a farmer-provided or laboratory soil observation. Payload: `{ "dataType": "measured"|"estimated", "source": "lab or field source", "depth": "0–20 cm", "measurements": [{ "property": "pH", "value": 6.2, "unit": "pH" }] }`. The source and data type are required. The record is stored separately from gridded estimates.

## NASA POWER

### `GET /api/nasa/observations?latitude=4.89&longitude=-1.75&start=20250101&end=20250107&parameters=PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,RH2M`
Fetch an inclusive daily date range. Coordinates must be within latitude `[-90,90]` and longitude `[-180,180]`. Start/end must be valid calendar dates, and start cannot exceed end. The service applies an upstream timeout and modest process-local cache.

Returned parameter entries include code, name, unit, temporal resolution, date/value pairs, missing count and source. Metadata includes source name/URL, coordinates, requested/actual range, UTC retrieval timestamp, `isLive: true` and `isDemo: false`, quality warnings and upstream metadata.

## Decision support

### `POST /api/recommendations`
Example:

```json
{
  "farmId": "farm-id-from-GET-farms",
  "selectedCrops": ["maize", "cowpea", "groundnut", "rice", "cassava", "okra"],
  "seasons": 3,
  "priorities": ["soilCare", "diversify", "legumes"],
  "previousCrop": "maize"
}
```

Returns ranked rotation options with sequence, score, rationale, advantages, disadvantages, assumptions and limitations. If `priorities` is omitted, saved farm priorities are used when `farmId` is supplied. Unsupported market-access scoring is disclosed rather than invented. The score is a transparent heuristic, not validated yield or soil-improvement prediction.

### `POST /api/advisory`
Example:

```json
{
  "farmId": "farm-id-from-GET-farms",
  "cropId": "maize",
  "assessmentDate": "2026-11-14"
}
```

The backend retrieves NASA data when environmental observations are not supplied. A request may optionally include normalized observations and soil context for deterministic tests/integration. Exactly one status is returned: `favourable`, `moderate`, `unfavourable` or `insufficient_data`; the payload includes headline, reasons, warnings, sources, observation dates, quality, confidence and limitations. Thresholds are provisional. Assessment is not a guarantee.

## Optional voice

### `POST /api/voice/intent`
Accepts a text command and returns a recognized navigation/help intent when supported. This is not an external AI model endpoint.

## Error codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid coordinates, date range or request field |
| 404 | `NOT_FOUND` / `FARM_NOT_FOUND` / `CROP_NOT_FOUND` | Unknown route, farm or crop |
| 429 | `NASA_RATE_LIMIT` | Upstream rate limit |
| 502 | `NASA_UPSTREAM_ERROR` / `NASA_NETWORK_ERROR` | NASA rejected the request, DNS/network failure or invalid upstream payload |
| 504 | `NASA_TIMEOUT` | NASA request timed out |
| 500 | `INTERNAL_ERROR` | Unexpected application/database error |

Every error includes a request ID for troubleshooting. Avoid putting secrets or personal phone numbers into logs.

## Example response shape (schema illustration only)

The following shows the envelope and field names only. It is not a captured NASA response and contains no fabricated observation values:

```json
{
  "success": true,
  "data": {
    "metadata": {
      "source": "NASA POWER",
      "sourceUrl": "https://power.larc.nasa.gov/",
      "coordinates": { "latitude": 4.89, "longitude": -1.75 },
      "requestedPeriod": { "start": "2025-01-01", "end": "2025-01-07" },
      "actualPeriod": { "start": null, "end": null },
      "retrievedAt": "<UTC timestamp from the live request>",
      "isLive": true,
      "isDemo": false,
      "qualityWarnings": []
    },
    "parameters": {
      "T2M": { "code": "T2M", "unit": "°C", "temporalResolution": "daily", "values": [], "missingCount": 0, "source": "NASA POWER" }
    }
  },
  "meta": {}
}
```

`actualPeriod` and `values` are populated only from the upstream response. The `null`/empty fields above are deliberate schema markers, not observed data.
