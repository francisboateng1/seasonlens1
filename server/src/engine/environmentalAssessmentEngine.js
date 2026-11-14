import { round } from '../utils/dataFormatter.js';
function getEntries(observations, code) {
  const values = observations?.parameters?.[code]?.values;
  if (Array.isArray(values)) return values;
  if (values && typeof values === 'object') return Object.entries(values).map(([date,value]) => ({date,value}));
  return [];
}
function valid(items) { return items.filter(item => Number.isFinite(item.value)); }
const mean = items => items.length ? items.reduce((sum,item)=>sum+item.value,0)/items.length : null;
export function assessEnvironment(observations) {
  const rainfallRaw=getEntries(observations,'PRECTOTCORR'), tempRaw=getEntries(observations,'T2M'), maxRaw=getEntries(observations,'T2M_MAX'), minRaw=getEntries(observations,'T2M_MIN');
  const rainfall=valid(rainfallRaw), temps=valid(tempRaw), maxTemps=valid(maxRaw), minTemps=valid(minRaw);
  const all=[...rainfallRaw,...tempRaw,...maxRaw,...minRaw], missing=all.filter(item=>!Number.isFinite(item.value)).length;
  const missingPct=all.length ? 100*missing/all.length : 100;
  const dates=[...new Set([...rainfallRaw,...tempRaw].map(item=>item.date).filter(Boolean))].sort();
  const retrievedAt=observations?.metadata?.retrievedAt || null;
  const retrievalAgeHours=retrievedAt ? Math.max(0,(Date.now()-Date.parse(retrievedAt))/3600000) : null;
  const warnings=[...(observations?.metadata?.qualityWarnings || [])];
  if(missingPct>10) warnings.push(`Approximately ${round(missingPct,1)}% of requested parameter-day values are missing.`);
  if(!rainfall.length) warnings.push('No valid precipitation observations were available.');
  if(!temps.length) warnings.push('No valid temperature observations were available.');
  return {
    period:{start:dates[0]||null,end:dates.at(-1)||null,requested:observations?.metadata?.requestedPeriod||null},
    rainfall:{totalMm:rainfall.length?round(rainfall.reduce((s,i)=>s+i.value,0)):null,wetDaysAtLeast1mm:rainfall.filter(i=>i.value>=1).length,validDays:rainfall.length,missingDays:rainfallRaw.length-rainfall.length},
    temperature:{meanC:round(mean(temps)),minObservedC:temps.length?round(Math.min(...temps.map(i=>i.value))):null,maxObservedC:temps.length?round(Math.max(...temps.map(i=>i.value))):null,meanDailyMaximumC:round(mean(maxTemps)),meanDailyMinimumC:round(mean(minTemps)),highestDailyMaximumC:maxTemps.length?round(Math.max(...maxTemps.map(i=>i.value))):null,lowestDailyMinimumC:minTemps.length?round(Math.min(...minTemps.map(i=>i.value))):null,validDays:temps.length},
    dataQuality:{status:!all.length?'unavailable':missingPct>30?'limited':missingPct>10?'partial':'good',missingPercentage:round(missingPct,1),retrievalAgeHours:round(retrievalAgeHours,1),freshness:retrievalAgeHours==null?'unknown':retrievalAgeHours<=24?'recently_retrieved':'older_retrieval'},
    warnings:[...new Set(warnings)], interpretation:'Historical/near-real-time observations for the requested period; not a forecast.'
  };
}
