import { Link } from 'react-router-dom'

/** Contenedor a pantalla completa, centrado, con la paleta VOOJ. */
export default function PantallaCentrada({ children }) {
  return (
    <div className="min-h-screen bg-vooj-black text-vooj-bone flex flex-col items-center justify-center px-6">
      <Link to="/" className="vooj-wordmark text-2xl">
        VOOJ
      </Link>
      <p className="mt-2 vooj-eyebrow text-vooj-bone/40">Panel privado</p>
      <div className="mt-10 w-full max-w-xs flex flex-col items-center">
        {children}
      </div>
    </div>
  )
}
