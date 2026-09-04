import { Link } from 'react-router-dom'
import VoojBadge from '../components/VoojBadge.jsx'
import BannerCarrusel from '../components/BannerCarrusel.jsx'

const enlaces = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-vooj-bone text-vooj-ink flex flex-col items-center px-6 py-16">
      <VoojBadge className="w-full max-w-[280px] sm:max-w-[360px]" />

      <div className="mt-10 w-full max-w-4xl">
        <BannerCarrusel />
      </div>

      <nav className="mt-12 flex flex-wrap justify-center gap-8">
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
