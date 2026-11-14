import Advisory from '../components/Advisory.jsx';
export default function AdvisoryPage({ farm }) {
  return <div className="page-wrap"><div className="page-heading"><div><p className="eyebrow">CROP-SPECIFIC ASSESSMENT</p><h1>Planting advisory</h1><p>Evidence-based screening of available recent observations. This is not a weather forecast or a guarantee of planting success.</p></div></div><Advisory farm={farm} /></div>;
}
