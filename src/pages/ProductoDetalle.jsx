import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { colorAHex, fotoPublicUrl, formatPrecioMXN } from '../lib/format.js'

// Mismo contacto que ya usa el PDF del catálogo (pdfCatalogo.js) — "55 4840
// 1782" es el número de CDMX; wa.me necesita el código de país (52) antes.
const WHATSAPP_NUMERO = '525548401782'

function mensajeWhatsapp(producto) {
  return `Hola, me interesa la pieza ${producto.sku} - ${producto.nombre}`
}

function enlaceWhatsapp(producto) {
  const texto = encodeURIComponent(mensajeWhatsapp(producto))
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${texto}`
}

// Mismo bloque negro "elegante" que /catalogo usa para "sin resultados" —
// nunca un error crudo, con vuelta al catálogo siempre a mano.
function EstadoMensaje({ titulo, detalle }) {
  return (
    <div className="bg-vooj-black px-6 py-20 text-center text-vooj-bone">
      <p className="vooj-wordmark text-lg text-vooj-bone">{titulo}</p>
      <p className="mt-4 text-sm font-light text-vooj-bone/55">{detalle}</p>
      <Link
        to="/catalogo"
        className="mt-6 inline-block text-xs font-light text-vooj-bone/70 underline-offset-4 transition-colors hover:text-vooj-bone hover:underline"
      >
        Volver al catálogo
      </Link>
    </div>
  )
}

function DetalleSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-10 lg:grid-cols-2">
      <div className="animate-pulse">
        <div className="aspect-[3/4] bg-vooj-ink/[0.07]" />
        <div className="mt-4 flex gap-3">
          {[0, 1, 2].map((k) => (
            <div key={k} className="h-16 w-16 bg-vooj-ink/[0.07]" />
          ))}
        </div>
      </div>
      <div className="animate-pulse space-y-4 pt-2">
        <div className="h-6 w-2/3 bg-vooj-ink/[0.07]" />
        <div className="h-4 w-1/3 bg-vooj-ink/[0.07]" />
        <div className="h-3 w-1/2 bg-vooj-ink/[0.07]" />
        <div className="h-24 w-full bg-vooj-ink/[0.07]" />
      </div>
    </div>
  )
}

/**
 * /catalogo/:sku — ficha de producto. El SKU (no el uuid) va en la URL:
 * ya es único y legible ("VOOJ-014"). Sin carrito ni perfil — "Pedir por
 * WhatsApp" es la única acción de compra, con el mismo número que ya usa
 * el PDF del admin.
 */
export default function ProductoDetalle() {
  const { sku } = useParams()
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'ok' | 'no-encontrado'
  const [producto, setProducto] = useState(null)
  const [fotoActiva, setFotoActiva] = useState(0)

  useEffect(() => {
    let cancelado = false
    setEstado('cargando')
    setFotoActiva(0)

    supabase
      .from('productos')
      .select(
        'id, sku, nombre, descripcion, precio, precio_oferta, categoria, talla, existencias, material, color, fotos',
      )
      .eq('sku', sku)
      .eq('disponible', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error || !data) {
          setEstado('no-encontrado')
          return
        }
        setProducto(data)
        setEstado('ok')
      })

    return () => {
      cancelado = true
    }
  }, [sku])

  if (estado === 'no-encontrado') {
    return (
      <EstadoMensaje
        titulo="Pieza no disponible"
        detalle="Puede que ya se haya agotado o que el enlace ya no exista."
      />
    )
  }

  const fotos = estado === 'ok' ? producto.fotos.map(fotoPublicUrl).filter(Boolean) : []
  const fotoUrl = fotos[fotoActiva] ?? null

  // Sólo lo que el producto de verdad tiene — sin filas vacías.
  const detalles =
    estado === 'ok'
      ? [
          producto.talla && { etiqueta: 'Talla', valor: producto.talla },
          producto.color && { etiqueta: 'Color', valor: producto.color },
          producto.material && { etiqueta: 'Material', valor: producto.material },
          Number.isFinite(Number(producto.existencias)) && {
            etiqueta: 'Existencias',
            valor: String(producto.existencias),
          },
          producto.sku && { etiqueta: 'SKU', valor: producto.sku },
        ].filter(Boolean)
      : []

  return (
    <div>
      <nav
        aria-label="Ruta de navegación"
        className="mb-6 text-xs font-light text-vooj-ink/45"
      >
        <Link to="/" className="transition-colors hover:text-vooj-ink">
          Inicio
        </Link>
        <span className="mx-1.5">/</span>
        <Link to="/catalogo" className="transition-colors hover:text-vooj-ink">
          Catálogo
        </Link>
        {estado === 'ok' && (
          <>
            <span className="mx-1.5">/</span>
            <span className="text-vooj-ink/65">{producto.nombre}</span>
          </>
        )}
      </nav>

      {estado === 'cargando' && <DetalleSkeleton />}

      {estado === 'ok' && (
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Galería */}
          <div>
            <div className="aspect-[3/4] overflow-hidden bg-vooj-black">
              {fotoUrl ? (
                <img
                  key={fotoUrl}
                  src={fotoUrl}
                  alt={producto.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="vooj-wordmark text-vooj-bone/60">VOOJ</span>
                </div>
              )}
            </div>

            {fotos.length > 1 && (
              <div className="mt-4 flex gap-3">
                {fotos.map((f, i) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFotoActiva(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-current={i === fotoActiva}
                    className={`h-16 w-16 shrink-0 overflow-hidden bg-vooj-black transition-opacity ${
                      i === fotoActiva ? '' : 'opacity-40 hover:opacity-70'
                    }`}
                  >
                    <img src={f} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pt-1">
            <h1 className="vooj-wordmark text-2xl text-vooj-ink sm:text-3xl">
              {producto.nombre}
            </h1>

            {producto.precio_oferta != null ? (
              <p className="mt-3 flex items-baseline gap-3">
                <span className="text-sm font-light text-vooj-ink/40 line-through">
                  {formatPrecioMXN(producto.precio)}
                </span>
                <span className="text-xl font-light tabular-nums text-vooj-ink">
                  {formatPrecioMXN(producto.precio_oferta)}
                </span>
              </p>
            ) : (
              <p className="mt-3 text-xl font-light tabular-nums text-vooj-ink">
                {formatPrecioMXN(producto.precio)}
              </p>
            )}

            {detalles.length > 0 && (
              <dl className="mt-8 space-y-2.5 border-t border-vooj-ink/10 pt-6">
                {detalles.map(({ etiqueta, valor }) => (
                  <div key={etiqueta} className="flex items-baseline gap-3 text-sm">
                    <dt className="w-24 shrink-0 vooj-meta">{etiqueta}</dt>
                    <dd className="flex items-center gap-2 font-light text-vooj-ink/80">
                      {etiqueta === 'Color' && (
                        <span
                          aria-hidden="true"
                          className="inline-block h-2.5 w-2.5 rounded-full border border-vooj-ink/15"
                          style={{
                            backgroundColor: colorAHex(valor) ?? 'transparent',
                          }}
                        />
                      )}
                      {etiqueta === 'SKU' ? (
                        <span className="font-mono">{valor}</span>
                      ) : (
                        valor
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {producto.descripcion && (
              <p className="mt-6 max-w-prose text-sm font-light leading-relaxed text-vooj-ink/70">
                {producto.descripcion}
              </p>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <a
                href={enlaceWhatsapp(producto)}
                target="_blank"
                rel="noopener noreferrer"
                className="vooj-btn"
              >
                Pedir por WhatsApp
              </a>
              <Link to="/catalogo" className="vooj-link">
                Volver al catálogo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
