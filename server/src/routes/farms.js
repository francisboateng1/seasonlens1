import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../database/db.js';
import { config } from '../config/config.js';
import { validateFarmPayload, ValidationError } from '../utils/validation.js';
import { jsonOk } from '../utils/dataFormatter.js';
import { fetchNasaObservations, NASA_PARAMETERS } from '../services/nasaPower.js';
import { getSoilGridsStatus } from '../services/soilGrids.js';
import { assessEnvironment } from '../engine/environmentalAssessmentEngine.js';
import { assessSoil } from '../engine/soilAssessmentEngine.js';
import { utcDateOffset, toPowerDate } from '../utils/dateUtils.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const farmsRouter = Router();

function serialize(row) {
  return row ? {
    farmId: row.farm_id,
    farmName: row.farm_name,
    farmerName: row.farmer_name,
    phoneNumber: row.phone_number,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    areaHectares: Number(row.area_hectares),
    locationDescription: row.location_description,
    priorities: JSON.parse(row.priorities_json || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  } : null;
}

async function findFarm(id) {
  return serialize(await db.get('SELECT * FROM farms WHERE farm_id = ?', [id]));
}

farmsRouter.post('/', asyncHandler(async (req, res) => {
  const payload = validateFarmPayload(req.body);
  const now = new Date().toISOString();
  const farmId = randomUUID();
  await db.run(
    `INSERT INTO farms (
      farm_id, farm_name, farmer_name, phone_number, latitude, longitude,
      area_hectares, location_description, priorities_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [farmId, payload.farmName, payload.farmerName || null, payload.phoneNumber || null,
      payload.latitude, payload.longitude, payload.areaHectares,
      payload.locationDescription || null, JSON.stringify(payload.priorities || []), now, now]
  );
  res.status(201).json(jsonOk(await findFarm(farmId)));
}));

farmsRouter.get('/', asyncHandler(async (_req, res) => {
  const rows = await db.all('SELECT * FROM farms ORDER BY updated_at DESC');
  res.json(jsonOk({ farms: rows.map(serialize) }, { count: rows.length }));
}));

farmsRouter.get('/:farmId', asyncHandler(async (req, res) => {
  const farm = await findFarm(req.params.farmId);
  if (!farm) throw Object.assign(new Error('Farm not found.'), { status: 404, code: 'FARM_NOT_FOUND' });
  res.json(jsonOk(farm));
}));

farmsRouter.get('/:farmId/environment', asyncHandler(async (req, res) => {
  const farm = await findFarm(req.params.farmId);
  if (!farm) throw Object.assign(new Error('Farm not found.'), { status: 404, code: 'FARM_NOT_FOUND' });
  const end = req.query.end ? String(req.query.end) : toPowerDate(utcDateOffset(-2));
  const start = req.query.start
    ? String(req.query.start)
    : toPowerDate(utcDateOffset(-(config.defaultObservationDays + 1)));
  const parameters = req.query.parameters ? String(req.query.parameters).split(',') : Object.keys(NASA_PARAMETERS);
  const observations = await fetchNasaObservations({ latitude: farm.latitude, longitude: farm.longitude, start, end, parameters });
  res.json(jsonOk({ farm, observations, assessment: assessEnvironment(observations) }));
}));

farmsRouter.get('/:farmId/soil', asyncHandler(async (req, res) => {
  const farm = await findFarm(req.params.farmId);
  if (!farm) throw Object.assign(new Error('Farm not found.'), { status: 404, code: 'FARM_NOT_FOUND' });
  const row = await db.get(
    'SELECT * FROM soil_observations WHERE farm_id = ? ORDER BY recorded_at DESC LIMIT 1',
    [farm.farmId]
  );
  const record = row ? {
    dataType: row.data_type,
    source: row.source,
    depth: row.depth,
    recordedAt: row.recorded_at,
    measurements: JSON.parse(row.measurements_json)
  } : null;
  res.json(jsonOk({ farm, soilGrids: getSoilGridsStatus(), fieldObservation: record, assessment: assessSoil(record) }));
}));

farmsRouter.post('/:farmId/soil/observations', asyncHandler(async (req, res) => {
  const farm = await findFarm(req.params.farmId);
  if (!farm) throw Object.assign(new Error('Farm not found.'), { status: 404, code: 'FARM_NOT_FOUND' });
  const { dataType, source, depth, measurements } = req.body || {};
  if (!['measured', 'estimated'].includes(dataType)) throw new ValidationError('dataType must be measured or estimated.');
  if (typeof source !== 'string' || !source.trim() || source.length > 120) {
    throw new ValidationError('source must contain 1 to 120 characters.');
  }
  if (!Array.isArray(measurements) || !measurements.length || measurements.length > 30) {
    throw new ValidationError('measurements must contain 1 to 30 items.');
  }
  for (const measurement of measurements) {
    if (!measurement || typeof measurement.property !== 'string' || !measurement.property.trim() || !Number.isFinite(Number(measurement.value))) {
      throw new ValidationError('Each measurement needs a property name and numeric value.');
    }
  }
  const observationId = randomUUID();
  const recordedAt = new Date().toISOString();
  const cleanDepth = String(depth || '').slice(0, 60) || null;
  await db.run(
    `INSERT INTO soil_observations (
      observation_id, farm_id, data_type, source, depth, recorded_at, measurements_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [observationId, farm.farmId, dataType, source.trim(), cleanDepth, recordedAt, JSON.stringify(measurements)]
  );
  res.status(201).json(jsonOk({ observationId, farmId: farm.farmId, dataType, source: source.trim(), depth: cleanDepth, recordedAt, measurements }));
}));
