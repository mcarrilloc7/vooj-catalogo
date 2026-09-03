import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-vooj-black text-vooj-bone flex flex-col items-center justify-center px-6">
      <p className="vooj-wordmark text-4xl">404</p>
      <Link to="/" className="mt-6 vooj-eyebrow hover:text-vooj-bone transition-colors">
        Volver al inicio
      </Link>
    </div>
  )
}
