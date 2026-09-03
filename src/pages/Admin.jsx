import { useAuth } from '../lib/auth.jsx'
import PantallaCentrada from '../components/admin/PantallaCentrada.jsx'
import LoginForm from '../components/admin/LoginForm.jsx'
import AdminPanel from '../components/admin/AdminPanel.jsx'

export default function Admin() {
  const { session, perfil, cargando, signOut } = useAuth()

  if (cargando) {
    return (
      <PantallaCentrada>
        <p className="vooj-eyebrow text-vooj-ink/50">Cargando…</p>
      </PantallaCentrada>
    )
  }

  if (!session) return <LoginForm />

  // Con sesión pero sin fila en `perfiles`: no tiene acceso al panel.
  if (!perfil) {
    return (
      <PantallaCentrada>
        <p className="text-sm text-vooj-ink/75 text-center leading-relaxed">
          Tu cuenta no tiene un perfil asignado en VOOJ.
        </p>
        <p className="mt-3 text-center text-[0.7rem] text-vooj-ink/45 tracking-wide2 leading-relaxed">
          Pídele a la administradora que te dé acceso.
        </p>
        <button onClick={signOut} className="vooj-btn mt-8">
          Cerrar sesión
        </button>
      </PantallaCentrada>
    )
  }

  return <AdminPanel />
}
