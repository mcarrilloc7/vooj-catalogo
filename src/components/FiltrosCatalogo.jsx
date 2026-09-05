import { useSearchParams } from 'react-router-dom'

// Talla: sin recuadro. Sólo texto; se subraya al elegirse.
function Talla({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`py-1 text-sm font-light transition-colors ${
        activo
          ? 'text-vooj-ink underline decoration-2 underline-offset-4'
          : 'text-vooj-ink/45 hover:text-vooj-ink'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Filtros de /catalogo (Talla, Precio — y lo que se sume), en formato de
 * lista vertical (sidebar fija en desktop, contenido del drawer en
 * tablet/móvil — el layout que la envuelve lo decide Catalogo.jsx, este
 * componente sólo apila hacia abajo). La categoría NO vive acá: es
 * navegación (la fila de círculos, siempre visible arriba de las 2
 * columnas — ver CategoriaFila.jsx), no tiene sentido repetirla como
 * filtro más en el sidebar.
 *
 * Todo el estado vive en los query params de la URL (q, categoria, talla,
 * min, max) para que un link con filtros se abra igual. Se combinan con
 * AND — el de categoría lo escribe CategoriaFila.jsx, pero "Limpiar
 * filtros" de acá abajo limpia los 5 por igual.
 *
 * props:
 *  - tallas: string[]  (valores distintos)
 *  - precioMin, precioMax: rango real de precios (para los placeholders)
 *
 * El contador de piezas vive en Catalogo.jsx, pegado al bloque de título.
 */
export default function FiltrosCatalogo({
  tallas,
  precioMin,
  precioMax,
}) {
  const [params, setParams] = useSearchParams()

  const q = params.get('q') || ''
  const categoria = params.get('categoria') || ''
  const talla = params.get('talla') || ''
  const min = params.get('min') || ''
  const max = params.get('max') || ''

  function actualizar(cambios) {
    const next = new URLSearchParams(params)
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) next.set(clave, valor)
      else next.delete(clave)
    }
    setParams(next, { replace: true })
  }

  const alternar = (clave, valor) =>
    actualizar({ [clave]: params.get(clave) === valor ? '' : valor })

  const hayFiltros = Boolean(q || categoria || talla || min || max)

  const inputPrecio =
    'w-full bg-transparent border-0 border-b border-vooj-ink/25 px-0 py-1 text-sm ' +
    'text-vooj-ink tabular-nums placeholder:text-vooj-ink/30 ' +
    'focus:outline-none focus:border-vooj-ink/60'

  return (
    <div className="space-y-8">
      {/* Búsqueda */}
      <div>
        <p className="vooj-meta mb-1.5">buscar</p>
        <input
          type="search"
          aria-label="Buscar por nombre"
          value={q}
          onChange={(e) => actualizar({ q: e.target.value })}
          placeholder="Buscar por nombre…"
          className="block w-full bg-transparent border-0 border-b border-vooj-ink/25 px-0 py-2 text-sm text-vooj-ink placeholder:text-vooj-ink/35 focus:outline-none focus:border-vooj-ink/60"
        />
      </div>

      {/* Talla */}
      {tallas.length > 0 && (
        <div>
          <p className="vooj-meta mb-2">talla</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {tallas.map((t) => (
              <Talla
                key={t}
                activo={talla === t}
                onClick={() => alternar('talla', t)}
              >
                {t}
              </Talla>
            ))}
          </div>
        </div>
      )}

      {/* Precio */}
      <div>
        <p className="vooj-meta mb-2">precio · mxn</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            aria-label="Precio mínimo"
            value={min}
            placeholder={precioMin != null ? String(precioMin) : 'mín'}
            onChange={(e) => actualizar({ min: e.target.value })}
            className={inputPrecio}
          />
          <span className="text-vooj-ink/30">—</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            aria-label="Precio máximo"
            value={max}
            placeholder={precioMax != null ? String(precioMax) : 'máx'}
            onChange={(e) => actualizar({ max: e.target.value })}
            className={inputPrecio}
          />
        </div>
      </div>

      {hayFiltros && (
        <button
          type="button"
          onClick={() => setParams({}, { replace: true })}
          className="vooj-link"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
