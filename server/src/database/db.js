import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/config.js';

let adapter;
let initialization;

const sqliteSchema = `
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
`;

const tidbStatements = [
  `CREATE TABLE IF NOT EXISTS farms (
    farm_id VARCHAR(36) NOT NULL PRIMARY KEY,
    farm_name VARCHAR(160) NOT NULL,
    farmer_name VARCHAR(160) NULL,
    phone_number VARCHAR(40) NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    area_hectares DOUBLE NOT NULL,
    location_description VARCHAR(255) NULL,
    priorities_json LONGTEXT NOT NULL,
    created_at VARCHAR(32) NOT NULL,
    updated_at VARCHAR(32) NOT NULL,
    KEY idx_farms_updated (updated_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS soil_observations (
    observation_id VARCHAR(36) NOT NULL PRIMARY KEY,
    farm_id VARCHAR(36) NOT NULL,
    data_type ENUM('measured', 'estimated') NOT NULL,
    source VARCHAR(120) NOT NULL,
    depth VARCHAR(60) NULL,
    recorded_at VARCHAR(32) NOT NULL,
    measurements_json LONGTEXT NOT NULL,
    KEY idx_soil_farm (farm_id, recorded_at),
    CONSTRAINT fk_soil_observations_farm
      FOREIGN KEY (farm_id) REFERENCES farms(farm_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
];

async function initializeSqlite() {
  const sqlite = await import('node:sqlite');
  const SQLiteDatabase = sqlite.Database ?? sqlite.DatabaseSync;
  if (!SQLiteDatabase) {
    throw new Error('SQLite development mode requires Node.js 22.13.0 or newer with node:sqlite.');
  }

  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
  const raw = new SQLiteDatabase(config.databasePath);
  raw.exec(sqliteSchema);
  adapter = {
    async get(sql, params = []) { return raw.prepare(sql).get(...params) ?? null; },
    async all(sql, params = []) { return raw.prepare(sql).all(...params); },
    async run(sql, params = []) { return raw.prepare(sql).run(...params); },
    async ping() { raw.prepare('SELECT 1').get(); },
    async close() { raw.close(); }
  };
}

async function initializeTiDB() {
  const { host, port, user, password, database, enableSsl, caPath } = config.tidb;
  const missing = [
    ['TIDB_HOST', host], ['TIDB_USER', user], ['TIDB_PASSWORD', password], ['TIDB_DATABASE', database]
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    throw new Error(`TiDB configuration is incomplete. Set: ${missing.join(', ')}.`);
  }
  if (!enableSsl && config.nodeEnv === 'production') {
    throw new Error('TIDB_ENABLE_SSL must be true in production.');
  }

  const mysql = await import('mysql2/promise');
  let ssl;
  if (enableSsl) {
    ssl = { minVersion: 'TLSv1.2' };
    if (caPath) ssl.ca = fs.readFileSync(caPath, 'utf8');
  }

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    ssl,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 2,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    decimalNumbers: true,
    charset: 'utf8mb4'
  });

  try {
    await pool.execute('SELECT 1');
    for (const statement of tidbStatements) await pool.query(statement);
  } catch (error) {
    await pool.end();
    throw new Error(`Could not connect to or initialize TiDB: ${error.message}`, { cause: error });
  }

  adapter = {
    async get(sql, params = []) {
      const [rows] = await pool.execute(sql, params);
      return rows[0] ?? null;
    },
    async all(sql, params = []) {
      const [rows] = await pool.execute(sql, params);
      return rows;
    },
    async run(sql, params = []) {
      const [result] = await pool.execute(sql, params);
      return result;
    },
    async ping() { await pool.execute('SELECT 1'); },
    async close() { await pool.end(); }
  };
}

export async function initializeDatabase() {
  if (adapter) return;
  if (!initialization) {
    initialization = (async () => {
      if (config.databaseProvider === 'tidb') await initializeTiDB();
      else if (config.databaseProvider === 'sqlite') await initializeSqlite();
      else throw new Error(`Unsupported DATABASE_PROVIDER "${config.databaseProvider}". Use "tidb" or "sqlite".`);
    })();
  }
  await initialization;
}

// Promise-based repository API shared by the local SQLite adapter and TiDB Cloud.
// All callers use positional ? placeholders and await get/all/run operations.
export const db = {
  async get(sql, params = []) { await initializeDatabase(); return adapter.get(sql, params); },
  async all(sql, params = []) { await initializeDatabase(); return adapter.all(sql, params); },
  async run(sql, params = []) { await initializeDatabase(); return adapter.run(sql, params); },
  async ping() { await initializeDatabase(); return adapter.ping(); },
  async close() { if (adapter) await adapter.close(); adapter = undefined; initialization = undefined; }
};
