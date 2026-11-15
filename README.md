# SeasonLens

**NASA Space Apps Challenge — Field Shift: Adapting Farms with NASA Data**

SeasonLens is a farmer-facing decision-support prototype that combines NASA POWER daily environmental observations with crop profiles, farmer priorities, optional farmer-entered soil records, crop-rotation heuristics and transparent planting-screening advisories. It is built as a modular monolith: React/Vite frontend, Express API, and a pluggable database layer (local SQLite; TiDB Cloud in production).

> **Decision-support notice:** SeasonLens does not guarantee harvests, yield, profit or planting success. Crop thresholds are provisional and need review by Ghanaian agronomists and local extension officers. NASA POWER values are gridded/reanalysis products, not measurements collected on a farmer's field. Historical observations are not weather forecasts.

## Features

- Create and persist farms, coordinates, size, farmer/contact metadata and priorities in SQLite locally or TiDB Cloud in hosted production.
- Retrieve live NASA POWER daily observations through the Express backend, including corrected precipitation, mean/max/min temperature and relative humidity.
- Normalize dates, units, missing sentinels and metadata; display source, coordinates, period, retrieval time and quality warnings.
- Calculate observed rainfall totals, wet days, temperature summaries, missing-data percentage and freshness where data supports the calculation.
- Show an honest SoilGrids unavailable state while ISRIC reports its REST API paused; store optional user-supplied field/lab observations separately.
- Compare crop rotations for maize, cowpea, groundnut, rice, cassava and okra using explainable family/legume/diversity/repetition heuristics.
- Generate crop-specific planting screening statuses with reasons, warnings, confidence, sources and limitations.
- Provide a responsive dashboard with Recharts visualizations and a Leaflet/OpenStreetMap farm-location selector.
- Offer optional browser-native English speech commands and text fallback. Twi phrase mapping is not Twi speech recognition; no nonexistent Abena AI model is claimed.
- Automated unit and API integration tests use mocked upstream data where needed; the live NASA smoke test is separate.

## Architecture

```text
Browser (React + Vite)
  pages / components / hooks / voice
          │ shared client API (/api)
          ▼
Express modular monolith
  routes ── services ── NASA POWER / Soil status
    │          │
    ├── engines (environment / rotation / advisory / soil)
    │
    └── SQLite locally / TiDB Cloud in hosted production (farms + farmer-entered soil observations)
```

All third-party data requests pass through the backend. Routes are thin; services perform external retrieval; engines contain decision logic. NASA observation caching is in-memory and process-local, not durable storage. The database adapter persists farm and field-soil records: SQLite locally/tests and TiDB Cloud in hosted production.

## Project structure

```text
SeasonLens/
├── client/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── FarmMap.jsx
│       │   ├── Dashboard.jsx
│       │   ├── RotationSimulator.jsx
│       │   ├── Advisory.jsx
│       │   ├── AdvisoryCard.jsx
│       │   ├── PlantingStatus.jsx
│       │   ├── SoilAnalysis.jsx
│       │   ├── CropSelector.jsx
│       │   ├── EnvironmentalData.jsx
│       │   ├── VoiceAssistant.jsx
│       │   └── LanguageSelector.jsx
│       ├── pages/ (Home, FarmSetup, DashboardPage, Simulation, SoilPage, AdvisoryPage)
│       ├── voice/ (recognition, synthesis, commands, navigation and language modules)
│       ├── hooks/useVoiceAssistant.js
│       ├── services/ (api.js, voiceModelLoader.js)
│       ├── styles/ (global.css, advisory.css, voiceAssistant.css)
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── data/                 # default SQLite data location
│   ├── scripts/nasa-smoke.js
│   ├── src/
│   │   ├── config/config.js
│   │   ├── database/db.js
│   │   ├── data/              # crop, soil, rotation and threshold profiles
│   │   ├── engine/            # environmental, rotation, soil and advisory engines
│   │   ├── middleware/        # request IDs and error mapping
│   │   ├── routes/            # farms, NASA, soil, crops, simulation, advisory, voice
│   │   ├── services/          # NASA POWER, SoilGrids status, voice service status
│   │   ├── utils/             # validation, dates and formatters
│   │   └── index.js
│   └── tests/                 # engine, NASA adapter and API tests
├── docs/
│   ├── DATA_SOURCES.md
│   ├── API_DOCUMENTATION.md
│   ├── VOICE_ASSISTANT.md
│   ├── ADVISORY_RULES.md
│   ├── SYSTEM_ARCHITECTURE.md
│   └── DEPLOYMENT_VERCEL_RENDER.md
├── render.yaml
├── .node-version
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Technology stack

- Frontend: React 18, JavaScript ES modules, Vite 6, React Router, Recharts, Leaflet / React Leaflet, OpenStreetMap tiles.
- Backend: Node.js (ES modules), Express, native `fetch`, TiDB Cloud via `mysql2` in production, Node.js built-in `node:sqlite` for local development/tests, Helmet, CORS, and Node.js built-in `.env` loading (`--env-file-if-exists`).
- Tests: Node.js built-in test runner (`node:test`), built-in `assert`, mocked fetch for NASA behavior.

## Prerequisites

- Node.js 22.13.0 or newer (Node 22 or 24 LTS recommended; Node 26 is also supported). The backend uses the built-in `node:sqlite` module for local development and tests; Render production uses `mysql2` to connect to TiDB Cloud.
- npm 10+.
- Network access for package installation and live NASA requests.
- A modern browser. Map tiles require internet access; microphone support depends on browser permissions and Web Speech API availability.

## Installation

### Windows PowerShell

```powershell
# From the folder where you want the project
cd SeasonLens
Copy-Item .env.example .env
# Install once from this root folder; this project has no native SQLite addon.
npm install
npm run test
npm run build
npm run dev
```

### macOS / Linux

```bash
cd SeasonLens
cp .env.example .env
npm install
npm run test
npm run build
npm run dev
```

The combined dev command starts the API at `http://localhost:4000` and the Vite app at `http://localhost:5173`. Open the Vite URL in your browser.

## Environment configuration

Edit `.env` (never commit it; `.env.example` is safe to commit):

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Runtime mode |
| `PORT` | `4000` | Express port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allow-list; comma-separated values supported |
| `DATABASE_PROVIDER` | `sqlite` | `sqlite` locally/tests or `tidb` on Render |
| `DATABASE_PATH` | `./data/seasonlens.sqlite` | Local SQLite path; ignored when provider is TiDB |
| `TIDB_HOST` | — | TiDB Cloud public endpoint hostname |
| `TIDB_PORT` | `4000` | TiDB Cloud MySQL endpoint port |
| `TIDB_USER` | — | Exact username from TiDB Connect panel |
| `TIDB_PASSWORD` | — | TiDB database password (server only) |
| `TIDB_DATABASE` | — | Database/schema name, e.g. `seasonlens` |
| `TIDB_ENABLE_SSL` | `true` | Enable TLS for public TiDB connections |
| `TIDB_CA_PATH` | — | Optional CA certificate path for plans that require it |
| `NASA_POWER_BASE_URL` | official NASA daily point endpoint | NASA POWER URL; override only for controlled testing |
| `NASA_POWER_TIMEOUT_MS` | `20000` | Upstream timeout |
| `NASA_POWER_CACHE_TTL_MS` | `900000` | In-memory cache TTL (15 minutes) |
| `NASA_POWER_COMMUNITY` | `AG` | NASA POWER Agroclimatology community |
| `DEFAULT_OBSERVATION_DAYS` | `30` | Default recent historical interval |

No NASA API key is required for the public NASA POWER data service. Do not store credentials in client code.

## Running separately

```bash
# Terminal 1 — API
npm run dev:server

# Terminal 2 — client
npm run dev:client
```

Production-style start after building the client:

```bash
npm run build
npm start
```

The Express server serves its JSON API; deploy the static `client/dist` directory to Vercel and point `VITE_API_BASE` at Render. In production, set `DATABASE_PROVIDER=tidb` and the TiDB connection variables on Render; SQLite remains the local/test adapter. Use HTTPS for microphone and production access.

## Tests and quality checks

```bash
npm test                 # Node test suite in server/tests
npm run build            # Vite production build
npm run smoke:nasa       # Explicit live NASA POWER network check (separate from mocks)
```

The test suite exercises validation, NASA normalization and fill values, upstream failure/timeout behavior, farm create/read on the local SQLite test adapter, API error responses, rotation options and advisory statuses. NASA calls in automated tests are mocked. The smoke test makes a real request and therefore requires working DNS/network access and NASA service availability. A successful test result should only be claimed after running the commands and observing their exit codes.

## NASA live integration and examples

The API endpoint used by the backend is:

```text
https://power.larc.nasa.gov/api/temporal/daily/point
```

The app queries `community=AG`, `time-standard=UTC`, daily resolution and these parameters:

- `PRECTOTCORR`: corrected precipitation (mm/day)
- `T2M`: mean 2 m temperature (°C)
- `T2M_MAX`: maximum 2 m temperature (°C)
- `T2M_MIN`: minimum 2 m temperature (°C)
- `RH2M`: relative humidity at 2 m (%)

Examples for Ghana (coordinates are approximate point locations; verify a farm's actual coordinates before use):

**Takoradi** — latitude `4.89`, longitude `-1.75`:

```text
http://localhost:4000/api/nasa/observations?latitude=4.89&longitude=-1.75&start=20250101&end=20250107
```

**Accra** — latitude `5.6037`, longitude `-0.1870`:

```text
http://localhost:4000/api/nasa/observations?latitude=5.6037&longitude=-0.1870&start=20250101&end=20250107
```

These are example requests, not hardcoded responses. Returned values come from the live upstream response at request time. To run the standalone live smoke test:

```bash
npm run smoke:nasa
```

Override the coordinates and period with `SMOKE_LATITUDE`, `SMOKE_LONGITUDE`, `SMOKE_START` and `SMOKE_END` environment variables.

## API quick reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health |
| POST | `/api/farms` | Create farm |
| GET | `/api/farms` | List farms |
| GET | `/api/farms/:farmId` | Retrieve farm |
| GET | `/api/farms/:farmId/environment` | Retrieve farm's NASA observations and summary |
| GET | `/api/farms/:farmId/soil` | Soil source status and field observations |
| POST | `/api/farms/:farmId/soil` | Save farmer-entered soil observation |
| GET | `/api/nasa/health` | NASA adapter readiness |
| GET | `/api/nasa/parameters` | Parameter catalog |
| GET | `/api/nasa/observations` | Live NASA POWER point series |
| GET | `/api/crops` | Supported crop profiles |
| POST | `/api/recommendations` | Compare rotation strategies |
| POST | `/api/advisory` | Generate crop-specific planting screening |
| POST | `/api/voice/intent` | Parse supported text navigation intents |

See [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) for request/response details and error codes.

## Soil data and attribution

SoilGrids is an ISRIC product, not a NASA dataset. At the time this version was prepared, ISRIC announced that its REST API is temporarily paused and offered no restoration timeline. SeasonLens therefore shows an unavailable state rather than fabricating global soil values. Farmer-entered field or laboratory measurements may be saved with source, property, units and depth and remain clearly distinguished from gridded estimates.

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) for source URLs and limitations.

## Five-member team plan

1. **Frontend:** React pages/components, responsive styling, map, charts and API integration (`client/`).
2. **NASA data:** NASA POWER service, environmental endpoints, normalization and environmental assessment (`nasaPower.js`, `environmentalAssessmentEngine.js`).
3. **Soil and crop data:** Soil service/status, soil/crop profiles and planting threshold governance (`soilGrids.js`, `soilProfiles.js`, `cropProfiles.js`, `plantingThresholds.js`).
4. **Decision engines:** rotation, planting-window and advisory logic plus engine tests (`server/src/engine/`).
5. **Backend and integration:** Express entry point/routes, database adapter, validation, API tests, documentation and release coordination.

### Git collaboration

- Branch names: `feature/frontend-dashboard`, `feature/nasa-power`, `feature/crop-soil-data`, `feature/decision-engines`, `feature/api-integration`.
- Each member owns their module boundaries and opens a pull request into `main`.
- PRs must include tests for behavior changes, pass `npm test` and `npm run build`, and document changed API contracts.
- Keep `.env`, database files, TiDB credentials and generated build output out of Git. Coordinate shared schema/contract changes before merging.

## Deployment: Vercel frontend + Render backend + TiDB Cloud

The recommended deployment separates the user interface, API, and persistent database:

- **Vercel:** hosts the React/Vite static frontend from the `client/` directory.
- **Render:** runs the Express API from `server/` and makes all NASA POWER requests.
- **TiDB Cloud:** stores farms and field-soil observations using its MySQL-compatible protocol and TLS.

The server supports TiDB Cloud in production and retains its built-in SQLite adapter for local development and tests. Render does not need a persistent disk when `DATABASE_PROVIDER=tidb`.

Follow [`docs/DEPLOYMENT_VERCEL_RENDER.md`](docs/DEPLOYMENT_VERCEL_RENDER.md) for exact setup steps. In summary: create the TiDB schema first; deploy the Render Blueprint and add its `TIDB_*` secrets; deploy Vercel with `VITE_API_BASE=https://YOUR-RENDER-SERVICE.onrender.com/api`; then set Render `CLIENT_ORIGIN` to the exact Vercel domain. Never place TiDB credentials in a `VITE_` variable.

Render's free web services sleep after 15 minutes of inactivity and can take around a minute to wake. Upgrade to a paid Render plan for always-on use. TiDB's public endpoint should be restricted to the Render service's outbound IP ranges where possible.

This is a hackathon prototype, not a hardened multi-tenant agricultural platform. Add authentication, authorization, consent, privacy controls, backups, rate limiting and monitoring before storing real farmer data.

## Troubleshooting

- **Port in use:** change `PORT` in `.env`, or stop the process already listening on 4000/5173.
- **NASA unavailable / DNS error:** confirm outbound network and DNS; try `npm run smoke:nasa`. The app will show an error instead of invented data.
- **NASA 422 response:** validate date format, selected parameter codes, coordinates and available dates; see NASA error details in API response.
- **`node:sqlite` is unavailable:** upgrade Node.js to 22.13.0 or newer, close old terminals, reopen PowerShell, and verify with `node --version`. No Visual Studio C++ build tools or native SQLite npm package are required.
- **A previous `npm install` stopped halfway (for example, `semver` is missing):** close running Node processes, remove the incomplete install from the project root with `Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue`, remove a partial lockfile with `Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue`, then run `npm cache verify` and `npm install` again from the folder containing the top-level `package.json`.
- **Map tiles missing:** check browser internet access and OpenStreetMap tile availability; map selection itself still provides coordinate text fields.
- **Microphone unavailable:** use the text command input; check browser support, HTTPS/localhost and microphone permissions.
- **SoilGrids unavailable:** this is expected while ISRIC has paused its REST API. No fake substitute is shown.

## Hackathon demonstration workflow

1. Start the backend and frontend.
2. Create a farm in Takoradi using the map or coordinates; save it.
3. Open the dashboard and request NASA environmental observations; show source metadata, period, charts and any data-quality warnings.
4. Open Soil and explain the ISRIC REST pause; add a sample field measurement only if the team has a real measurement to demonstrate, and label its source accurately.
5. Compare rotation options for selected crops; discuss heuristic advantages and trade-offs.
6. Request a planting advisory and inspect reasons, observation dates, quality and confidence.
7. Demonstrate optional voice navigation if the browser supports it; otherwise use text input.
8. Explain limitations, especially that the app is not forecasting weather or guaranteeing crop outcomes.

## Known limitations and future improvements

- SoilGrids REST currently paused; integrate a stable ISRIC access route or another attributed soil source only after schema and terms verification.
- Crop profiles and planting thresholds are provisional and require local agronomist/extension review.
- No account authentication, role model, farm ownership or multi-tenant security yet.
- NASA cache is process-local and does not persist or coordinate across server replicas.
- No weather forecast integration; historical POWER observations are not forecasts.
- Voice is browser-native and optional; Twi voice recognition is unsupported/unverified.
- Rotation scores are comparative heuristics, not validated soil, yield or profit models.
- Future work: a field measurement workflow, local extension knowledge review, secure authentication, audit history, durable caching, accessibility testing, and validated regional crop calendars.
