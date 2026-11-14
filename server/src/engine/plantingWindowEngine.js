import { plantingThresholds } from '../data/plantingThresholds.js';
import { advisoryRules } from '../data/advisoryRules.js';
const valid = (obs,code) => (obs?.parameters?.[code]?.values || []).slice(-advisoryRules.recentWindowDays).filter(item=>Number.isFinite(item.value));
export function evaluatePlantingWindow({cropId,observations}) {
  const t=plantingThresholds[cropId];
  if(!t) return {supported:false,reason:'No screening thresholds exist for this crop.'};
  const rain=valid(observations,'PRECTOTCORR');
  const temps=valid(observations,'T2M');
  if(rain.length<t.minDays || temps.length<t.minDays) return {supported:false,reason:`At least ${t.minDays} valid daily rainfall and temperature observations are required; received ${rain.length} and ${temps.length}.`,rainfallDays:rain.length,temperatureDays:temps.length,warnings:['The requested period may be incomplete or recent NASA values may not yet be available.']};
  const rainfallTotal=rain.reduce((s,i)=>s+i.value,0), meanTemperature=temps.reduce((s,i)=>s+i.value,0)/temps.length;
  const criticalHeat=temps.filter(i=>i.value>t.tempMax).length>=Math.ceil(temps.length*.6);
  const criticalCold=temps.filter(i=>i.value<t.tempMin).length>=Math.ceil(temps.length*.6);
  const veryDry=rainfallTotal<t.rainfall14dDryMm, rainfallSupport=rainfallTotal>=t.rainfall14dMinMm;
  const temperatureSupport=meanTemperature>=t.preferredMin && meanTemperature<=t.preferredMax;
  const warnings=[];
  if(!rainfallSupport) warnings.push(`Recent observed rainfall (${rainfallTotal.toFixed(1)} mm) is below the provisional screening level (${t.rainfall14dMinMm} mm); this is not a forecast.`);
  if(!temperatureSupport) warnings.push(`Mean observed temperature (${meanTemperature.toFixed(1)}°C) is outside the provisional preferred band (${t.preferredMin}–${t.preferredMax}°C).`);
  if(criticalHeat) warnings.push('Most available daily temperatures exceeded the provisional upper screening limit.');
  if(criticalCold) warnings.push('Most available daily temperatures fell below the provisional lower screening limit.');
  if(veryDry) warnings.push('Recent observed rainfall was very low; inspect soil moisture and water access.');
  return {supported:true,rainfallTotalMm:+rainfallTotal.toFixed(1),meanTemperatureC:+meanTemperature.toFixed(1),rainfallDays:rain.length,temperatureDays:temps.length,criticalHeat,criticalCold,veryDry,rainfallSupport,temperatureSupport,warnings};
}
