import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { primeraFoto } from '../lib/format.js'
import ProductoCard from '../components/ProductoCard.jsx'
import FiltrosCatalogo from '../components/FiltrosCatalogo.jsx'
import CategoriaFila from '../components/CategoriaFila.jsx'

// Auto-fill en vez de columnas fijas por breakpoint: desde que hay sidebar
// (lg+), el grid ya no es todo el ancho de la página, así que un conteo de
// columnas fijo por viewport se apretaría contra el panel. Con minmax cada
// tarjeta busca ~220px y el navegador acomoda cuantas entren en el espacio
// real que quede (con o sin sidebar).
const GRID =
  'grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-3 sm:gap-x-6 gap-y-14'

// Antes eran spans fijos por breakpoint (frágil con auto-fill, que no tiene
// un número de columnas conocido de antemano); col-span-full es correcto
// para cualquier cantidad de columnas.
const BANDA = 'col-span-full'

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
              className={`animate-fade-up ${banda ? BANDA : ''}`}
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
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      setEstado('cargando')

      const { data, error } = await supabase
        .from('productos')
        .select('id, sku, nombre, descripcion, precio, categoria, talla, fotos')
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
  const filtrosActivos = [fQ, fCategoria, fTalla, fMin, fMax].filter(Boolean).length

  const conFiltros = estado === 'ok' && productos.length > 0

  return (
    // -mt-8 recorta el py-16 del <main> sólo en esta vista: el bloque de
    // título queda cerca del header en vez de flotando.
    <div className="-mt-8">
      {/* Breadcrumb discreto — la única referencia a "dónde estoy" ahora
          que el título de abajo pesa menos. Usa el nombre de categoría tal
          como vive en la URL/BD, sin inventar niveles de taxonomía. */}
      <nav aria-label="Ruta de navegación" className="mb-3 text-xs font-light text-vooj-ink/45">
        <Link to="/" className="transition-colors hover:text-vooj-ink">
          Inicio
        </Link>
        <span className="mx-1.5">/</span>
        {fCategoria ? (
          <Link to="/catalogo" className="transition-colors hover:text-vooj-ink">
            Catálogo
          </Link>
        ) : (
          <span className="text-vooj-ink/65">Catálogo</span>
        )}
        {fCategoria && (
          <>
            <span className="mx-1.5">/</span>
            <span className="text-vooj-ink/65">{fCategoria}</span>
          </>
        )}
      </nav>

      {/* Título — ya no es el bloque negro protagonista de antes; el
          breadcrumb de arriba y el sidebar de filtros llevan más peso. */}
      <header className="flex items-baseline gap-3">
        <h1 className="vooj-wordmark text-xl text-vooj-ink sm:text-2xl">Catálogo</h1>
        {conFiltros && (
          <p className="vooj-meta">
            {filtrados.length} {filtrados.length === 1 ? 'pieza' : 'piezas'}
          </p>
        )}
      </header>

      {/* Círculos de categoría — navegación a todo el ancho, arriba tanto
          del sidebar como del grid. No es parte del sidebar de filtros:
          es la forma primaria de moverse entre categorías. */}
      {conFiltros && (
        <div className="mt-8">
          <CategoriaFila categorias={categoriasConThumb} />
        </div>
      )}

      {conFiltros && (
        <div className="mt-8 lg:hidden">
          <button
            type="button"
            onClick={() => setFiltrosAbiertos(true)}
            className="vooj-btn"
          >
            Filtros{filtrosActivos > 0 ? ` · ${filtrosActivos}` : ''}
          </button>
        </div>
      )}

      <div className="mt-8 lg:mt-10 lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-10">
        {conFiltros && (
          <>
            {/* Fondo oscuro detrás del panel, sólo tablet/móvil y sólo
                mientras está abierto. */}
            {filtrosAbiertos && (
              <button
                type="button"
                aria-label="Cerrar filtros"
                onClick={() => setFiltrosAbiertos(false)}
                className="fixed inset-0 z-40 bg-vooj-black/40 lg:hidden"
              />
            )}

            {/* Panel de filtros: drawer fijo en tablet/móvil (se desliza
                desde la izquierda), sidebar sticky de toda la vida en
                desktop/iPad horizontal (lg+). */}
            <aside
              className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-xs overflow-y-auto bg-vooj-bone p-6
                transition-transform duration-300 ease-out
                lg:sticky lg:inset-auto lg:top-24 lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0
                lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:bg-transparent lg:p-0
                ${filtrosAbiertos ? 'translate-x-0' : '-translate-x-full'}`}
            >
              <div className="mb-6 flex items-center justify-between lg:hidden">
                <p className="vooj-eyebrow text-vooj-ink/75">Filtros</p>
                <button
                  type="button"
                  onClick={() => setFiltrosAbiertos(false)}
                  aria-label="Cerrar filtros"
                  className="text-lg leading-none text-vooj-ink/60 hover:text-vooj-ink"
                >
                  ✕
                </button>
              </div>

              <FiltrosCatalogo
                tallas={tallas}
                precioMin={precioMin}
                precioMax={precioMax}
              />
            </aside>
          </>
        )}

        <div>
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

          {conFiltros && (
            <>
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
    </div>
  )
}
