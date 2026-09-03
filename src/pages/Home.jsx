import { Link } from 'react-router-dom'
import VoojBadge from '../components/VoojBadge.jsx'

const enlaces = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-vooj-bone text-vooj-ink flex flex-col items-center justify-center px-6">
      <VoojBadge className="text-5xl sm:text-7xl md:text-8xl px-6 py-4 sm:px-8 sm:py-5" />

      <div className="mt-8 h-px w-40 bg-vooj-ink/25" />

      <p className="mt-6 vooj-eyebrow text-sm tracking-wordmark text-vooj-ink/70">
        Boutique de moda
      </p>

      <nav className="mt-16 flex flex-wrap justify-center gap-8">
        {enlaces.map((e) => (
          <Link
            key={e.to}
            to={e.to}
            className="vooj-eyebrow text-vooj-ink/60 hover:text-vooj-ink transition-colors"
          >
            {e.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
