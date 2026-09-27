import { Link } from 'react-router'

export function Topbar() {
  return (
    <header className="topbar">
      <Link to="/" className="wordmark">
        encuestas
      </Link>
    </header>
  )
}
