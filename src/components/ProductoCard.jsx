import { useState } from 'react'
import { formatPrecioMXN, primeraFoto } from '../lib/format.js'

function FotoPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-vooj-bone/[0.04]">
      <span className="vooj-wordmark text-vooj-bone/20 text-2xl select-none">
        VOOJ
      </span>
    </div>
  )
}

export default function ProductoCard({ producto }) {
  const src = primeraFoto(producto.fotos)
  const [imgFallo, setImgFallo] = useState(false)
  const mostrarFoto = src && !imgFallo

  return (
    <article className="group">
      <div className="relative aspect-[3/4] overflow-hidden border border-vooj-bone/10 bg-vooj-black">
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
        <h3 className="text-sm text-vooj-bone/90 truncate">{producto.nombre}</h3>
        {producto.talla && (
          <span className="vooj-eyebrow shrink-0 text-[0.65rem] text-vooj-bone/40">
            {producto.talla}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-vooj-bone/60">
        {formatPrecioMXN(producto.precio)}
      </p>
    </article>
  )
}
