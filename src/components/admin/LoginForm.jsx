import { useState } from 'react'
import { useAuth } from '../../lib/auth.jsx'
import PantallaCentrada from './PantallaCentrada.jsx'

export default function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    const { error: err } = await signIn(email.trim(), password)
    setEnviando(false)
    if (err) {
      // Sin filtrar el detalle técnico al usuario final.
      setError('Correo o contraseña incorrectos.')
    }
    // Si sale bien, el AuthProvider detecta la sesión y cambia la vista.
  }

  return (
    <PantallaCentrada>
      <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
        <div>
          <label className="vooj-label" htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="vooj-input"
          />
        </div>

        <div>
          <label className="vooj-label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="vooj-input"
          />
        </div>

        {error && (
          <p className="text-xs text-red-700 tracking-wide2">{error}</p>
        )}

        <button type="submit" disabled={enviando} className="vooj-btn mt-2">
          {enviando ? 'Entrando…' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-8 text-center text-[0.7rem] text-vooj-ink/45 tracking-wide2 leading-relaxed">
        Acceso solo para el equipo VOOJ. Las cuentas se crean manualmente.
      </p>
    </PantallaCentrada>
  )
}
