import { useState } from 'react'
import { formatPrecioMXN, primeraFoto } from '../lib/format.js'
import VoojBadge from './VoojBadge.jsx'

// El recorte de la foto cambia según el papel de la pieza en el grid.
//   normal -> retrato   ·   ancho -> apaisado   ·   hero -> llena su celda
const RATIO = {
  normal: 'aspect-[3/4]',
  ancho: 'aspect-[3/2]',
}

// Sin foto: bloque negro sólido con el monograma VOOJ centrado — carta
// editorial deliberada, no un "falta la imagen". Igual en héroe, banda y
// tarjeta normal (combina con los círculos de categoría, que usan el mismo).
function FotoPlaceholder() {
  return (
    <VoojBadge variant="mark" alt="" className="absolute inset-0 h-full w-full" />
  )
}

export default function ProductoCard({ producto, variante = 'normal' }) {
  const src = primeraFoto(producto.fotos)
  const [imgFallo, setImgFallo] = useState(false)
  const mostrarFoto = src && !imgFallo

  const esHero = variante === 'hero'
  const marco = esHero
    ? 'aspect-[4/5] md:aspect-auto md:flex-1 md:min-h-0'
    : RATIO[variante] ?? RATIO.normal

  return (
    <article className={`group flex flex-col ${esHero ? 'md:h-full' : ''}`}>
      {/* La foto va a sangre sobre el fondo — sin marco. */}
      <div className={`relative overflow-hidden bg-vooj-black ${marco}`}>
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

      {/* Nombre lleva el peso; el precio se retira. */}
      <div className="mt-4 shrink-0">
        <h3 className="text-[0.9375rem] font-normal leading-snug text-vooj-ink">
          {producto.nombre}
        </h3>
        <p className="mt-1.5 text-[0.8125rem] font-light tabular-nums text-vooj-ink/50">
          {formatPrecioMXN(producto.precio)}
        </p>
      </div>
    </article>
  )
}
