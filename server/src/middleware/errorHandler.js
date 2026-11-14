import {jsonError} from '../utils/dataFormatter.js';
export function notFoundHandler(req,res){res.status(404).json(jsonError(Object.assign(new Error(`Route not found: ${req.method} ${req.originalUrl}`),{code:'NOT_FOUND',status:404}),req.id));}
export function errorHandler(error,req,res,next){if(res.headersSent)return next(error);const status=Number.isInteger(error.status)?error.status:500;if(status>=500)console.error(`[${req.id||'request'}]`,error);res.status(status).json(jsonError(error,req.id));}
