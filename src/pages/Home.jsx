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
      {/* El logo ya incluye el lockup completo con "Boutique de moda",
          por eso no se repite como texto aquí. */}
      <VoojBadge className="w-full max-w-[380px] sm:max-w-[460px]" />

      <nav className="mt-10 flex flex-wrap justify-center gap-8">
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
