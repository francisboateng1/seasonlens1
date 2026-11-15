const configuredApiBase=import.meta.env.VITE_API_BASE||'/api';
const API_BASE=configuredApiBase.replace(/\/+$/, '');
export class ApiError extends Error{constructor(message,status,code,details){super(message);this.status=status;this.code=code;this.details=details;}}
export async function api(path,options={}){const response=await fetch(`${API_BASE}${path}`,{...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});let payload;try{payload=await response.json();}catch{throw new ApiError('The server returned an unreadable response.',response.status,'INVALID_RESPONSE');}if(!response.ok||payload.success===false)throw new ApiError(payload.error?.message||`Request failed (${response.status}).`,response.status,payload.error?.code,payload.error?.details);return payload.data;}
export const getFarms=()=>api('/farms');export const getFarm=id=>api(`/farms/${encodeURIComponent(id)}`);export const createFarm=payload=>api('/farms',{method:'POST',body:JSON.stringify(payload)});
export const getEnvironment=(id,params={})=>api(`/farms/${encodeURIComponent(id)}/environment?${new URLSearchParams(params)}`);
export const getSoil=id=>api(`/farms/${encodeURIComponent(id)}/soil`);export const saveSoilObservation=(id,payload)=>api(`/farms/${encodeURIComponent(id)}/soil/observations`,{method:'POST',body:JSON.stringify(payload)});
export const getCrops=()=>api('/crops');export const getSoilStatus=()=>api('/soil/status');export const getVoiceStatus=()=>api('/voice/status');
export const createRotation=payload=>api('/recommendations',{method:'POST',body:JSON.stringify(payload)});export const createAdvisory=payload=>api('/advisory',{method:'POST',body:JSON.stringify(payload)});
