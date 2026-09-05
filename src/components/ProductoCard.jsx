import { useState } from 'react'
import { colorAHex, formatPrecioMXN, primeraFoto } from '../lib/format.js'
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

export default function ProductoCard({
  producto,
  variante = 'normal',
  etiqueta = null,
  mostrarSku = true,
}) {
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
            className="h-full w-full object-cover transition-transform duration-500 [@media(hover:hover)]:group-hover:scale-[1.03]"
          />
        ) : (
          <FotoPlaceholder />
        )}
        {etiqueta && (
          <span className="absolute left-3 top-3 bg-vooj-bone px-2 py-1 text-[0.625rem] font-light uppercase tracking-wide2 text-vooj-ink">
            {etiqueta}
          </span>
        )}
      </div>

      {/* Nombre lleva el peso; el precio se retira. */}
      <div className="mt-4 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[0.9375rem] font-normal leading-snug text-vooj-ink">
            {producto.nombre}
          </h3>
          {/* Puntito de color — sólo visual, no interactivo. */}
          {producto.color && (
            <span
              role="img"
              aria-label={`Color: ${producto.color}`}
              title={producto.color}
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-vooj-ink/15"
              style={{ backgroundColor: colorAHex(producto.color) ?? 'transparent' }}
            />
          )}
        </div>

        {producto.precio_oferta != null ? (
          <p className="mt-1.5 flex items-center gap-2 text-[0.8125rem] font-light tabular-nums">
            <span className="text-vooj-ink/40 line-through">
              {formatPrecioMXN(producto.precio)}
            </span>
            <span className="text-vooj-ink">
              {formatPrecioMXN(producto.precio_oferta)}
            </span>
          </p>
        ) : (
          <p className="mt-1.5 text-[0.8125rem] font-light tabular-nums text-vooj-ink/50">
            {formatPrecioMXN(producto.precio)}
          </p>
        )}

        {/* Código para pedir por WhatsApp — dato meta, no protagonista. */}
        {mostrarSku && producto.sku && (
          <p className="vooj-meta mt-1 font-mono">{producto.sku}</p>
        )}

        {/* Única interacción de la tarjeta: texto discreto, no un botón.
            El link en sí lo pone quien use ProductoCard (ver Rejilla en
            Catalogo.jsx); acá sólo reacciona al hover de toda la tarjeta
            (group-hover), no sólo al pasar por encima de estas palabras.
            El hover queda envuelto en [@media(hover:hover)]: en touch, que
            no tiene hover real, esta regla ni siquiera existe — así el
            navegador no tiene ningún :hover que "probar" antes del click,
            y el primer toque navega directo (ver diagnóstico: sin esto,
            algunos navegadores móviles piden un primer toque "fantasma"
            para simular el hover y recién el segundo hace clic). */}
        <p className="mt-2 text-xs font-light text-vooj-ink/55 underline-offset-4 transition-colors [@media(hover:hover)]:group-hover:text-vooj-ink [@media(hover:hover)]:group-hover:underline">
          Ver prenda
        </p>
      </div>
    </article>
  )
}
