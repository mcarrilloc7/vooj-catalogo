import { Link } from 'react-router-dom'
import VoojBadge from '../VoojBadge.jsx'

/** Contenedor a pantalla completa, centrado, con la paleta clara VOOJ. */
export default function PantallaCentrada({ children }) {
  return (
    <div className="min-h-screen bg-vooj-bone text-vooj-ink flex flex-col items-center justify-center px-6">
      <Link to="/" aria-label="VOOJ — inicio">
        <VoojBadge className="text-2xl px-4 py-2" />
      </Link>
      <p className="mt-3 vooj-eyebrow text-vooj-ink/50">Panel privado</p>
      <div className="mt-10 w-full max-w-xs flex flex-col items-center">
        {children}
      </div>
    </div>
  )
}
