import Dashboard from '../components/Dashboard.jsx';
export default function DashboardPage({ farm }) {
  return <div className="page-wrap"><div className="page-heading"><div><p className="eyebrow">FARM OVERVIEW</p><h1>{farm.farmName}</h1><p>{farm.locationDescription || 'Farm environmental overview'} · {Number(farm.areaHectares).toLocaleString()} ha</p></div></div><Dashboard farm={farm} /></div>;
}
