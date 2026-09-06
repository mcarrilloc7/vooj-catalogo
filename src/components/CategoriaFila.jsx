import { useSearchParams } from 'react-router-dom'
import VoojBadge from './VoojBadge.jsx'

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
 * Fila de círculos de categoría de /catalogo — navegación, no un filtro
 * más del sidebar (por eso vive aparte de FiltrosCatalogo.jsx, a todo el
 * ancho, arriba del layout de 2 columnas). Mismo query param `categoria`
 * que el resto de los filtros, así que combina con ellos igual que antes.
 *
 * En pantallas angostas hace scroll horizontal en vez de apretarse o
 * pasar a varias filas.
 *
 * props:
 *  - categorias: [{ categoria, thumb }]  (thumb = 1ª foto de esa categoría o null)
 */
export default function CategoriaFila({ categorias }) {
  const [params, setParams] = useSearchParams()
  const categoria = params.get('categoria') || ''

  function alternar(valor) {
    const next = new URLSearchParams(params)
    if (categoria === valor) next.delete('categoria')
    else next.set('categoria', valor)
    setParams(next, { replace: true })
  }

  if (categorias.length === 0) return null

  return (
    <div role="group" aria-label="Categoría" className="overflow-x-auto pb-1 no-scrollbar">
      {/* w-full + justify-between: la fila ocupa todo el ancho disponible,
          primero y último círculo tocando los bordes. gap-4 es el mínimo
          entre ellos — si no entran a ese mínimo (móvil), el contenido
          desborda y el overflow-x-auto de arriba hace scroll en vez de
          apretarlos (justify-between no tiene efecto visible una vez que
          desborda: los navegadores lo tratan como flex-start ahí). */}
      <div className="flex w-full flex-nowrap justify-between gap-4">
        {categorias.map((c) => (
          <CirculoCategoria
            key={c.categoria}
            categoria={c.categoria}
            thumb={c.thumb}
            activo={categoria === c.categoria}
            onClick={() => alternar(c.categoria)}
          />
        ))}
      </div>
    </div>
  )
}
