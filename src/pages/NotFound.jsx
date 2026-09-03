import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-vooj-bone text-vooj-ink flex flex-col items-center justify-center px-6">
      <p className="vooj-wordmark text-4xl">404</p>
      <Link
        to="/"
        className="mt-6 vooj-eyebrow text-vooj-ink/60 hover:text-vooj-ink transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
