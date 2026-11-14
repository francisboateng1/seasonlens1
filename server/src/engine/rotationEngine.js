import { cropProfiles } from '../data/cropProfiles.js';
import { rotationRules } from '../data/rotationRules.js';
function scoreSequence(sequence,previousCrop,priorities){
  let score=0; const reasons=[]; const families=new Set(sequence.map(id=>cropProfiles[id].family));
  score+=families.size*rotationRules.diversityBonus;
  if(families.size>1) reasons.push('The sequence uses more than one crop family.');
  const legumes=sequence.filter(id=>cropProfiles[id].isLegume).length; score+=legumes*rotationRules.legumeBonus;
  if(legumes) reasons.push('The sequence includes a legume phase; actual nitrogen benefits depend on nodulation, residues and soil conditions.');
  sequence.forEach((id,index)=>{const prior=index===0?previousCrop:sequence[index-1],crop=cropProfiles[id];if(prior===id){score-=rotationRules.repeatPenalty;reasons.push(`Repeated ${crop.name} is penalized.`);}else if(prior&&cropProfiles[prior]?.family===crop.family)score-=rotationRules.sameFamilyPenalty;if(prior&&cropProfiles[prior]?.family==='Poaceae'&&crop.isLegume)score+=rotationRules.legumeAfterCerealBonus;});
  if(priorities.includes('diversify'))score+=families.size*rotationRules.priorityWeights.diversify;
  if(priorities.includes('legumes'))score+=legumes*rotationRules.priorityWeights.legumes;
  if(priorities.includes('soilCare'))score+=legumes*rotationRules.priorityWeights.soilCare;
  if(priorities.includes('shortDuration'))score+=sequence.reduce((s,id)=>s+(450-cropProfiles[id].growingDays.max)/100,0)*rotationRules.priorityWeights.shortDuration;
  if(priorities.includes('waterEfficiency'))score+=sequence.reduce((s,id)=>s+(1500-cropProfiles[id].rainfallMmPerSeason.max)/100,0)*rotationRules.priorityWeights.waterEfficiency;
  return {score:+score.toFixed(1),reasons:[...new Set(reasons)]};
}
export function generateRotations({selectedCrops,seasons,priorities=[],previousCrop=null}){
  if(!Number.isInteger(seasons)||seasons<2||seasons>6)throw Object.assign(new Error('seasons must be an integer from 2 to 6.'),{status:400,code:'VALIDATION_ERROR'});
  const unknown=selectedCrops.filter(id=>!cropProfiles[id]);if(unknown.length)throw Object.assign(new Error(`Unknown crop IDs: ${unknown.join(', ')}`),{status:400,code:'UNKNOWN_CROP'});
  const ids=[...new Set(selectedCrops)];if(!ids.length||ids.length>6)throw Object.assign(new Error('Select between 1 and 6 crops.'),{status:400,code:'VALIDATION_ERROR'});
  const sequences=[];const build=prefix=>{if(prefix.length===seasons){sequences.push(prefix);return;}ids.forEach(id=>build([...prefix,id]));};build([]);
  const ranked=sequences.map(sequence=>({sequence,...scoreSequence(sequence,previousCrop,priorities)})).sort((a,b)=>b.score-a.score||a.sequence.join().localeCompare(b.sequence.join()));
  return ranked.slice(0,3).map((item,index)=>({option:index+1,sequence:item.sequence.map((id,i)=>({season:i+1,cropId:id,cropName:cropProfiles[id].name,family:cropProfiles[id].family,growingDays:cropProfiles[id].growingDays})),score:item.score,
    whySuggested:[...(item.reasons.length?item.reasons:['Highest scoring option for the selected crop set and rule weights.']),...(priorities.includes('waterEfficiency')?['A broad crop rainfall-requirement range was used as a rough screening proxy; this is not measured crop water use or irrigation demand.']:[])],
    advantages:['Makes crop-family diversity visible where the sequence permits.','Includes legume phases for discussion with an agronomist.'],
    disadvantages:['Family differences do not eliminate crop-specific pest and disease risk.','The score does not model nutrients, water, labor or economics.'],
    assumptions:['Selected crops are locally feasible.','Durations and family groupings are broad crop-profile values.'],limitations:['This is a transparent heuristic, not a validated yield or soil-improvement model.','No measured soil nutrient balance is calculated.',...(priorities.includes('marketAccess')?['Market access was recorded as a priority but is not scored because no local price, buyer or transport data are connected.']:[]),...(priorities.includes('waterEfficiency')?['Water-efficiency ranking uses broad crop rainfall requirement ranges only; it does not estimate actual evapotranspiration or irrigation use.']:[])]}));
}
