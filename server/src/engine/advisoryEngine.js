import { cropProfiles } from '../data/cropProfiles.js';
import { advisoryRules } from '../data/advisoryRules.js';
import { evaluatePlantingWindow } from './plantingWindowEngine.js';
import { assessEnvironment } from './environmentalAssessmentEngine.js';
const labels={favourable:advisoryRules.favourableLabel,moderate:advisoryRules.moderateLabel,unfavourable:advisoryRules.unfavourableLabel,insufficient_data:advisoryRules.insufficientLabel};
export function createAdvisory({cropId,observations,soilData=null,assessmentDate=new Date().toISOString().slice(0,10)}) {
  const crop=cropProfiles[cropId];
  if(!crop) throw Object.assign(new Error(`Unknown cropId: ${cropId}`),{status:400,code:'UNKNOWN_CROP'});
  const environment=assessEnvironment(observations), window=evaluatePlantingWindow({cropId,observations});
  const reasons=[], warnings=[...(window.warnings||[]),...advisoryRules.generalLimitations];
  let status='insufficient_data';
  if(!window.supported) reasons.push(window.reason||'The required recent observations are incomplete.');
  else if(window.criticalHeat||window.criticalCold||window.veryDry){status='unfavourable';reasons.push('One or more critical screening conditions were observed in the available recent data.');}
  else if(window.rainfallSupport&&window.temperatureSupport){status='favourable';reasons.push('Recent observed rainfall and mean temperature are within this crop profile’s provisional screening ranges.');}
  else {status='moderate';reasons.push('Some observed conditions align with the crop profile, but other signals require field verification.');}
  const soilKnown=Boolean(soilData&&(soilData.measurements?.length||soilData.properties));
  if(!soilKnown) warnings.push('No farm-specific soil test or field observation was supplied. Check drainage, texture, pH and soil moisture on site.');
  else if(soilData.dataType!=='measured') warnings.push('Soil information is estimated or user-supplied and has not been independently verified.');
  if(status==='favourable'&&!soilKnown){status='moderate';reasons.push('Weather screening is favourable, but absent farm-specific soil evidence moderates the overall result.');}
  if(crop.provisional) warnings.push('Crop thresholds and profile values are provisional; local agronomic review is required.');
  const confidence=status==='insufficient_data'?'very_low':soilKnown&&environment.dataQuality.status==='good'?'moderate':'low';
  return {status,headline:labels[status],crop:{cropId,name:crop.name,profileConfidence:crop.confidence,thresholdsProvisional:crop.provisional},assessmentDate,observationPeriod:environment.period,reasons,
    observedSignals:window.supported?{recentRainfallMm:window.rainfallTotalMm,meanTemperatureC:window.meanTemperatureC,validRainfallDays:window.rainfallDays,validTemperatureDays:window.temperatureDays}:null,
    warnings:[...new Set(warnings)],sources:[observations?.metadata?.source||'NASA POWER (when observations are supplied)',...crop.sources.map(s=>s.name)],dataQuality:environment.dataQuality,confidence,limitations:advisoryRules.generalLimitations,
    nextAction:status==='unfavourable'?'Check local forecast, soil moisture and extension guidance before deciding whether to delay planting.':status==='insufficient_data'?'Retrieve a complete recent observation window or check local records; do not infer suitability from missing values.':'Check field soil moisture, drainage, seed quality, the local forecast and extension guidance before deciding to plant.'};
}
