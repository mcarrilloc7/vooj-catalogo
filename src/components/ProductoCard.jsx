import { useState } from 'react'
import { formatPrecioMXN, primeraFoto } from '../lib/format.js'
import VoojBadge from './VoojBadge.jsx'

// Sin foto: el logo VOOJ ocupa la tarjeta (su fondo negro ya hace de mosaico).
// alt="" porque es decorativo: el nombre del producto va justo debajo.
function FotoPlaceholder() {
  return <VoojBadge alt="" className="absolute inset-0 h-full w-full" />
}

export default function ProductoCard({ producto }) {
  const src = primeraFoto(producto.fotos)
  const [imgFallo, setImgFallo] = useState(false)
  const mostrarFoto = src && !imgFallo

  return (
    <article className="group">
      <div className="relative aspect-[3/4] overflow-hidden border border-vooj-ink/15 bg-vooj-black">
        {mostrarFoto ? (
          <img
            src={src}
            alt={producto.nombre}
            loading="lazy"
            onError={() => setImgFallo(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <FotoPlaceholder />
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm text-vooj-ink/90 truncate">{producto.nombre}</h3>
        {producto.talla && (
          <span className="vooj-eyebrow shrink-0 text-[0.65rem] text-vooj-ink/55">
            {producto.talla}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-vooj-ink/65">
        {formatPrecioMXN(producto.precio)}
      </p>
    </article>
  )
}
