# SeasonLens deployment: Vercel + Render + TiDB Cloud

This is the recommended split deployment for SeasonLens:

- **Vercel** hosts the static React/Vite frontend.
- **Render** runs the long-lived Express API and makes NASA POWER requests.
- **TiDB Cloud Starter/Essential** stores farm records and field-soil observations in a managed MySQL-compatible database.

The browser communicates only with Render. It never receives database credentials and never calls NASA POWER directly. TiDB is accessed only from the Render backend over MySQL/TLS.

## 0. Before deployment

1. Put the complete `SeasonLens` project in one Git repository and push it to GitHub (or another provider connected to both platforms).
2. Make sure you are deploying the project root containing `render.yaml`, `package.json`, `client/`, and `server/`.
3. Do not commit `.env`, TiDB passwords, CA certificates, or other credentials.

## 1. Create the TiDB Cloud database first

1. Sign in to [TiDB Cloud](https://tidbcloud.com/) and create a **TiDB Cloud Starter** instance (or Essential if you need its additional features).
2. Choose a cloud region reasonably close to the Render service region. This guide uses Frankfurt for Render; choose the closest available TiDB region rather than assuming every region is offered.
3. Open the cluster's SQL Editor and create a separate database/schema:

   ```sql
   CREATE DATABASE seasonlens;
   ```

4. Open **Connect** and select the public connection method for Node.js / MySQL. Copy the host, port, username, and password exactly as shown. For Starter/Essential public endpoints, the port is normally `4000` and TLS is mandatory. Shared-endpoint TiDB usernames can include an account/instance prefix, so copy the displayed username exactly; do not construct it yourself.
5. Set up TiDB's public endpoint firewall. From Render, open the future API service's **Connect → Outbound** panel and copy the outbound CIDR ranges for its region. Add those ranges to TiDB's **Settings → Networking → Authorized Networks**. If you cannot use an IP allow-list with the Render plan you choose, understand that the database public endpoint may be reachable from a broader network; use a strong database password and never expose it to Vercel/browser variables. Do not casually choose `0.0.0.0/0` for a production database.
6. Do not create tables manually. SeasonLens creates the `farms` and `soil_observations` tables automatically when the API starts.

TiDB's official `mysql2` guidance requires TLS for public Starter connections and shows Node's built-in trusted CA store is sufficient for Starter in the normal case. A CA file path is optional in this application. For Essential/Dedicated, follow the exact CA instructions shown in your cluster's Connect panel.

## 2. Deploy the backend to Render

1. Open [Render](https://render.com/) and choose **New → Blueprint**.
2. Connect the Git repository containing `render.yaml` and apply the Blueprint.
3. The Blueprint creates `seasonlens-api` using:

   | Setting | Value |
   |---|---|
   | Service | Web Service |
   | Runtime | Node |
   | Root directory | `server` |
   | Build command | `npm install` |
   | Start command | `npm start` |
   | Health check | `/api/health` |
   | Database | TiDB Cloud (no Render disk) |

4. In Render → `seasonlens-api` → **Environment**, add the TiDB connection values:

   | Key | Value |
   |---|---|
   | `DATABASE_PROVIDER` | `tidb` |
   | `TIDB_HOST` | Host copied from TiDB Connect |
   | `TIDB_PORT` | `4000` (or the port displayed by TiDB) |
   | `TIDB_USER` | Exact username copied from TiDB Connect |
   | `TIDB_PASSWORD` | TiDB password |
   | `TIDB_DATABASE` | `seasonlens` |
   | `TIDB_ENABLE_SSL` | `true` |
   | `TIDB_CA_PATH` | Leave unset for Starter unless TiDB tells you to use a CA file |
   | `NODE_ENV` | `production` |
   | `CLIENT_ORIGIN` | Add after deploying the Vercel frontend |

   The Blueprint marks the host, user, password, and database fields as secret/manual values; add them in Render's Environment page. Never add these to frontend variables or Git.

5. The service also needs `PORT`, but Render supplies it automatically. Do not manually set it.
6. Deploy. The API connects to TiDB and creates tables during startup. If startup fails, check Render logs for missing `TIDB_*` settings, a rejected firewall connection, a wrong username prefix, an invalid database name, or a TLS issue.
7. Copy the public Render service URL, for example `https://seasonlens-api.onrender.com`.

### Render free-plan note

The Blueprint uses the Free plan for an initial/demo deployment. Free Render web services spin down after 15 minutes without inbound traffic and can take about a minute to wake up. Their local filesystem is ephemeral, but SeasonLens farm data is in TiDB, not on Render's filesystem. Render's documentation cautions that free instances are for testing/hobby use rather than production. Upgrade the web service to a paid plan for an always-on API and a more dependable user experience.

## 3. Deploy the frontend to Vercel

1. Open [Vercel](https://vercel.com/) and choose **Add New → Project**.
2. Import the same Git repository.
3. Set **Root Directory** to `client` and enable the setting that allows Vercel to use that directory as the project root.
4. Select Vite (normally detected automatically) and use:

   | Setting | Value |
   |---|---|
   | Framework preset | Vite |
   | Root directory | `client` |
   | Install command | `npm install` |
   | Build command | `npm run build` |
   | Output directory | `dist` |

5. Add the environment variable `VITE_API_BASE` with this exact pattern:

   ```text
   https://YOUR-RENDER-SERVICE.onrender.com/api
   ```

   Do not add a trailing slash. The value is public because it is compiled into the frontend; it must contain only the API base URL. Never put `TIDB_PASSWORD`, TiDB host credentials, or any server secret in a `VITE_` variable.
6. Deploy and copy the production Vercel origin, for example `https://seasonlens.vercel.app`.

`client/vercel.json` rewrites application routes to `index.html` so React Router refreshes and deep links continue to work.

## 4. Connect CORS and redeploy

1. Open Render → `seasonlens-api` → **Environment**.
2. Set `CLIENT_ORIGIN` to the exact Vercel origin, for example:

   ```text
   https://seasonlens.vercel.app
   ```

   Do not include a trailing slash. If you use a custom domain as well, put both origins in one comma-separated value, e.g. `https://seasonlens.vercel.app,https://app.example.com`.
3. Save and redeploy the Render API.
4. If you change `VITE_API_BASE` in Vercel later, trigger a new Vercel deployment because Vite reads it during the build.

## 5. Verify the live deployment

Replace the sample hostnames with your actual deployment URLs.

1. Open `https://YOUR-RENDER-SERVICE.onrender.com/api/health`. Expected JSON includes `success: true`, `data.status: "ok"`, and `data.database: "tidb"`.
2. Open `https://YOUR-RENDER-SERVICE.onrender.com/api/nasa/health`.
3. Open `https://YOUR-VERCEL-DOMAIN/` and create a test farm.
4. Refresh the page and confirm that the farm remains in the farm list.
5. In TiDB SQL Editor, run:

   ```sql
   SELECT farm_id, farm_name, created_at FROM seasonlens.farms ORDER BY created_at DESC LIMIT 10;
   ```

   The new farm should appear. The API also creates `seasonlens.soil_observations` for recorded soil measurements.

## 6. Troubleshooting

### Render exits during startup: TiDB configuration incomplete

Set all four required values: `TIDB_HOST`, `TIDB_USER`, `TIDB_PASSWORD`, and `TIDB_DATABASE`. Also set `DATABASE_PROVIDER=tidb` and `TIDB_ENABLE_SSL=true`.

### TiDB reports access denied

Copy the username exactly from TiDB's Connect panel. Shared-endpoint Starter usernames can contain an instance/account prefix. Reset the password in TiDB if necessary, then update Render's `TIDB_PASSWORD`.

### TiDB connection times out or is blocked

Confirm the public endpoint is enabled and the Render outbound CIDR ranges are allowed in TiDB's Authorized Networks. The Render region and TiDB cluster region do not have to be identical, but distant regions add latency.

### TLS or certificate error

Keep `TIDB_ENABLE_SSL=true`. For Starter, Node's built-in trusted CA store normally works. For Essential/Dedicated, download the CA certificate from TiDB's Connect panel and provide it to Render as a secret file; set `TIDB_CA_PATH` to the mounted file path. Do not disable TLS in production.

### Vercel frontend loads but API calls fail

Check that `VITE_API_BASE` is the Render URL ending with `/api`, then redeploy Vercel. Check Render's `CLIENT_ORIGIN` matches the actual browser origin exactly, including `https://` and any custom domain, then redeploy Render.

### API health works but farm creation fails

Inspect the Render log and the browser Network response. Confirm the TiDB schema exists and the Render database account has permission to create/read/write tables. Startup migrations create tables, but they do not create the database/schema itself.

### First request is slow

A free Render API sleeps after 15 minutes without incoming traffic and may take about a minute to wake. Upgrade the Render service for always-on behavior.

## Architecture

```text
Browser
  │
  └── Vercel: React + Vite static frontend
          │
          │ HTTPS /api/* (VITE_API_BASE)
          ▼
      Render: Express API
          ├── NASA POWER (server-side fetch)
          └── mysql2 over TLS
                 │
                 ▼
             TiDB Cloud
               ├── farms
               └── soil_observations
```

The SQLite adapter remains available for local development and automated tests only. In Render production, `DATABASE_PROVIDER=tidb` selects TiDB Cloud. No Render persistent disk is required.

This remains a hackathon prototype. Before using it with real farmer records, implement authentication, per-farmer authorization, secure account management, privacy/consent controls, backups, database least-privilege credentials, rate limiting, and operational monitoring. Without authentication, anyone who can reach the public API may be able to access or modify farm data.
