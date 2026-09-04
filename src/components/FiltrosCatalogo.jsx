import { useSearchParams } from 'react-router-dom'

function Chip({ activo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`px-3 py-1.5 vooj-eyebrow border transition-colors ${
        activo
          ? 'bg-vooj-ink text-vooj-bone border-vooj-ink'
          : 'border-vooj-ink/25 text-vooj-ink/70 hover:border-vooj-ink/50'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Barra de filtros de /catalogo. El estado vive en los query params de la URL
 * (categoria, talla, min, max) para que un link con filtros se abra igual.
 *
 * props:
 *  - categorias, tallas: valores distintos ya calculados desde los productos
 *  - precioMin, precioMax: rango real de precios (para los placeholders)
 *  - total: nº de productos que pasan los filtros actuales
 */
export default function FiltrosCatalogo({
  categorias,
  tallas,
  precioMin,
  precioMax,
  total,
}) {
  const [params, setParams] = useSearchParams()

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

  const hayFiltros = Boolean(categoria || talla || min || max)

  return (
    <div className="mb-10 space-y-5 border-b border-vooj-ink/12 pb-8">
      {categorias.length > 0 && (
        <div>
          <p className="vooj-label">Categoría</p>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <Chip
                key={c}
                activo={categoria === c}
                onClick={() => alternar('categoria', c)}
              >
                {c}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {tallas.length > 0 && (
        <div>
          <p className="vooj-label">Talla</p>
          <div className="flex flex-wrap gap-2">
            {tallas.map((t) => (
              <Chip
                key={t}
                activo={talla === t}
                onClick={() => alternar('talla', t)}
              >
                {t}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="vooj-label">Precio (MXN)</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            aria-label="Precio mínimo"
            value={min}
            placeholder={precioMin != null ? String(precioMin) : 'Mín'}
            onChange={(e) => actualizar({ min: e.target.value })}
            className="vooj-input w-24"
          />
          <span className="text-vooj-ink/40">—</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            aria-label="Precio máximo"
            value={max}
            placeholder={precioMax != null ? String(precioMax) : 'Máx'}
            onChange={(e) => actualizar({ max: e.target.value })}
            className="vooj-input w-24"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <span className="vooj-eyebrow text-vooj-ink/45">
          {total} {total === 1 ? 'pieza' : 'piezas'}
        </span>
        {hayFiltros && (
          <button
            type="button"
            onClick={() => setParams({}, { replace: true })}
            className="vooj-btn-plain"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
