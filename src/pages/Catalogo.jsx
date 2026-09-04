import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { primeraFoto } from '../lib/format.js'
import ProductoCard from '../components/ProductoCard.jsx'
import FiltrosCatalogo from '../components/FiltrosCatalogo.jsx'

const GRID = 'grid grid-cols-2 md:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-14'

// Peso visual por recencia (sin tocar la BD):
//  - Las 3 piezas más recientes forman una fila destacada: 1 grande + 2
//    apaisadas apiladas.
//  - A partir de ahí, grid normal; cada ~7 una banda a todo el ancho
//    marca el ritmo.
function Rejilla({ productos }) {
  const conDestacado = productos.length >= 3
  const destacado = conDestacado ? productos.slice(0, 3) : []
  const resto = conDestacado ? productos.slice(3) : productos
  const base = conDestacado ? 3 : 0

  return (
    <div>
      {conDestacado && (
        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="animate-fade-up">
            <ProductoCard producto={destacado[0]} variante="hero" />
          </div>
          <div className="flex flex-col justify-between gap-6">
            {destacado.slice(1).map((p, k) => (
              <div
                key={p.id}
                className="animate-fade-up"
                style={{ animationDelay: `${(k + 1) * 45}ms` }}
              >
                <ProductoCard producto={p} variante="ancho" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={GRID}>
        {resto.map((p, k) => {
          const i = base + k
          const banda = i > 0 && i % 7 === 0
          return (
            <div
              key={p.id}
              className={`animate-fade-up ${banda ? 'col-span-2 md:col-span-4' : ''}`}
              style={{ animationDelay: `${Math.min(k * 25, 250)}ms` }}
            >
              <ProductoCard producto={p} variante={banda ? 'ancho' : 'normal'} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CatalogoSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="animate-pulse">
          <div className="aspect-[4/5] bg-vooj-ink/[0.07]" />
          <div className="mt-4 h-3 w-1/2 bg-vooj-ink/[0.07]" />
        </div>
        <div className="flex flex-col justify-between gap-6">
          {[0, 1].map((k) => (
            <div key={k} className="animate-pulse">
              <div className="aspect-[3/2] bg-vooj-ink/[0.07]" />
              <div className="mt-4 h-3 w-1/2 bg-vooj-ink/[0.07]" />
            </div>
          ))}
        </div>
      </div>
      <div className={GRID}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-vooj-ink/[0.07]" />
            <div className="mt-4 h-3 w-2/3 bg-vooj-ink/[0.07]" />
            <div className="mt-2 h-3 w-1/3 bg-vooj-ink/[0.07]" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Estados sobre bloque negro: mismo peso visual que la home.
function EstadoMensaje({ titulo, detalle }) {
  return (
    <div className="bg-vooj-black px-6 py-20 text-center text-vooj-bone">
      <p className="vooj-wordmark text-lg text-vooj-bone">{titulo}</p>
      <p className="mt-4 text-sm font-light text-vooj-bone/55">{detalle}</p>
    </div>
  )
}

function EstadoError({ onReintentar }) {
  return (
    <div className="bg-vooj-black px-6 py-20 text-center text-vooj-bone">
      <p className="vooj-wordmark text-lg text-vooj-bone">
        No pudimos cargar el catálogo
      </p>
      <p className="mt-4 text-sm font-light text-vooj-bone/55">
        Revisa tu conexión e inténtalo de nuevo en un momento.
      </p>
      <button
        onClick={onReintentar}
        className="mt-6 text-xs font-light text-vooj-bone/70 underline-offset-4 transition-colors hover:text-vooj-bone hover:underline"
      >
        Reintentar
      </button>
    </div>
  )
}

const unicos = (lista) => [...new Set(lista.filter(Boolean))].sort()

export default function Catalogo() {
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'ok' | 'error'
  const [productos, setProductos] = useState([])
  const [params] = useSearchParams()
  const filtrosRef = useRef(null)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      setEstado('cargando')

      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, descripcion, precio, categoria, talla, fotos')
        .eq('disponible', true)
        .order('actualizado_en', { ascending: false })

      if (cancelado) return

      if (error) {
        console.error('[catalogo] error al cargar productos:', error)
        setEstado('error')
        return
      }

      setProductos(data ?? [])
      setEstado('ok')
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  const categorias = useMemo(
    () => unicos(productos.map((p) => p.categoria)),
    [productos],
  )
  // Cada categoría con la 1ª foto disponible de alguno de sus productos (o null).
  const categoriasConThumb = useMemo(
    () =>
      categorias.map((c) => {
        const conFoto = productos.find(
          (p) => p.categoria === c && primeraFoto(p.fotos),
        )
        return { categoria: c, thumb: conFoto ? primeraFoto(conFoto.fotos) : null }
      }),
    [categorias, productos],
  )
  const tallas = useMemo(() => unicos(productos.map((p) => p.talla)), [productos])
  const precios = useMemo(
    () => productos.map((p) => Number(p.precio)).filter(Number.isFinite),
    [productos],
  )
  const precioMin = precios.length ? Math.floor(Math.min(...precios)) : null
  const precioMax = precios.length ? Math.ceil(Math.max(...precios)) : null

  // Filtros activos (leídos de la URL)
  const fQ = (params.get('q') || '').trim().toLowerCase()
  const fCategoria = params.get('categoria') || ''
  const fTalla = params.get('talla') || ''
  const fMin = params.get('min') || ''
  const fMax = params.get('max') || ''

  const filtrados = useMemo(() => {
    const min = Number(fMin)
    const max = Number(fMax)
    const coincide = (texto) => (texto || '').toLowerCase().includes(fQ)
    return productos.filter((p) => {
      if (fQ && !coincide(p.nombre) && !coincide(p.descripcion)) return false
      if (fCategoria && p.categoria !== fCategoria) return false
      if (fTalla && p.talla !== fTalla) return false
      const precio = Number(p.precio)
      if (fMin !== '' && Number.isFinite(min) && precio < min) return false
      if (fMax !== '' && Number.isFinite(max) && precio > max) return false
      return true
    })
  }, [productos, fQ, fCategoria, fTalla, fMin, fMax])

  const claveGrid = `${fQ}|${fCategoria}|${fTalla}|${fMin}|${fMax}`

  // Al cambiar los filtros, si la barra quedó por encima del viewport,
  // volvemos a ella con scroll suave (nada de saltos bruscos).
  useEffect(() => {
    const el = filtrosRef.current
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [claveGrid])

  return (
    // -mt-8 recorta el py-16 del <main> sólo en esta vista: el bloque de
    // título queda cerca del header en vez de flotando.
    <div className="-mt-8">
      {/* Título como bloque negro acotado — sello de sección, no franja. */}
      <div className="w-fit bg-vooj-black px-6 py-4">
        <h1 className="vooj-wordmark -mr-[0.35em] text-2xl text-vooj-bone sm:text-3xl">
          Catálogo
        </h1>
      </div>

      {/* El contador va pegado al título: título + dato = una unidad. */}
      {estado === 'ok' && productos.length > 0 && (
        <p className="vooj-meta mt-3">
          {filtrados.length} {filtrados.length === 1 ? 'pieza' : 'piezas'}
        </p>
      )}

      <div className="mt-6">
        {estado === 'cargando' && <CatalogoSkeleton />}

        {estado === 'error' && (
          <EstadoError onReintentar={() => window.location.reload()} />
        )}

        {estado === 'ok' && productos.length === 0 && (
          <EstadoMensaje
            titulo="Colección en preparación"
            detalle="Muy pronto vas a poder ver aquí nuestras piezas."
          />
        )}

        {estado === 'ok' && productos.length > 0 && (
          <>
            <div ref={filtrosRef} className="scroll-mt-20">
              <FiltrosCatalogo
                categorias={categoriasConThumb}
                tallas={tallas}
                precioMin={precioMin}
                precioMax={precioMax}
              />
            </div>

            {filtrados.length === 0 ? (
              <EstadoMensaje
                titulo="Sin resultados"
                detalle="Prueba con otra combinación de filtros."
              />
            ) : (
              <Rejilla key={claveGrid} productos={filtrados} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
