import fs from 'node:fs';
import path from 'node:path';
import * as sqlite from 'node:sqlite';
import { config } from '../config/config.js';

// Node 22.5+ exposes DatabaseSync. Newer Node releases also export Database;
// prefer the non-deprecated name where available and retain the Node 22 fallback.
const SQLiteDatabase = sqlite.Database ?? sqlite.DatabaseSync;

if (!SQLiteDatabase) {
  throw new Error(
    'SeasonLens requires Node.js 22.13.0 or newer with the built-in node:sqlite module. ' +
    'Install a current Node.js LTS release and run npm install again.'
  );
}

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

// The built-in SQLite driver avoids native npm addons and Visual Studio build
// requirements on Windows. DatabaseSync keeps this small prototype's data layer
// synchronous while still using a real, file-backed SQLite database.
export const db = new SQLiteDatabase(config.databasePath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS farms (
    farm_id TEXT PRIMARY KEY,
    farm_name TEXT NOT NULL,
    farmer_name TEXT,
    phone_number TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    area_hectares REAL NOT NULL,
    location_description TEXT,
    priorities_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS soil_observations (
    observation_id TEXT PRIMARY KEY,
    farm_id TEXT NOT NULL REFERENCES farms(farm_id) ON DELETE CASCADE,
    data_type TEXT NOT NULL CHECK(data_type IN ('measured', 'estimated')),
    source TEXT NOT NULL,
    depth TEXT,
    recorded_at TEXT NOT NULL,
    measurements_json TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_soil_farm
    ON soil_observations(farm_id, recorded_at DESC);
`);

export function closeDatabase() {
  db.close();
}
