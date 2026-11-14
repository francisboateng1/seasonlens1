export function assessSoil(soilData){
  if(!soilData||(!Array.isArray(soilData.measurements)&&!soilData.properties))return {status:'unavailable',dataType:null,message:'No soil measurements are stored for this farm. SoilGrids REST access is currently paused; no values are substituted.',source:'ISRIC SoilGrids status notice',measurements:[]};
  return {status:'available',dataType:soilData.dataType||'measured',source:soilData.source||'Farmer-supplied field record',measurements:soilData.measurements||soilData.properties||[],disclaimer:'User-entered values are not independently verified. Laboratory analysis and local interpretation are recommended.'};
}
