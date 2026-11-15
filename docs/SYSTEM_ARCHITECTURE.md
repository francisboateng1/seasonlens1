# System architecture

SeasonLens is a modular monolith with a React single-page client and a single Express backend with a pluggable persistence adapter (local SQLite and hosted TiDB Cloud). The client never contacts NASA or SoilGrids directly.

## Request flow

1. The React page calls a shared method in `client/src/services/api.js`.
2. Vite proxies `/api` requests to Express during development.
3. Express assigns a request ID, parses/validates request data, and dispatches to a thin route.
4. Routes call service adapters for external data, database modules for persistence, or deterministic engines for decision logic.
5. The response returns normalized JSON with provenance, quality warnings and errors.
6. The UI displays loading, empty, stale/quality-warning and error states. It does not synthesize dashboard observations.

## Backend module boundaries

- `routes/`: HTTP concerns and request/response mapping.
- `services/`: NASA POWER client, SoilGrids status adapter and optional voice service status.
- `engine/`: deterministic environmental, soil, rotation and advisory calculations.
- `data/`: crop profiles, soil profiles, rotation rules and threshold configuration.
- `database/`: async repository interface, SQLite local/test adapter, TiDB Cloud MySQL adapter, and schema initialization.
- `utils/`: date handling, validation and data formatting.
- `middleware/`: request ID and centralized error response.

## Data flow and source honesty

NASA POWER observations are requested only by the server, normalized into date/value arrays, annotated with source and metadata, and cached in process memory for a configurable TTL. SQLite persists farms and user-entered soil records in local development/tests; TiDB Cloud persists them in the hosted Render service. NASA observation cache is not durable storage. SoilGrids REST is not called while ISRIC reports the service paused. Field measurements are stored separately and labeled as user-entered.

## Decision engines

Environmental assessment computes summary statistics only from available values. The rotation engine ranks permutations with a transparent heuristic for family diversity, legume inclusion, repeated crops, compatibility and priorities. The advisory engine evaluates provisional crop-specific thresholds and emits one of four controlled statuses. All engines are pure or mostly pure functions so they can be tested without live API calls.

## Frontend boundaries

- `pages/` map routes to screen-level views.
- `components/` hold reusable map, chart, advisory and decision-support UI.
- `services/api.js` centralizes backend calls.
- `voice/` and `hooks/` implement optional browser-native speech support and command matching.
- `styles/` holds responsive visual design.

## Five-member ownership

1. Frontend: `client/` React pages/components, map, charts and styles.
2. NASA data: `server/src/services/nasaPower.js`, `server/src/engine/environmentalAssessmentEngine.js`, NASA tests.
3. Soil and crop data: `soilGrids.js`, `soilProfiles.js`, `cropProfiles.js`, `plantingThresholds.js`.
4. Decision engines: `server/src/engine/`, `rotationRules.js`, `advisoryRules.js` and engine tests.
5. Backend/integration: Express entry, routes, database adapter/schema, validation, docs, build/test integration and release.

Use feature branches named `feature/<area>-<short-description>`. Open pull requests against `main`, assign an owner/reviewer, run tests/build, and avoid editing another member's module without coordination. Shared API contracts and data structures should be changed through reviewed PRs.
