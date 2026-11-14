export const jsonOk = (data, meta = {}) => ({ success: true, data, meta });
export function jsonError(error, requestId) { return { success: false, error: { code: error.code || 'INTERNAL_ERROR', message: error.message || 'Unexpected error.', ...(error.details ? { details: error.details } : {}) }, meta: { requestId, timestamp: new Date().toISOString() } }; }
export function round(value, digits = 2) { if (!Number.isFinite(value)) return null; const p = 10 ** digits; return Math.round((value + Number.EPSILON) * p) / p; }
