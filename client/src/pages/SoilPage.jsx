import { useCallback, useEffect, useState } from 'react';
import SoilAnalysis from '../components/SoilAnalysis.jsx';
import { getSoil } from '../services/api.js';
export default function SoilPage({ farm }) {
  const [soil, setSoil] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = useCallback(async () => { setError(''); const data = await getSoil(farm.farmId); setSoil(data); }, [farm.farmId]);
  useEffect(() => { let active = true; setLoading(true); getSoil(farm.farmId).then(v => { if (active) setSoil(v); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [farm.farmId]);
  return <div className="page-wrap"><div className="page-heading"><div><p className="eyebrow">SOIL CONTEXT</p><h1>Soil analysis</h1><p>SoilGrids is independently operated by ISRIC and is not a NASA dataset.</p></div></div>{loading && <div className="state-card">Checking available soil information…</div>}{error && <div className="state-card state-error">{error}</div>}{soil && <SoilAnalysis soil={soil} farm={farm} onRefresh={refresh} />}</div>;
}
