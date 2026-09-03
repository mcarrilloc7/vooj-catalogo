import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth.jsx'
import ProductosAdmin from './ProductosAdmin.jsx'

export default function AdminPanel() {
  const { perfil, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-vooj-black text-vooj-bone flex flex-col">
      <header className="border-b border-vooj-bone/10">
        <div className="mx-auto max-w-5xl w-full px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="vooj-wordmark text-lg">
            VOOJ
          </Link>
          <div className="flex items-center gap-4">
            <span className="vooj-eyebrow text-vooj-bone/60 normal-case sm:uppercase">
              {perfil.nombre}
              <span className="text-vooj-bone/30"> · {perfil.rol}</span>
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
