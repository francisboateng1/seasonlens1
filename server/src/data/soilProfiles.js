export const soilProfiles = {
  sources: [{ name: 'ISRIC SoilGrids', url: 'https://www.isric.org/explore/soilgrids/', status: 'REST API temporarily paused' }],
  properties: [
    { property: 'pH (water)', unit: 'pH', broadInterpretiveRange: [5.5,7.5], depth: '0–30 cm' },
    { property: 'Organic carbon', unit: 'g/kg', depth: '0–30 cm' },
    { property: 'Clay fraction', unit: '%', depth: '0–30 cm' },
    { property: 'Sand fraction', unit: '%', depth: '0–30 cm' }
  ], note: 'These are broad interpretation aids, not soil-test standards or crop-specific prescriptions.'
};
