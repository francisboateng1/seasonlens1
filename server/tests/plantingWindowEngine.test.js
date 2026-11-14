import test from 'node:test';import assert from 'node:assert/strict';import {evaluatePlantingWindow} from '../src/engine/plantingWindowEngine.js';
const data=(n,value)=>Array.from({length:n},(_,i)=>({date:`2025-01-${String(i+1).padStart(2,'0')}`,value}));
test('calculates recent rainfall and temperature signals',()=>{const r=evaluatePlantingWindow({cropId:'maize',observations:{parameters:{PRECTOTCORR:{values:data(14,2)},T2M:{values:data(14,27)}}}});assert.equal(r.supported,true);assert.equal(r.rainfallTotalMm,28);assert.equal(r.temperatureSupport,true);});
test('insufficient valid daily values are not assessed',()=>{const r=evaluatePlantingWindow({cropId:'maize',observations:{parameters:{PRECTOTCORR:{values:data(3,4)},T2M:{values:data(3,27)}}}});assert.equal(r.supported,false);});
