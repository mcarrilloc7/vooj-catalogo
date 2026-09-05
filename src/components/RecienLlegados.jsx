import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import ProductoCard from './ProductoCard.jsx'

const LIMITE = 8
const DIAS_NUEVO = 7

// La tabla sólo guarda `actualizado_en` (se pisa en cada UPDATE, no sólo al
// crear) — no hay una fecha de alta separada. Se usa igual como criterio de
// "reciente" para la etiqueta "Nuevo" porque es el mismo campo que ya
// gobierna el orden de esta sección y el resto de "lo más reciente" en la
// home; en un catálogo chico, editar una pieza vieja y que por eso se lea
// como nueva por unos días es un costo aceptable.
function esNuevo(actualizadoEn) {
  const dias = (Date.now() - new Date(actualizadoEn).getTime()) / 86_400_000
  return dias <= DIAS_NUEVO
}

/**
 * "Recién llegados": los productos más recientes (mismo criterio que
 * /catalogo — disponible + existencias > 0, orden por actualizado_en
 * desc). Al tocar uno, va a /catalogo con su nombre en `q`: reusa el mismo
 * filtro de búsqueda que ya existe ahí en vez de una página de detalle.
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
          <Link
            key={producto.id}
            to={`/catalogo?q=${encodeURIComponent(producto.nombre)}`}
          >
            <ProductoCard
              producto={producto}
              mostrarSku={false}
              etiqueta={esNuevo(producto.actualizado_en) ? 'Nuevo' : null}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
