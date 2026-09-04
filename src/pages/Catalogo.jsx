import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { primeraFoto } from '../lib/format.js'
import PageHeading from '../components/PageHeading.jsx'
import ProductoCard from '../components/ProductoCard.jsx'
import FiltrosCatalogo from '../components/FiltrosCatalogo.jsx'

const GRID = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10'

function CatalogoSkeleton() {
  return (
    <div className={GRID} aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-vooj-ink/[0.08]" />
          <div className="mt-3 h-3 w-2/3 bg-vooj-ink/[0.08]" />
          <div className="mt-2 h-3 w-1/3 bg-vooj-ink/[0.08]" />
        </div>
      ))}
    </div>
  )
}

function EstadoMensaje({ titulo, detalle }) {
  return (
    <div className="py-24 text-center">
      <p className="vooj-wordmark text-lg text-vooj-ink/80">{titulo}</p>
      <p className="mt-4 vooj-eyebrow text-vooj-ink/55">{detalle}</p>
    </div>
  )
}

function EstadoError({ onReintentar }) {
  return (
    <div className="py-24 text-center">
      <p className="vooj-wordmark text-lg text-vooj-ink/80">
        No pudimos cargar el catálogo
      </p>
      <p className="mt-4 vooj-eyebrow text-vooj-ink/55">
        Revisa tu conexión e inténtalo de nuevo en un momento.
      </p>
      <button onClick={onReintentar} className="mt-8 vooj-btn">
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
    <div>
      <PageHeading eyebrow="Vista pública" title="Catálogo" />

      <div className="mt-12">
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
            <div ref={filtrosRef} className="scroll-mt-6">
              <FiltrosCatalogo
                categorias={categoriasConThumb}
                tallas={tallas}
                precioMin={precioMin}
                precioMax={precioMax}
                total={filtrados.length}
              />
            </div>

            {filtrados.length === 0 ? (
              <EstadoMensaje
                titulo="Sin resultados"
                detalle="Prueba con otra combinación de filtros."
              />
            ) : (
              <div key={claveGrid} className={`${GRID} animate-fade-up`}>
                {filtrados.map((p, i) => (
                  <div
                    key={p.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i * 25, 250)}ms` }}
                  >
                    <ProductoCard producto={p} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
