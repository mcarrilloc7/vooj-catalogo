import { Link } from 'react-router-dom'

/** Bloque oscuro de la home que enlaza a /catalogo con un filtro. */
export default function PanelHome({ panel }) {
  return (
    <Link
      to={panel.href}
      className="group relative flex min-h-[92px] flex-1 flex-col justify-center overflow-hidden bg-vooj-black px-5 py-4 text-vooj-bone"
    >
      <p className="vooj-eyebrow text-vooj-bone">{panel.titulo}</p>
      {panel.sub && (
        <p className="mt-1 text-xs font-light text-vooj-bone/45">{panel.sub}</p>
      )}
      <span className="mt-2 inline-block text-vooj-bone/60 transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  )
}
