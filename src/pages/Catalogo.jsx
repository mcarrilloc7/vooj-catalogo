import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import PageHeading from '../components/PageHeading.jsx'
import ProductoCard from '../components/ProductoCard.jsx'

const GRID = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10'

function CatalogoSkeleton() {
  return (
    <div className={GRID} aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-vooj-bone/[0.06]" />
          <div className="mt-3 h-3 w-2/3 bg-vooj-bone/[0.06]" />
          <div className="mt-2 h-3 w-1/3 bg-vooj-bone/[0.06]" />
        </div>
      ))}
    </div>
  )
}

function EstadoVacio() {
  return (
    <div className="py-24 text-center">
      <p className="vooj-wordmark text-lg text-vooj-bone/70">
        Colección en preparación
      </p>
      <p className="mt-4 vooj-eyebrow text-vooj-bone/40">
        Muy pronto vas a poder ver aquí nuestras piezas.
      </p>
    </div>
  )
}

function EstadoError({ onReintentar }) {
  return (
    <div className="py-24 text-center">
      <p className="vooj-wordmark text-lg text-vooj-bone/70">
        No pudimos cargar el catálogo
      </p>
      <p className="mt-4 vooj-eyebrow text-vooj-bone/40">
        Revisa tu conexión e inténtalo de nuevo en un momento.
      </p>
      <button
        onClick={onReintentar}
        className="mt-8 border border-vooj-bone/40 px-6 py-3 vooj-eyebrow text-vooj-bone/80 transition-colors hover:bg-vooj-bone hover:text-vooj-black"
      >
        Reintentar
      </button>
    </div>
  )
}

export default function Catalogo() {
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'ok' | 'error'
  const [productos, setProductos] = useState([])

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      setEstado('cargando')

      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, talla, fotos')
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

  return (
    <div>
      <PageHeading eyebrow="Vista pública" title="Catálogo" />

      <div className="mt-12">
        {estado === 'cargando' && <CatalogoSkeleton />}

        {estado === 'error' && (
          <EstadoError onReintentar={() => window.location.reload()} />
        )}

        {estado === 'ok' && productos.length === 0 && <EstadoVacio />}

        {estado === 'ok' && productos.length > 0 && (
          <div className={GRID}>
            {productos.map((p) => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
