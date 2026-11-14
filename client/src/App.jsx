import { useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import FarmSetup from './pages/FarmSetup.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import Simulation from './pages/Simulation.jsx';
import SoilPage from './pages/SoilPage.jsx';
import AdvisoryPage from './pages/AdvisoryPage.jsx';
import VoiceAssistant from './components/VoiceAssistant.jsx';
import { getFarms } from './services/api.js';

function Layout({ farm, children }) {
  return <div className="app-shell"><header className="topbar"><Link className="brand" to="/"><span className="brand-mark">S</span><span>season<span>lens</span></span></Link><nav className="main-nav"><NavLink to="/dashboard">Dashboard</NavLink><NavLink to="/simulation">Rotation</NavLink><NavLink to="/soil">Soil</NavLink><NavLink to="/advisory">Advisory</NavLink></nav><div className="topbar-right">{farm ? <span className="farm-chip">{farm.farmName}</span> : <span className="farm-chip">No farm selected</span>}<Link to="/setup" className="topbar-setup">Add farm</Link></div></header><main>{children}</main><footer className="footer"><span>SEASONLENS · NASA SPACE APPS CHALLENGE</span><span>Earth observations for more informed farm decisions</span></footer>{farm && <VoiceAssistant />}</div>;
}

export default function App() {
  const [farm, setFarm] = useState(() => { try { return JSON.parse(localStorage.getItem('seasonlens.farm') || 'null'); } catch { return null; } });
  useEffect(() => { let active = true; getFarms().then(({ farms }) => { if (!active) return; if (!farm && farms?.length) { setFarm(farms[0]); localStorage.setItem('seasonlens.farm', JSON.stringify(farms[0])); } }).catch(() => {}); return () => { active = false; }; }, []);
  const updateFarm = (value) => { setFarm(value); localStorage.setItem('seasonlens.farm', JSON.stringify(value)); };
  return <BrowserRouter><Layout farm={farm}><Routes>
    <Route path="/" element={<Home farm={farm} />} />
    <Route path="/setup" element={<FarmSetup onCreated={updateFarm} />} />
    <Route path="/dashboard" element={farm ? <DashboardPage farm={farm} /> : <Navigate to="/setup" replace />} />
    <Route path="/simulation" element={farm ? <Simulation farm={farm} /> : <Navigate to="/setup" replace />} />
    <Route path="/soil" element={farm ? <SoilPage farm={farm} /> : <Navigate to="/setup" replace />} />
    <Route path="/advisory" element={farm ? <AdvisoryPage farm={farm} /> : <Navigate to="/setup" replace />} />
    <Route path="*" element={<div className="page-wrap"><div className="state-card">Page not found. <Link to="/">Return home</Link>.</div></div>} />
  </Routes></Layout></BrowserRouter>;
}
