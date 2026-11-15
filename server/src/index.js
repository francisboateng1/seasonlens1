import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pathToFileURL } from 'node:url';
import { config } from './config/config.js';
import { db, initializeDatabase } from './database/db.js';
import { requestId } from './middleware/requestId.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { farmsRouter } from './routes/farms.js';
import { nasaRouter } from './routes/nasa.js';
import { soilRouter } from './routes/soil.js';
import { cropsRouter } from './routes/crops.js';
import { simulationRouter } from './routes/simulation.js';
import { advisoryRouter } from './routes/advisory.js';
import { voiceRouter } from './routes/voice.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.clientOrigins.includes(origin)) return callback(null, true);
    return callback(Object.assign(new Error('Origin is not allowed by the SeasonLens API CORS policy.'), { status: 403, code: 'CORS_ORIGIN_DENIED' }));
  },
  credentials: false
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestId);

app.get('/api/health', async (req, res, next) => {
  try {
    await db.ping();
    res.json({
      success: true,
      data: {
        status: 'ok',
        service: 'SeasonLens API',
        environment: config.nodeEnv,
        database: config.databaseProvider
      },
      meta: { requestId: req.id, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/farms', farmsRouter);
app.use('/api/nasa', nasaRouter);
app.use('/api/soil', soilRouter);
app.use('/api/crops', cropsRouter);
app.use('/api', simulationRouter);
app.use('/api/advisory', advisoryRouter);
app.use('/api/voice', voiceRouter);
app.use(notFoundHandler);
app.use(errorHandler);

await initializeDatabase();

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`SeasonLens API listening on port ${config.port} using ${config.databaseProvider}`);
  });
}
