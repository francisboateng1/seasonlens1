import { config } from '../config/config.js';
import { validateCoordinates, validatePowerDates, ValidationError } from '../utils/validation.js';
import { toIsoDate } from '../utils/dateUtils.js';
export const NASA_PARAMETERS = {
  PRECTOTCORR: {
    code: 'PRECTOTCORR',
    name: 'Corrected precipitation',
    unit: 'mm/day',
    temporalResolution: 'daily'
  },
  T2M: {
    code: 'T2M',
    name: 'Temperature at 2 metres (daily mean)',
    unit: '\u00B0C',
    temporalResolution: 'daily'
  },
  T2M_MAX: {
    code: 'T2M_MAX',
    name: 'Maximum temperature at 2 metres',
    unit: '\u00B0C',
    temporalResolution: 'daily'
  },
  T2M_MIN: {
    code: 'T2M_MIN',
    name: 'Minimum temperature at 2 metres',
    unit: '\u00B0C',
    temporalResolution: 'daily'
  },
  RH2M: {
    code: 'RH2M',
    name: 'Relative humidity at 2 metres',
    unit: '%',
    temporalResolution: 'daily'
  },
  ALLSKY_SFC_SW_DWN: {
    code: 'ALLSKY_SFC_SW_DWN',
    name: 'All-sky surface shortwave solar radiation',
    unit: 'MJ/m^2/day',
    temporalResolution: 'daily'
  },
  WS10M: {
    code: 'WS10M',
    name: 'Wind speed at 10 metres',
    unit: 'm/s',
    temporalResolution: 'daily'
  },
  PS: {
    code: 'PS',
    name: 'Surface atmospheric pressure',
    unit: 'kPa',
    temporalResolution: 'daily'
  }
};
const cache=new Map();
const MAX_CACHE_ENTRIES=100;
function pruneCache(){const now=Date.now();for(const [key,entry] of cache)if(now-entry.at>=config.nasaCacheTtlMs)cache.delete(key);while(cache.size>=MAX_CACHE_ENTRIES)cache.delete(cache.keys().next().value);}
export class NasaPowerError extends Error{constructor(message,status=502,code='NASA_UPSTREAM_ERROR'){super(message);this.name='NasaPowerError';this.status=status;this.code=code;}}
function missing(value,fill){if(value===null||value===undefined||value==='')return true;const n=Number(value);return !Number.isFinite(n)||n===-999||n===Number(fill);}
export function normalizeNasaResponse(raw,request){
  const source=raw?.properties?.parameter;if(!source||typeof source!=='object')throw new NasaPowerError('NASA POWER returned an unexpected response structure.');
  const parameters={},warnings=[],header=raw.header||{},fill=header.fill_value??-999;
  for(const code of request.parameters){const meta=NASA_PARAMETERS[code],values=source[code];
    if(!values||typeof values!=='object'){warnings.push(`NASA POWER did not return parameter ${code}.`);parameters[code]={...meta,values:[],missingCount:0,source:'NASA POWER'};continue;}
    const normalized=Object.entries(values).sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>{const isMissing=missing(value,fill);return {date:toIsoDate(date),value:isMissing?null:Number(value),missing:isMissing};});
    parameters[code]={...meta,values:normalized,missingCount:normalized.filter(v=>v.missing).length,source:'NASA POWER'};
    if(normalized.length&&normalized.every(v=>v.missing))warnings.push(`All values for ${code} are missing in the requested period.`);
  }
  const dates=Object.values(parameters).flatMap(p=>p.values.map(v=>v.date)).filter(Boolean).sort();
  return {metadata:{source:'NASA POWER',sourceUrl:'https://power.larc.nasa.gov/',endpoint:config.nasaBaseUrl,community:request.community,temporalResolution:'daily',timeStandard:'UTC',coordinates:{latitude:request.latitude,longitude:request.longitude},requestedPeriod:{start:toIsoDate(request.start),end:toIsoDate(request.end)},actualPeriod:{start:dates[0]||null,end:dates.at(-1)||null},retrievedAt:new Date().toISOString(),isLive:true,isDemo:false,qualityStatus:warnings.length?'partial':'available',qualityWarnings:warnings,nasaHeader:header,messages:raw.messages||[]},parameters};
}
export async function fetchNasaObservations({latitude,longitude,start,end,parameters=Object.keys(NASA_PARAMETERS),community=config.nasaCommunity,fetchImpl=fetch}){
  const coordinates=validateCoordinates(latitude,longitude);validatePowerDates(start,end);
  if(!Array.isArray(parameters)||!parameters.length||parameters.length>20)throw new ValidationError('parameters must contain between 1 and 20 codes.');
  const unique=[...new Set(parameters.map(v=>String(v).trim().toUpperCase()))],unknown=unique.filter(v=>!NASA_PARAMETERS[v]);
  if(unknown.length)throw new ValidationError(`Unsupported NASA POWER parameters: ${unknown.join(', ')}.`);
  if(!['AG','RE','SB','HY'].includes(community))throw new ValidationError('community must be AG, RE, SB or HY.');
  const request={...coordinates,start,end,parameters:unique,community},key=JSON.stringify(request),cached=cache.get(key);
  if(cached&&Date.now()-cached.at<config.nasaCacheTtlMs)return {...cached.data,metadata:{...cached.data.metadata,cache:'hit'}};
  const url=new URL(config.nasaBaseUrl);url.search=new URLSearchParams({parameters:unique.join(','),community,longitude:String(coordinates.longitude),latitude:String(coordinates.latitude),start,end,format:'JSON','time-standard':'UTC'});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.nasaTimeoutMs);
  try{
    const response=await fetchImpl(url,{signal:controller.signal,headers:{Accept:'application/json'}}),rawText=await response.text();let raw;
    try{raw=JSON.parse(rawText);}catch{throw new NasaPowerError('NASA POWER returned a non-JSON response.');}
    if(!response.ok){const detail=Array.isArray(raw.messages)?raw.messages.join('; '):raw.messages||raw.header?.title||response.statusText;throw new NasaPowerError(`NASA POWER request failed (${response.status}): ${String(detail).slice(0,500)}`,response.status===429?429:502,response.status===429?'NASA_RATE_LIMIT':'NASA_UPSTREAM_ERROR');}
    const data=normalizeNasaResponse(raw,request);pruneCache();cache.set(key,{at:Date.now(),data});return data;
  }catch(error){
    if(error instanceof NasaPowerError||error instanceof ValidationError)throw error;
    if(error.name==='AbortError')throw new NasaPowerError(`NASA POWER request timed out after ${config.nasaTimeoutMs} ms.`,504,'NASA_TIMEOUT');
    throw new NasaPowerError(`Could not reach NASA POWER: ${error.message}`,502,'NASA_NETWORK_ERROR');
  }finally{clearTimeout(timer);}
}
export function clearNasaCache(){cache.clear();}
