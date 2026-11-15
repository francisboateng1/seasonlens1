import { Router } from 'express';
import { createAdvisory } from '../engine/advisoryEngine.js';
import { fetchNasaObservations, NASA_PARAMETERS } from '../services/nasaPower.js';
import { db } from '../database/db.js';
import { jsonOk } from '../utils/dataFormatter.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { isValidDateString, utcDateOffset, toPowerDate } from '../utils/dateUtils.js';
import { ValidationError } from '../utils/validation.js';

export const advisoryRouter = Router();

advisoryRouter.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Request body must be a JSON object.');
  if (body.farmId !== undefined && (typeof body.farmId !== 'string' || !body.farmId.trim() || body.farmId.length > 128)) {
    throw new ValidationError('farmId must be a valid identifier string.');
  }
  if (body.assessmentDate !== undefined && (!isValidDateString(body.assessmentDate, 'YYYY-MM-DD') || body.assessmentDate > new Date().toISOString().slice(0, 10))) {
    throw new ValidationError('assessmentDate must be a valid YYYY-MM-DD date that is not in the future.');
  }

  let observations = body.observations;
  let soilData = body.soilData || null;
  let farm = null;

  if (body.farmId) {
    const row = await db.get('SELECT * FROM farms WHERE farm_id = ?', [body.farmId]);
    if (!row) throw Object.assign(new Error('Farm not found.'), { status: 404, code: 'FARM_NOT_FOUND' });
    farm = { farmId: row.farm_id, farmName: row.farm_name, latitude: Number(row.latitude), longitude: Number(row.longitude) };

    if (!soilData) {
      const soil = await db.get(
        'SELECT * FROM soil_observations WHERE farm_id = ? ORDER BY recorded_at DESC LIMIT 1',
        [body.farmId]
      );
      if (soil) soilData = {
        dataType: soil.data_type,
        source: soil.source,
        depth: soil.depth,
        measurements: JSON.parse(soil.measurements_json)
      };
    }

    if (!observations) {
      const end = body.end || toPowerDate(utcDateOffset(-2));
      const start = body.start || toPowerDate(utcDateOffset(-16));
      observations = await fetchNasaObservations({
        latitude: farm.latitude,
        longitude: farm.longitude,
        start,
        end,
        parameters: body.parameters || Object.keys(NASA_PARAMETERS)
      });
    }
  }

  if (!body.cropId) throw Object.assign(new Error('cropId is required.'), { status: 400, code: 'VALIDATION_ERROR' });
  res.json(jsonOk({ farm, advisory: createAdvisory({ cropId: body.cropId, observations, soilData, assessmentDate: body.assessmentDate }) }));
}));
