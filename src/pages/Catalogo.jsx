import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { esReciente, primeraFoto } from '../lib/format.js'
import ProductoCard from '../components/ProductoCard.jsx'
import FiltrosCatalogo from '../components/FiltrosCatalogo.jsx'
import CategoriaFila from '../components/CategoriaFila.jsx'

const POR_PAGINA = 16

const ORDENES = [
  { valor: 'recomendados', etiqueta: 'Recomendados' },
  { valor: 'nuevos', etiqueta: 'Más nuevos' },
  { valor: 'precio_asc', etiqueta: 'Precio: menor a mayor' },
  { valor: 'precio_desc', etiqueta: 'Precio: mayor a menor' },
]

// Columnas fijas por breakpoint: 2 en móvil (ancho completo, sin sidebar),
// 3 en tablet (todavía ancho completo — el sidebar recién aparece en lg),
// 4 en desktop (lg+, ya con el sidebar de 240px restando espacio).
// Grid uniforme: todas las tarjetas del mismo tamaño, sin excepciones por
// posición, página u orden (antes había un héroe + banda ancha sólo en
// página 1 con orden por recencia; se quitó para que el layout no dependa
// de esas condiciones).
const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-14'

// Toda tarjeta del catálogo enlaza a la ficha de producto (/catalogo/:sku)
// — "Ver prenda" en la tarjeta apunta acá.
function TarjetaEnlazada({ producto }) {
  return (
    <Link to={`/catalogo/${encodeURIComponent(producto.sku)}`}>
      <ProductoCard
        producto={producto}
        etiqueta={esReciente(producto.actualizado_en) ? 'Nuevo' : null}
      />
    </Link>
  )
}

function Rejilla({ productos }) {
  return (
    <div className={GRID}>
      {productos.map((p, k) => (
        <div
          key={p.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(k * 25, 250)}ms` }}
        >
          <TarjetaEnlazada producto={p} />
        </div>
      ))}
    </div>
  )
}

function CatalogoSkeleton() {
  return (
    <div aria-hidden="true" className={GRID}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-vooj-ink/[0.07]" />
          <div className="mt-4 h-3 w-2/3 bg-vooj-ink/[0.07]" />
          <div className="mt-2 h-3 w-1/3 bg-vooj-ink/[0.07]" />
        </div>
      ))}
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

// Números de página a mostrar: siempre 1 y la última, más una ventana
// alrededor de la actual; el resto colapsa en "…". Con pocas páginas
// (el caso de hoy) esto no recorta nada — está pensado para cuando el
// catálogo real crezca y haya, por ejemplo, 20 páginas.
function rangoPaginas(actual, total) {
  const rango = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - actual) <= 1) {
      rango.push(i)
    } else if (rango[rango.length - 1] !== '…') {
      rango.push('…')
    }
  }
  return rango
}

function Paginacion({ pagina, total, onCambiar }) {
  if (total <= 1) return null

  return (
    <nav aria-label="Paginación" className="mt-16 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina === 1}
        aria-label="Página anterior"
        className="px-2 py-1 text-vooj-ink/60 transition-colors hover:text-vooj-ink disabled:opacity-25 disabled:hover:text-vooj-ink/60"
      >
        ‹
      </button>

      {rangoPaginas(pagina, total).map((n, i) =>
        n === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-vooj-ink/35">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onCambiar(n)}
            aria-current={n === pagina ? 'page' : undefined}
            className={`h-8 w-8 text-sm font-light transition-colors ${
              n === pagina
                ? 'text-vooj-ink underline decoration-2 underline-offset-4'
                : 'text-vooj-ink/45 hover:text-vooj-ink'
            }`}
          >
            {n}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina === total}
        aria-label="Página siguiente"
        className="px-2 py-1 text-vooj-ink/60 transition-colors hover:text-vooj-ink disabled:opacity-25 disabled:hover:text-vooj-ink/60"
      >
        ›
      </button>
    </nav>
  )
}

const unicos = (lista) => [...new Set(lista.filter(Boolean))].sort()

export default function Catalogo() {
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'ok' | 'error'
  const [productos, setProductos] = useState([])
  const [params, setParams] = useSearchParams()
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const gridRef = useRef(null)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      setEstado('cargando')

      const { data, error } = await supabase
        .from('productos')
        .select(
          'id, sku, nombre, descripcion, precio, precio_oferta, categoria, talla, color, coleccion, fotos, actualizado_en',
        )
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
  const colores = useMemo(() => unicos(productos.map((p) => p.color)), [productos])
  const colecciones = useMemo(
    () => unicos(productos.map((p) => p.coleccion)),
    [productos],
  )
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
  const fColor = params.get('color') || ''
  const fColeccion = params.get('coleccion') || ''
  const fMin = params.get('min') || ''
  const fMax = params.get('max') || ''
  const fOrden = params.get('orden') || 'recomendados'
  const fPagina = Math.max(1, parseInt(params.get('pagina') || '1', 10) || 1)

  const filtrados = useMemo(() => {
    const min = Number(fMin)
    const max = Number(fMax)
    const coincide = (texto) => (texto || '').toLowerCase().includes(fQ)
    return productos.filter((p) => {
      if (fQ && !coincide(p.nombre) && !coincide(p.descripcion)) return false
      if (fCategoria && p.categoria !== fCategoria) return false
      if (fTalla && p.talla !== fTalla) return false
      if (fColor && p.color !== fColor) return false
      if (fColeccion && p.coleccion !== fColeccion) return false
      const precio = Number(p.precio)
      if (fMin !== '' && Number.isFinite(min) && precio < min) return false
      if (fMax !== '' && Number.isFinite(max) && precio > max) return false
      return true
    })
  }, [productos, fQ, fCategoria, fTalla, fColor, fColeccion, fMin, fMax])

  // Recomendados === orden de llegada (ya viene actualizado_en desc de la
  // consulta) — "más nuevos" lo reafirma explícito en vez de asumirlo.
  const ordenados = useMemo(() => {
    const lista = [...filtrados]
    switch (fOrden) {
      case 'nuevos':
        return lista.sort(
          (a, b) => new Date(b.actualizado_en) - new Date(a.actualizado_en),
        )
      case 'precio_asc':
        return lista.sort((a, b) => Number(a.precio) - Number(b.precio))
      case 'precio_desc':
        return lista.sort((a, b) => Number(b.precio) - Number(a.precio))
      default:
        return lista
    }
  }, [filtrados, fOrden])

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / POR_PAGINA))
  const paginaSegura = Math.min(fPagina, totalPaginas)
  const productosPagina = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA
    return ordenados.slice(inicio, inicio + POR_PAGINA)
  }, [ordenados, paginaSegura])

  function irAPagina(n) {
    const next = new URLSearchParams(params)
    if (n <= 1) next.delete('pagina')
    else next.set('pagina', String(n))
    setParams(next, { replace: true })
  }

  function actualizarOrden(valor) {
    const next = new URLSearchParams(params)
    if (valor === 'recomendados') next.delete('orden')
    else next.set('orden', valor)
    next.delete('pagina')
    setParams(next, { replace: true })
  }

  const claveGrid = `${fQ}|${fCategoria}|${fTalla}|${fColor}|${fColeccion}|${fMin}|${fMax}`
  const filtrosActivos = [fQ, fCategoria, fTalla, fColor, fColeccion, fMin, fMax].filter(
    Boolean,
  ).length

  // Si cambia algún filtro (no el orden, ya se maneja en actualizarOrden)
  // volvemos a la página 1 — la página 2 del recorte viejo puede no tener
  // sentido con el resultado nuevo. Se salta el primer render para
  // respetar un link directo a ?pagina=3.
  const primerRenderRef = useRef(true)
  useEffect(() => {
    if (primerRenderRef.current) {
      primerRenderRef.current = false
      return
    }
    if (params.get('pagina')) {
      const next = new URLSearchParams(params)
      next.delete('pagina')
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveGrid])

  // Scroll al inicio del grid al cambiar de página (no en el primer
  // render, para no saltar la vista en un link directo a ?pagina=3).
  const primeraPaginaRef = useRef(true)
  useEffect(() => {
    if (primeraPaginaRef.current) {
      primeraPaginaRef.current = false
      return
    }
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [paginaSegura])

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
          breadcrumb de arriba y el sidebar de filtros llevan más peso. El
          contador de piezas se movió a la barra de resultados, junto al
          orden, justo arriba del grid — no hace falta repetirlo acá. */}
      <header>
        <h1 className="vooj-wordmark text-xl text-vooj-ink sm:text-2xl">Catálogo</h1>
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
              <FiltrosCatalogo
                tallas={tallas}
                colores={colores}
                colecciones={colecciones}
                precioMin={precioMin}
                precioMax={precioMax}
                onCerrar={() => setFiltrosAbiertos(false)}
              />
            </aside>
          </>
        )}

        <div ref={gridRef} className="scroll-mt-24">
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
              {/* Barra de resultados: contador + orden, arriba del grid. */}
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <p className="vooj-meta">
                  {ordenados.length} {ordenados.length === 1 ? 'pieza' : 'piezas'}
                </p>
                <label className="flex items-center gap-2">
                  <span className="vooj-meta">ordenar por</span>
                  <select
                    value={fOrden}
                    onChange={(e) => actualizarOrden(e.target.value)}
                    className="border-0 border-b border-vooj-ink/25 bg-transparent py-1 text-sm text-vooj-ink focus:outline-none focus:border-vooj-ink/60"
                  >
                    {ORDENES.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {ordenados.length === 0 ? (
                <EstadoMensaje
                  titulo="Sin resultados"
                  detalle="Prueba con otra combinación de filtros."
                />
              ) : (
                <>
                  <Rejilla
                    key={`${claveGrid}|${fOrden}|${paginaSegura}`}
                    productos={productosPagina}
                  />
                  <Paginacion
                    pagina={paginaSegura}
                    total={totalPaginas}
                    onCambiar={irAPagina}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
