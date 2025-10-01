import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="route">
      <header className="hero home">
        <h1 className="title">Hello Zema</h1>
        <p className="subtitle">Build your first anonymous survey system. Private by design.</p>
        <div className="cta-row">
          <Link className="cta" to="/playground">Try Survey Demo</Link>
          <Link className="cta secondary" to="/steps">Start Tutorial</Link>
        </div>
        <div className="ring ring-1" aria-hidden />
        <div className="ring ring-2" aria-hidden />
        <div className="fx grain"/>
      </header>

      <section className="home-sections">
        <div className="feature">
          <div className="icon">📊</div>
          <div>
            <h3>Submit</h3>
            <p>Submit encrypted survey responses that stay private while onchain.</p>
          </div>
        </div>
        <div className="feature">
          <div className="icon">🔐</div>
          <div>
            <h3>Aggregate</h3>
            <p>Calculate statistics on encrypted data without revealing individual responses.</p>
          </div>
        </div>
        <div className="feature">
          <div className="icon">📈</div>
          <div>
            <h3>Reveal</h3>
          <p>Show only aggregate results while keeping all responses confidential.</p>
          </div>
        </div>
      </section>

      <section className="home-actions">
        <Link className="action-card" to="/playground">
          <div className="action-title">Interactive Demo</div>
          <p>Experience the anonymous survey flow with mocked encryption and real-time feedback.</p>
        </Link>
        <Link className="action-card" to="/steps">
          <div className="action-title">Step-by-Step Guide</div>
          <p>Learn to build confidential surveys: encrypt → submit → aggregate → decrypt results.</p>
        </Link>
      </section>
    </div>
  )
}
