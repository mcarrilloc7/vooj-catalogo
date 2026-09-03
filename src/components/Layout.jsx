import { NavLink, Link, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-vooj-black text-vooj-bone flex flex-col">
      <header className="border-b border-vooj-bone/10">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="vooj-wordmark text-lg">
            VOOJ
          </Link>
          <nav className="flex gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `vooj-eyebrow transition-colors hover:text-vooj-bone ${
                    isActive ? 'text-vooj-bone' : ''
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-16">
        <Outlet />
      </main>

      <footer className="border-t border-vooj-bone/10">
        <div className="mx-auto max-w-6xl px-6 py-8 vooj-eyebrow">
          VOOJ · Boutique de moda
        </div>
      </footer>
    </div>
  )
}
