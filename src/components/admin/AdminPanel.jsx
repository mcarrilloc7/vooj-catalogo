import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import VoojBadge from '../VoojBadge.jsx'
import ProductosAdmin from './ProductosAdmin.jsx'

export default function AdminPanel() {
  const { perfil, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-vooj-bone text-vooj-ink flex flex-col">
      <header className="border-b border-vooj-ink/15">
        <div className="mx-auto max-w-5xl w-full px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" aria-label="VOOJ — inicio">
            <VoojBadge variant="mark" className="h-11 w-11" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="vooj-eyebrow text-vooj-ink/70 normal-case sm:uppercase">
              {perfil.nombre}
              <span className="text-vooj-ink/40"> · {perfil.rol}</span>
            </span>
            <button onClick={signOut} className="vooj-btn py-2">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-12">
        <ProductosAdmin />
      </main>
    </div>
  )
}
