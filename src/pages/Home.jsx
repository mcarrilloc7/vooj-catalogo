import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-vooj-black text-vooj-bone flex flex-col items-center justify-center px-6">
      <h1 className="vooj-wordmark text-6xl sm:text-8xl md:text-9xl">VOOJ</h1>

      <div className="mt-6 h-px w-40 bg-vooj-bone/30" />

      <p className="mt-6 vooj-eyebrow text-sm tracking-wordmark">
        Boutique de moda
      </p>

      <nav className="mt-16 flex gap-8">
        <Link to="/catalogo" className="vooj-eyebrow hover:text-vooj-bone transition-colors">
          Catálogo
        </Link>
        <Link to="/nosotros" className="vooj-eyebrow hover:text-vooj-bone transition-colors">
          Nosotros
        </Link>
        <Link to="/contacto" className="vooj-eyebrow hover:text-vooj-bone transition-colors">
          Contacto
        </Link>
      </nav>
    </div>
  )
}
