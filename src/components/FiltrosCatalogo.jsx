import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// Opción de texto suelta (talla, color, colección…): sin recuadro, sólo
// texto que se subraya al elegirse.
function Opcion({ activo, onClick, children }) {
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

// Sección de acordeón: línea fina como separador, sin caja. El caret gira
// al abrir/cerrar en vez de cambiar de símbolo.
function Seccion({ titulo, abierto, onToggle, children }) {
  return (
    <div className="border-b border-vooj-ink/10 py-5 first:pt-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="vooj-meta">{titulo}</span>
        <span
          aria-hidden="true"
          className={`text-[0.6rem] text-vooj-ink/40 transition-transform duration-200 ${
            abierto ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>
      {abierto && <div className="mt-4">{children}</div>}
    </div>
  )
}

/**
 * Filtros de /catalogo en secciones de acordeón (Talla, Precio, Color,
 * Colección — el layout que envuelve el panel, sidebar sticky o drawer,
 * lo decide Catalogo.jsx). La categoría NO vive acá: es navegación (la
 * fila de círculos, siempre visible arriba de las 2 columnas — ver
 * CategoriaFila.jsx); repetirla acá como filtro de texto sería
 * redundante con esa fila.
 *
 * Todo el estado vive en los query params de la URL (q, categoria, talla,
 * color, coleccion, min, max) para que un link con filtros se abra igual.
 * Se combinan con AND — el de categoría lo escribe CategoriaFila.jsx,
 * pero "Limpiar filtros" de acá abajo limpia todos por igual.
 *
 * props:
 *  - tallas, colores, colecciones: string[]  (valores distintos)
 *  - precioMin, precioMax: rango real de precios (para los placeholders)
 *
 * El contador de piezas y el orden viven en la barra de resultados, en
 * Catalogo.jsx — no acá.
 */
export default function FiltrosCatalogo({
  tallas,
  colores,
  colecciones,
  precioMin,
  precioMax,
}) {
  const [params, setParams] = useSearchParams()
  // Todas abiertas por defecto: es la migración natural del panel que ya
  // se veía siempre completo, y con 4 secciones chicas no hay tanto que
  // colapsar de entrada — el acordeón está para cuando la lista de
  // colores/colecciones crezca, no para esconder todo de arranque.
  const [abiertas, setAbiertas] = useState({
    talla: true,
    precio: true,
    color: true,
    coleccion: true,
  })
  const alternarSeccion = (clave) =>
    setAbiertas((a) => ({ ...a, [clave]: !a[clave] }))

  const q = params.get('q') || ''
  const categoria = params.get('categoria') || ''
  const talla = params.get('talla') || ''
  const color = params.get('color') || ''
  const coleccion = params.get('coleccion') || ''
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

  const hayFiltros = Boolean(
    q || categoria || talla || color || coleccion || min || max,
  )

  const inputPrecio =
    'w-full bg-transparent border-0 border-b border-vooj-ink/25 px-0 py-1 text-sm ' +
    'text-vooj-ink tabular-nums placeholder:text-vooj-ink/30 ' +
    'focus:outline-none focus:border-vooj-ink/60'

  return (
    <div>
      {/* Búsqueda — se queda fuera del acordeón, siempre visible */}
      <div className="pb-5">
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

      {tallas.length > 0 && (
        <Seccion
          titulo="talla"
          abierto={abiertas.talla}
          onToggle={() => alternarSeccion('talla')}
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {tallas.map((t) => (
              <Opcion key={t} activo={talla === t} onClick={() => alternar('talla', t)}>
                {t}
              </Opcion>
            ))}
          </div>
        </Seccion>
      )}

      <Seccion
        titulo="precio · mxn"
        abierto={abiertas.precio}
        onToggle={() => alternarSeccion('precio')}
      >
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
      </Seccion>

      {colores.length > 0 && (
        <Seccion
          titulo="color"
          abierto={abiertas.color}
          onToggle={() => alternarSeccion('color')}
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {colores.map((c) => (
              <Opcion key={c} activo={color === c} onClick={() => alternar('color', c)}>
                {c}
              </Opcion>
            ))}
          </div>
        </Seccion>
      )}

      {colecciones.length > 0 && (
        <Seccion
          titulo="colección"
          abierto={abiertas.coleccion}
          onToggle={() => alternarSeccion('coleccion')}
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {colecciones.map((c) => (
              <Opcion
                key={c}
                activo={coleccion === c}
                onClick={() => alternar('coleccion', c)}
              >
                {c}
              </Opcion>
            ))}
          </div>
        </Seccion>
      )}

      {hayFiltros && (
        <button
          type="button"
          onClick={() => setParams({}, { replace: true })}
          className="vooj-link mt-5 inline-block"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
