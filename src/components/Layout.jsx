import { useState } from 'react'
import { NavLink, Link, Outlet } from 'react-router-dom'
import VoojBadge from './VoojBadge.jsx'

const navItems = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

function linkClase({ isActive }) {
  return `vooj-eyebrow transition-colors hover:text-vooj-ink ${
    isActive ? 'text-vooj-ink' : 'text-vooj-ink/60'
  }`
}

export default function Layout() {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="min-h-screen bg-vooj-bone text-vooj-ink flex flex-col">
      <header className="relative border-b border-vooj-ink/15">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" onClick={() => setAbierto(false)} aria-label="VOOJ — inicio">
            <VoojBadge className="h-12 w-12" />
          </Link>

          {/* Navegación en desktop */}
          <nav className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClase}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Botón hamburguesa en móvil */}
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-label="Menú"
            aria-expanded={abierto}
            className="md:hidden flex flex-col gap-[5px] p-2 -mr-2"
          >
            <span
              className={`block h-px w-6 bg-vooj-ink transition-transform duration-200 ${
                abierto ? 'translate-y-[6px] rotate-45' : ''
              }`}
            />
            <span
              className={`block h-px w-6 bg-vooj-ink transition-opacity duration-200 ${
                abierto ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-px w-6 bg-vooj-ink transition-transform duration-200 ${
                abierto ? '-translate-y-[6px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>

        {/* Panel desplegable en móvil */}
        {abierto && (
          <nav className="md:hidden absolute inset-x-0 top-full z-20 flex flex-col gap-4 border-b border-vooj-ink/15 bg-vooj-bone px-6 py-5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setAbierto(false)}
                className={linkClase}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-16">
        <Outlet />
      </main>

      <footer className="border-t border-vooj-ink/15">
        <div className="mx-auto max-w-6xl px-6 py-8 vooj-eyebrow">
          VOOJ · Boutique de moda
        </div>
      </footer>
    </div>
  )
}
