import { useState } from 'react';
import { saveSoilObservation } from '../services/api.js';

export default function SoilAnalysis({ soil, farm, onRefresh }) {
  const [property, setProperty] = useState('pH');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('pH');
  const [depth, setDepth] = useState('0–20 cm');
  const [source, setSource] = useState('Farm field observation');
  const [dataType, setDataType] = useState('measured');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  if (!soil) return <div className="empty-state">Soil information has not been loaded.</div>;
  const record = soil.fieldObservation;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setSaved('');
    try {
      await saveSoilObservation(farm.farmId, { dataType, source, depth, measurements: [{ property, value: Number(value), unit }] });
      setSaved('Soil record saved and labeled with its source and data type.'); setValue(''); await onRefresh?.();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="stack-lg">
    <div className="notice notice-warning"><strong>SoilGrids data unavailable</strong><p>{soil.soilGrids?.message || 'The SoilGrids REST API is paused. No synthetic values are displayed.'}</p><a href={soil.soilGrids?.sourceUrl || 'https://isric.org/explore/soilgrids'} target="_blank" rel="noreferrer">ISRIC status and source information ↗</a></div>
    {record ? <section className="panel"><div className="section-heading"><div><span className="eyebrow">FARM RECORD</span><h3>Latest field observation</h3></div><span className={`tag ${record.dataType === 'measured' ? 'tag-green' : ''}`}>{record.dataType === 'measured' ? 'FIELD / LAB MEASUREMENT' : 'ESTIMATED'}</span></div><p className="small-note">Source: {record.source} · Depth: {record.depth || 'not specified'} · Recorded: {new Date(record.recordedAt).toLocaleString()}</p><div className="table-scroll"><table><thead><tr><th>Property</th><th>Value</th><th>Unit</th></tr></thead><tbody>{record.measurements.map((m, i) => <tr key={i}><td>{m.property}</td><td>{m.value}</td><td>{m.unit || '—'}</td></tr>)}</tbody></table></div>{soil.assessment?.disclaimer && <p className="small-note">{soil.assessment.disclaimer}</p>}</section> : <div className="state-card"><strong>No farm soil record yet</strong><p>SeasonLens has not measured soil at this farm. Add a laboratory result or field observation below; these values are kept separate from SoilGrids estimates.</p></div>}
    <section className="panel"><div className="section-heading"><div><span className="eyebrow">OPTIONAL FARM RECORD</span><h3>Add a soil observation</h3><p>Enter a real field or laboratory value. Do not estimate a value just to populate the page.</p></div></div>
      <form onSubmit={submit} className="form-grid soil-form">
        <div className="field"><label htmlFor="soil-property">Property</label><select id="soil-property" value={property} onChange={e => { setProperty(e.target.value); setUnit(({ pH: 'pH', 'Organic carbon': 'g/kg', 'Clay fraction': '%', 'Sand fraction': '%' })[e.target.value]); }}><option>pH</option><option>Organic carbon</option><option>Clay fraction</option><option>Sand fraction</option><option>Soil moisture</option></select></div>
        <div className="field"><label htmlFor="soil-value">Value</label><input id="soil-value" type="number" step="any" required value={value} onChange={e => setValue(e.target.value)} placeholder="Enter measured value" /></div>
        <div className="field"><label htmlFor="soil-unit">Unit</label><input id="soil-unit" required value={unit} onChange={e => setUnit(e.target.value)} /></div>
        <div className="field"><label htmlFor="soil-depth">Depth</label><input id="soil-depth" value={depth} onChange={e => setDepth(e.target.value)} placeholder="e.g. 0–20 cm" /></div>
        <div className="field"><label htmlFor="soil-source">Source / laboratory</label><input id="soil-source" required maxLength="120" value={source} onChange={e => setSource(e.target.value)} /></div>
        <div className="field"><label htmlFor="soil-type">Data classification</label><select id="soil-type" value={dataType} onChange={e => setDataType(e.target.value)}><option value="measured">Measured (field or laboratory)</option><option value="estimated">Estimated (clearly attributed)</option></select></div>
        <div className="field full"><div className="form-actions"><button className="button button-primary" disabled={busy || value === ''}>{busy ? 'Saving…' : 'Save soil observation'}</button></div></div>
      </form>{error && <p className="error-text">{error}</p>}{saved && <p className="success-text" role="status">{saved}</p>}
    </section>
  </div>;
}
