import { Link } from 'react-router-dom';
export default function Home({ farm }) {
  return <>
    <section className="hero">
      <div>
        <p className="eyebrow">NASA EARTH OBSERVATIONS · FARM DECISION SUPPORT</p>
        <h1>Field intelligence for <em>better growing decisions.</em></h1>
        <p className="hero-copy">SeasonLens brings observed rainfall and temperature, crop characteristics and farm context together to support transparent planting and rotation decisions.</p>
        <div className="hero-actions"><Link className="button button-primary" to="/setup">{farm ? 'Register another farm' : 'Register a farm'}</Link>{farm && <Link className="button button-secondary" to="/dashboard">Open dashboard</Link>}</div>
        <p className="field-hint" style={{ marginTop: 16 }}>Decision support, not a harvest guarantee. Historical observations are not forecasts.</p>
      </div>
      <div className="hero-visual"><div className="hero-sun"/><div className="hero-land"/><div className="hero-stat"><strong>NASA POWER</strong><span>DAILY ENVIRONMENTAL DATA</span></div><div className="hero-caption">OBSERVE · COMPARE · DECIDE</div></div>
    </section>
    <section className="feature-row">
      <article className="feature"><div className="feature-icon">01</div><h3>Environmental context</h3><p>Explore observed rainfall and temperature patterns for a registered farm with clear source and data-quality information.</p></article>
      <article className="feature"><div className="feature-icon">02</div><h3>Crop-aware screening</h3><p>Review crop-specific planting checks with transparent provisional thresholds, evidence and limitations.</p></article>
      <article className="feature"><div className="feature-icon">03</div><h3>Rotation comparisons</h3><p>Compare crop sequences using diversity and legume considerations without overstating agronomic certainty.</p></article>
    </section>
  </>;
}
