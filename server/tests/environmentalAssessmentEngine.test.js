import test from 'node:test';
import assert from 'node:assert/strict';
import { assessEnvironment } from '../src/engine/environmentalAssessmentEngine.js';

const values = (dates, data) => ({ values: dates.map((date, index) => ({ date, value: data[index], missing: data[index] === null })) });

test('environment assessment calculates rainfall, wet days, temperatures and coverage', () => {
  const dates = ['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04'];
  const result = assessEnvironment({
    metadata: { source: 'NASA POWER test fixture', retrievedAt: new Date().toISOString(), requestedPeriod: { start: dates[0], end: dates.at(-1) } },
    parameters: {
      PRECTOTCORR: values(dates, [0, 1.5, 2.5, null]),
      T2M: values(dates, [25, 26, 27, 28]),
      T2M_MAX: values(dates, [30, 31, 32, 33]),
      T2M_MIN: values(dates, [20, 21, 22, 23])
    }
  });
  assert.equal(result.rainfall.totalMm, 4);
  assert.equal(result.rainfall.wetDaysAtLeast1mm, 2);
  assert.equal(result.temperature.meanC, 26.5);
  assert.equal(result.temperature.meanDailyMaximumC, 31.5);
  assert.equal(result.dataQuality.missingPercentage, 6.3);
  assert.deepEqual(result.period, { start: dates[0], end: dates.at(-1), requested: { start: dates[0], end: dates.at(-1) } });
  assert.equal(result.interpretation.includes('not a forecast'), true);
});

test('environment assessment reports unavailable when there are no observations', () => {
  const result = assessEnvironment({ parameters: {}, metadata: {} });
  assert.equal(result.rainfall.totalMm, null);
  assert.equal(result.temperature.meanC, null);
  assert.equal(result.dataQuality.status, 'unavailable');
});
