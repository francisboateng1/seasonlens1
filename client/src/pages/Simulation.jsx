import RotationSimulator from '../components/RotationSimulator.jsx';
export default function Simulation({ farm }) {
  return <div className="page-wrap"><div className="page-heading"><div><p className="eyebrow">PLANNING WORKSPACE</p><h1>Crop rotation simulator</h1><p>Compare crop sequences using family diversity, legume inclusion and the priorities recorded for {farm.farmName}.</p></div></div><RotationSimulator farm={farm} /></div>;
}
