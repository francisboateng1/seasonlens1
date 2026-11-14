import { isValidDateString } from './dateUtils.js';
export class ValidationError extends Error {
  constructor(message, details = []) { super(message); this.name = 'ValidationError'; this.status = 400; this.code = 'VALIDATION_ERROR'; this.details = details; }
}
export function parseCoordinate(value, name, min, max) {
  if (typeof value === 'string' && value.trim() === '') throw new ValidationError(`${name} is required and must be numeric.`);
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new ValidationError(`${name} must be between ${min} and ${max}.`);
  return n;
}
export function validateCoordinates(latitude, longitude) {
  return { latitude: parseCoordinate(latitude, 'latitude', -90, 90), longitude: parseCoordinate(longitude, 'longitude', -180, 180) };
}
export function validatePowerDates(start, end) {
  if (!isValidDateString(start) || !isValidDateString(end)) throw new ValidationError('start and end must be valid YYYYMMDD dates.');
  if (start > end) throw new ValidationError('start must be on or before end.');
  if (end > new Date().toISOString().slice(0,10).replaceAll('-','')) throw new ValidationError('end cannot be in the future; NASA POWER daily data is not a forecast.');
}
export function validateFarmPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Request body must be a JSON object.');
  const errors = [], farmName = String(body.farmName || '').trim();
  if (farmName.length < 2 || farmName.length > 100) errors.push('farmName must contain 2 to 100 characters.');
  let coordinates; try { coordinates = validateCoordinates(body.latitude, body.longitude); } catch (e) { errors.push(e.message); }
  const areaHectares = Number(body.areaHectares);
  if (!Number.isFinite(areaHectares) || areaHectares <= 0 || areaHectares > 1e6) errors.push('areaHectares must be greater than 0 and no more than 1,000,000.');
  const priorities = body.priorities ?? [];
  if (!Array.isArray(priorities) || priorities.length > 10 || priorities.some(v => typeof v !== 'string' || v.length > 60)) errors.push('priorities must be an array of up to 10 short strings.');
  const phoneNumber = body.phoneNumber == null ? null : String(body.phoneNumber).trim();
  if (phoneNumber?.length > 40) errors.push('phoneNumber must be at most 40 characters.');
  if (errors.length) throw new ValidationError('Farm details are invalid.', errors);
  return { farmName, farmerName: String(body.farmerName || '').trim().slice(0,100) || null, phoneNumber: phoneNumber || null,
    ...coordinates, areaHectares, locationDescription: String(body.locationDescription || '').trim().slice(0,200) || null,
    priorities: [...new Set(priorities.map(v => v.trim()).filter(Boolean))] };
}
export function validateCropIds(ids, profiles) {
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 6) throw new ValidationError('selectedCrops must contain 1 to 6 crop IDs.');
  const unknown = ids.filter(id => !profiles[id]);
  if (unknown.length) throw new ValidationError(`Unknown crop IDs: ${unknown.join(', ')}.`);
  return [...new Set(ids)];
}
