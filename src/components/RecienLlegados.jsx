import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { esReciente } from '../lib/format.js'
import ProductoCard from './ProductoCard.jsx'

const LIMITE = 8

/**
 * "Recién llegados": los productos más recientes (mismo criterio que
 * /catalogo — disponible + existencias > 0, orden por actualizado_en
 * desc). Al tocar uno, va a su ficha en /catalogo/:sku.
 */
export default function RecienLlegados() {
  const [productos, setProductos] = useState([])

  useEffect(() => {
    let cancelado = false

    supabase
      .from('productos')
      .select('id, sku, nombre, precio, fotos, actualizado_en')
      .eq('disponible', true)
      .gt('existencias', 0)
      .order('actualizado_en', { ascending: false })
      .limit(LIMITE)
      .then(({ data, error }) => {
        if (cancelado || error || !data) return
        setProductos(data)
      })

    return () => {
      cancelado = true
    }
  }, [])

  if (productos.length === 0) return null

  return (
    <div>
      <p className="vooj-eyebrow text-center text-vooj-ink/55">
        Recién llegados
      </p>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {productos.map((producto) => (
          <Link key={producto.id} to={`/catalogo/${encodeURIComponent(producto.sku)}`}>
            <ProductoCard
              producto={producto}
              mostrarSku={false}
              etiqueta={esReciente(producto.actualizado_en) ? 'Nuevo' : null}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
