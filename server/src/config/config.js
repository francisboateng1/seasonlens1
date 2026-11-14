import path from 'node:path';
import { fileURLToPath } from 'node:url';
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '4000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databasePath: process.env.DATABASE_PATH ? path.resolve(serverRoot, process.env.DATABASE_PATH) : path.join(serverRoot, 'data/seasonlens.sqlite'),
  nasaBaseUrl: process.env.NASA_POWER_BASE_URL || 'https://power.larc.nasa.gov/api/temporal/daily/point',
  nasaTimeoutMs: Number.parseInt(process.env.NASA_POWER_TIMEOUT_MS || '20000', 10),
  nasaCacheTtlMs: Number.parseInt(process.env.NASA_POWER_CACHE_TTL_MS || '900000', 10),
  nasaCommunity: process.env.NASA_POWER_COMMUNITY || 'AG',
  defaultObservationDays: Math.min(365, Math.max(7, Number.parseInt(process.env.DEFAULT_OBSERVATION_DAYS || '30', 10) || 30))
};
