import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Bloque oscuro de la home que enlaza a /catalogo con un filtro. Cuando hay
 * `foto` (1ª foto disponible de un producto de esa categoría), la muestra de
 * fondo con un degradado oscuro encima para que el texto en hueso siga
 * siendo legible.
 */
export default function PanelHome({ panel, foto }) {
  const [imgFallo, setImgFallo] = useState(false)
  const mostrarFoto = foto && !imgFallo

  return (
    <Link
      to={panel.href}
      className="group relative flex min-h-[92px] flex-1 flex-col justify-center overflow-hidden bg-vooj-black px-5 py-4 text-vooj-bone"
    >
      {mostrarFoto && (
        <img
          src={foto}
          alt=""
          loading="lazy"
          onError={() => setImgFallo(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-vooj-black/90 via-vooj-black/70 to-vooj-black/40" />

      <p className="relative vooj-eyebrow text-vooj-bone">{panel.titulo}</p>
      {panel.sub && (
        <p className="relative mt-1 text-xs font-light text-vooj-bone/45">{panel.sub}</p>
      )}
      <span className="relative mt-2 inline-block text-vooj-bone/60 transition-transform group-hover:translate-x-1">
        →
      </span>
    </Link>
  )
}
