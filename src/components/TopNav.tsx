import { Link } from 'react-router-dom'

export function TopNav() {
  return (
    <nav className="topnav">
      <div className="brand">
        <span className="dot"/>
        <Link to="/" className="nav-link" style={{padding:0, border:'none'}}>HELLO Zema</Link>
      </div>
      <div className="nav-actions">
        <Link className="nav-link" to="/playground">Playground</Link>
        <Link className="nav-link" to="/steps">Steps</Link>
      </div>
    </nav>
  )
}
