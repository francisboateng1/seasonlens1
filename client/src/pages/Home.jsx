import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

const scenes = [
  { className: 'sl-scene--harvest', caption: 'Plan with a clearer picture of your field' },
  { className: 'sl-scene--green', caption: 'Bring climate context into crop decisions' },
  { className: 'sl-scene--soil', caption: 'Compare options before the growing season' }
];

const explorePath = (farm) => (farm ? '/dashboard' : '/setup');

export default function Home({ farm }) {
  const [activeScene, setActiveScene] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroPaused, setHeroPaused] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [typedPhrase, setTypedPhrase] = useState('field context');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const phrases = ['field context', 'climate patterns', 'rotation options'];
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setTypedPhrase(phrases[0]);
      return undefined;
    }

    let phraseIndex = 0;
    let position = phrases[0].length;
    let deleting = true;
    let cancelled = false;
    let timeoutId;

    const tick = () => {
      if (cancelled) return;
      const phrase = phrases[phraseIndex];

      if (deleting) {
        position = Math.max(0, position - 1);
        setTypedPhrase(phrase.slice(0, position));
        if (position === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timeoutId = window.setTimeout(tick, 420);
        } else {
          timeoutId = window.setTimeout(tick, 48);
        }
      } else {
        const nextPhrase = phrases[phraseIndex];
        position = Math.min(nextPhrase.length, position + 1);
        setTypedPhrase(nextPhrase.slice(0, position));
        if (position === nextPhrase.length) {
          deleting = true;
          timeoutId = window.setTimeout(tick, 1900);
        } else {
          timeoutId = window.setTimeout(tick, 92);
        }
      }
    };

    timeoutId = window.setTimeout(tick, 1900);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    if (heroPaused || !tabVisible || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const intervalId = window.setInterval(() => {
      setActiveScene((current) => (current + 1) % scenes.length);
    }, 6500);
    return () => window.clearInterval(intervalId);
  }, [heroPaused, tabVisible]);

  useEffect(() => {
    const elements = document.querySelectorAll('.sl-reveal');
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('sl-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sl-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.title = 'Season Lens | Field intelligence for better growing decisions';
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute(
        'content',
        'Season Lens combines NASA POWER daily environmental observations with farm and crop context to support transparent planting and crop-rotation decisions.'
      );
    }
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const path = explorePath(farm);
  const exploreLabel = farm ? 'Open your workspace' : 'Explore the workspace';

  return (
    <main className="sl-landing">
      <nav className={`sl-nav${scrolled ? ' sl-nav--scrolled' : ''}`} aria-label="Main navigation">
        <Link className="sl-brand" to="/" onClick={closeMenu} aria-label="Season Lens home">
          <span className="sl-brand-mark" aria-hidden="true">✳</span>
          <span>Season <strong>Lens</strong></span>
        </Link>

        <button
          className={`sl-menu-toggle${menuOpen ? ' sl-menu-toggle--open' : ''}`}
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>

        <div className={`sl-nav-links${menuOpen ? ' sl-nav-links--open' : ''}`}>
          <a href="#why" onClick={closeMenu}>Why Season Lens</a>
          <a href="#how" onClick={closeMenu}>How it works</a>
          <a href="#data" onClick={closeMenu}>Data &amp; sources</a>
          <a className="sl-nav-muted" href="#accounts" onClick={closeMenu}>Saved work</a>
        </div>

        <Link className="sl-nav-cta" to={path} onClick={closeMenu}>
          <span>{exploreLabel}</span><span aria-hidden="true">↗</span>
        </Link>
      </nav>

      <header
        className="sl-hero"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        <div className="sl-hero-scenes" aria-hidden="true">
          {scenes.map((scene, index) => (
            <div
              key={scene.className}
              className={`sl-hero-scene ${scene.className}${activeScene === index ? ' sl-hero-scene--active' : ''}`}
            />
          ))}
        </div>
        <div className="sl-hero-shade" aria-hidden="true" />

        <div className="sl-hero-inner">
          <div className="sl-hero-copy">
            <div className="sl-eyebrow-pill"><span className="sl-pulse-dot" /> NASA POWER · FARM-LEVEL DECISION SUPPORT</div>
            <h1>
              See your field's <em>{typedPhrase}<span className="sl-type-cursor" aria-hidden="true" /></em> before you plant.
            </h1>
            <p className="sl-hero-lead">
              Season Lens brings daily NASA climate observations, farm location and crop context
              together to help farmers compare planting conditions and explore crop-rotation choices.
            </p>
            <div className="sl-hero-actions">
              <Link className="sl-button sl-button--primary" to={path}>
                {exploreLabel}<span aria-hidden="true">→</span>
              </Link>
              <a className="sl-button sl-button--glass" href="#how">See how it works</a>
            </div>
            <p className="sl-hero-note">
              <span aria-hidden="true">ⓘ</span>
              Observations support decisions; they are not a weather forecast or a guarantee of yield.
            </p>
          </div>

          <div className="sl-hero-proof" aria-label="Season Lens capabilities">
            <div><strong>NASA POWER</strong><span>Daily environmental observations</span></div>
            <div><strong>Farm-specific</strong><span>Coordinates and field context</span></div>
            <div><strong>Crop-aware</strong><span>Screening and rotation comparisons</span></div>
          </div>
        </div>

        <div className="sl-hero-caption" aria-live="polite">
          <span className="sl-caption-dot" />{scenes[activeScene].caption}
        </div>
        <div className="sl-hero-dots" role="group" aria-label="Choose background scene">
          {scenes.map((scene, index) => (
            <button
              key={scene.className}
              type="button"
              className={activeScene === index ? 'sl-hero-dot sl-hero-dot--active' : 'sl-hero-dot'}
              aria-label={`Show scene ${index + 1}: ${scene.caption}`}
              aria-pressed={activeScene === index}
              onClick={() => setActiveScene(index)}
            />
          ))}
        </div>
      </header>

      <section className="sl-section" id="why">
        <div className="sl-wrap">
          <span className="sl-eyebrow sl-reveal">Built for real farm decisions</span>
          <h2 className="sl-section-title sl-reveal">More context for the choices you make in the field.</h2>
          <p className="sl-section-intro sl-reveal sl-delay-1">
            Season Lens is a decision-support prototype. It brings environmental observations,
            crop profiles and farm information into one place, then makes its checks and limitations visible.
          </p>

          <div className="sl-feature-grid">
            <article className="sl-feature-card sl-reveal" style={{ '--sl-accent': '#54df9a' }}>
              <span className="sl-feature-icon" aria-hidden="true">⌖</span>
              <h3>Farm-location context</h3>
              <p>Use a farm's coordinates to request daily NASA POWER observations for its location and selected period.</p>
            </article>
            <article className="sl-feature-card sl-reveal sl-delay-1" style={{ '--sl-accent': '#72b7ff' }}>
              <span className="sl-feature-icon" aria-hidden="true">♧</span>
              <h3>Crop-aware screening</h3>
              <p>Review crop-specific checks with visible evidence, provisional thresholds and clear limitations.</p>
            </article>
            <article className="sl-feature-card sl-reveal sl-delay-2" style={{ '--sl-accent': '#ffc36b' }}>
              <span className="sl-feature-icon" aria-hidden="true">⇄</span>
              <h3>Rotation comparisons</h3>
              <p>Compare candidate crop sequences using transparent rules and heuristic scores, not predicted yields.</p>
            </article>
            <article className="sl-feature-card sl-reveal" style={{ '--sl-accent': '#b9a2ff' }}>
              <span className="sl-feature-icon" aria-hidden="true">◉</span>
              <h3>Soil-data provenance</h3>
              <p>Record soil observations as measured or estimated, with their source and depth kept alongside the values.</p>
            </article>
            <article className="sl-feature-card sl-reveal sl-delay-1" style={{ '--sl-accent': '#54dfd2' }}>
              <span className="sl-feature-icon" aria-hidden="true">⌁</span>
              <h3>Visible data quality</h3>
              <p>Review missing observations, source information and retrieval dates instead of silently filling gaps.</p>
            </article>
            <article className="sl-feature-card sl-reveal sl-delay-2" style={{ '--sl-accent': '#ff9b87' }}>
              <span className="sl-feature-icon" aria-hidden="true">◎</span>
              <h3>Explainable limitations</h3>
              <p>Season Lens distinguishes historical or near-real-time observations from forecasts and agronomic guarantees.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="sl-steps-band" id="how">
        <div className="sl-wrap">
          <span className="sl-eyebrow sl-reveal">A practical workflow</span>
          <h2 className="sl-section-title sl-reveal">From a farm location to a more informed comparison.</h2>
          <p className="sl-section-intro sl-reveal sl-delay-1">
            The data pipeline supports the decision. Farmers remain in control of the final choice.
          </p>
          <div className="sl-steps-grid">
            <article className="sl-step sl-reveal">
              <span className="sl-step-number">01</span>
              <h3>Add a farm location</h3>
              <p>Enter farm details and select its coordinates on the map to establish the location for environmental observations.</p>
            </article>
            <article className="sl-step sl-reveal sl-delay-1">
              <span className="sl-step-number">02</span>
              <h3>Review the evidence</h3>
              <p>Inspect NASA POWER observations, crop information and any soil records you have entered.</p>
            </article>
            <article className="sl-step sl-reveal sl-delay-2">
              <span className="sl-step-number">03</span>
              <h3>Compare and decide</h3>
              <p>Explore planting assessments and rotation alternatives, including the assumptions behind their scores.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="sl-section" id="data">
        <div className="sl-wrap">
          <span className="sl-eyebrow sl-reveal">Grounded in identified sources</span>
          <h2 className="sl-section-title sl-reveal">Know where the information comes from.</h2>
          <p className="sl-section-intro sl-reveal sl-delay-1">
            We list the resources currently connected to the application separately from datasets
            that may be considered for future development.
          </p>
          <div className="sl-data-grid">
            <article className="sl-data-card sl-reveal" style={{ '--sl-accent': '#54df9a' }}>
              <span className="sl-data-tag">NASA · VERIFIED INTEGRATION</span>
              <h3>NASA POWER Daily Point API</h3>
              <p>Location-based daily precipitation, temperature and relative-humidity observations are retrieved by the backend.</p>
              <a href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/" target="_blank" rel="noreferrer">Read NASA POWER documentation ↗</a>
            </article>
            <article className="sl-data-card sl-reveal sl-delay-1" style={{ '--sl-accent': '#72b7ff' }}>
              <span className="sl-data-tag">FARMER-PROVIDED INFORMATION</span>
              <h3>Soil observations</h3>
              <p>Farmers can record measured or estimated soil values and identify the source and sampling depth.</p>
              <span className="sl-data-footnote">Not presented as a live NASA soil-data feed.</span>
            </article>
            <article className="sl-data-card sl-reveal sl-delay-2" style={{ '--sl-accent': '#ffc36b' }}>
              <span className="sl-data-tag">APPLICATION DATA</span>
              <h3>Crop profiles and decision rules</h3>
              <p>Crop reference profiles and transparent screening logic support advisory and rotation comparisons.</p>
              <span className="sl-data-footnote">Heuristic comparisons are not validated yield forecasts.</span>
            </article>
            <article className="sl-data-card sl-reveal sl-delay-3" style={{ '--sl-accent': '#b9a2ff' }}>
              <span className="sl-data-tag">MAP TILES</span>
              <h3>OpenStreetMap</h3>
              <p>The farm-location map uses OpenStreetMap map tiles to help users select coordinates.</p>
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap attribution ↗</a>
            </article>
          </div>
          <p className="sl-data-caveat sl-reveal">
            Other NASA products such as SMAP, MODIS, GPM, Landsat and NEX-GDDP are not claimed here as
            integrated Season Lens datasets unless and until their use is implemented and verified.
          </p>
        </div>
      </section>

      <section className="sl-account-band" id="accounts">
        <div className="sl-account-inner sl-reveal">
          <div>
            <span className="sl-eyebrow">Explore first. Save across visits next.</span>
            <h2>Keep your farm decisions connected over time.</h2>
            <p>
              The current workspace supports farm setup and exploration, but account registration and private
              ownership controls are not enabled yet. Until those safeguards are completed, use
              demonstration details only—do not enter real farmer contact information or confidential farm records.
            </p>
          </div>
          <Link className="sl-button sl-button--primary" to={path}>{exploreLabel}<span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className="sl-footer">
        <div className="sl-footer-inner">
          <div className="sl-footer-brand">
            <span className="sl-brand-mark" aria-hidden="true">✳</span>
            <div><strong>Season Lens</strong><span>Field intelligence for better growing decisions</span></div>
          </div>
          <p>
            A decision-support prototype for NASA Space Apps Challenge 2026 —
            <em>Field Shift: Adapting Farms with NASA Data</em>.
          </p>
          <div className="sl-footer-meta">
            <a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">NASA POWER</a>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
            <span>Observations, not forecasts.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
