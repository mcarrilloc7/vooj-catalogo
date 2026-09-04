import { useSearchParams } from 'react-router-dom'
import VoojBadge from './VoojBadge.jsx'

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

function CirculoCategoria({ categoria, thumb, activo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className="shrink-0 flex w-20 flex-col items-center gap-2"
    >
      <span
        className={`block h-16 w-16 overflow-hidden rounded-full transition-[box-shadow] ${
          activo ? 'ring-1 ring-vooj-ink ring-offset-2 ring-offset-vooj-bone' : ''
        }`}
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <VoojBadge variant="mark" alt="" className="h-full w-full" />
        )}
      </span>
      <span
        className={`text-xs font-light text-center leading-tight ${
          activo ? 'text-vooj-ink' : 'text-vooj-ink/50'
        }`}
      >
        {categoria}
      </span>
    </button>
  )
}

/**
 * Barra de filtros de /catalogo. Todo el estado vive en los query params
 * de la URL (q, categoria, talla, min, max) para que un link con filtros
 * se abra igual. Se combinan con AND.
 *
 * props:
 *  - categorias: [{ categoria, thumb }]  (thumb = 1ª foto de esa categoría o null)
 *  - tallas: string[]  (valores distintos)
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
    'w-16 bg-transparent border-0 border-b border-vooj-ink/25 px-0 py-1 text-sm ' +
    'text-vooj-ink tabular-nums placeholder:text-vooj-ink/30 ' +
    'focus:outline-none focus:border-vooj-ink/60'

  return (
    <div className="mb-14 space-y-7">
      {/* Búsqueda — sin label, el placeholder alcanza */}
      <input
        type="search"
        aria-label="Buscar por nombre"
        value={q}
        onChange={(e) => actualizar({ q: e.target.value })}
        placeholder="Buscar por nombre…"
        className="w-full bg-transparent border-0 border-b border-vooj-ink/25 px-0 py-2 text-sm text-vooj-ink placeholder:text-vooj-ink/35 focus:outline-none focus:border-vooj-ink/60"
      />

      {/* Categoría — círculos con foto (se explican solos) */}
      {categorias.length > 0 && (
        <div role="group" aria-label="Categoría">
          <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
            {categorias.map((c) => (
              <CirculoCategoria
                key={c.categoria}
                categoria={c.categoria}
                thumb={c.thumb}
                activo={categoria === c.categoria}
                onClick={() => alternar('categoria', c.categoria)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
        {/* Talla */}
        {tallas.length > 0 && (
          <div>
            <p className="vooj-meta mb-1">talla</p>
            <div className="flex flex-wrap gap-x-4">
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
          <p className="vooj-meta mb-1">precio · mxn</p>
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
      </div>

      <div className="flex items-center gap-5">
        <span className="vooj-meta">
          {total} {total === 1 ? 'pieza' : 'piezas'}
        </span>
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
    </div>
  )
}
