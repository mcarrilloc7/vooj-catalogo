import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function IconoLupa({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <circle cx="8.5" cy="8.5" r="6" />
      <path d="M17 17l-4.3-4.3" strokeLinecap="round" />
    </svg>
  )
}

function IconoCerrar({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Buscador del header: sólo redirige a /catalogo?q=<texto>. El filtrado en
 * sí vive únicamente en Catalogo.jsx / FiltrosCatalogo.jsx (leen el mismo
 * query param `q`) — acá no se repite esa lógica, sólo se dispara la
 * navegación con el texto escrito.
 */
export default function BuscadorHeader({ movilAbierto, onAbrirMovil, onCerrarMovil }) {
  const navigate = useNavigate()
  const [valor, setValor] = useState('')

  function buscar() {
    const texto = valor.trim()
    navigate(texto ? `/catalogo?q=${encodeURIComponent(texto)}` : '/catalogo')
    onCerrarMovil?.()
  }

  function alEnviar(e) {
    e.preventDefault()
    buscar()
  }

  // Enter se maneja a mano (no sólo vía onSubmit del form): en el teclado
  // virtual de algunos móviles la tecla "buscar/ir" no siempre dispara un
  // submit nativo del formulario.
  function alPresionarTecla(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      buscar()
    } else if (e.key === 'Escape') {
      onCerrarMovil?.()
    }
  }

  return (
    <>
      {/* Desktop: caja clara marfil sobre el header negro — a propósito
          contrasta fuerte para que se lea como función de inmediato (no
          discreta como el resto del header), pero se mantiene angosta y con
          esquinas apenas redondeadas para no salirse del tono minimalista.
          Centrada de verdad sobre el header entero (no sobre el espacio
          libre entre logo y nav) vía `absolute` + `left-1/2` respecto al
          `<header>` (ya es `position: relative`).
          Arranca en `xl` (1280px), no antes: centrada a ciegas, sin tomar
          en cuenta el ancho real del nav (~303px con su tracking amplio),
          una caja de 480px se solapa con "Catálogo" en cualquier ancho por
          debajo de ~1134px. `lg` (1024-1279px) se queda con el chip. */}
      <div className="absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center xl:flex">
        <form
          onSubmit={alEnviar}
          className="flex w-[480px] items-center gap-2 rounded-md border border-vooj-ink/10 bg-vooj-bone px-4 py-2.5 transition-shadow focus-within:shadow-sm"
        >
          <input
            type="search"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={alPresionarTecla}
            placeholder="Buscar en VOOJ…"
            aria-label="Buscar en VOOJ"
            className="w-full bg-transparent text-sm text-vooj-ink placeholder:text-vooj-ink/45 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="shrink-0 text-vooj-ink/50 transition-colors hover:text-vooj-ink"
          >
            <IconoLupa />
          </button>
        </form>
      </div>

      {/* Móvil, tablet y laptop angosta (< xl): mismo tratamiento en un
          chip; al tocarlo se expande a la caja completa (el logo y la
          hamburguesa, cuando están visibles, se ocultan para darle
          espacio). */}
      <div className="flex min-w-0 flex-1 items-center justify-end xl:hidden">
        {movilAbierto ? (
          <form
            onSubmit={alEnviar}
            className="flex w-full items-center gap-2 rounded-md border border-vooj-ink/10 bg-vooj-bone px-3 py-2.5"
          >
            <input
              type="search"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={alPresionarTecla}
              placeholder="Buscar en VOOJ…"
              aria-label="Buscar en VOOJ"
              autoFocus
              className="w-full bg-transparent text-sm text-vooj-ink placeholder:text-vooj-ink/45 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="shrink-0 text-vooj-ink/50 transition-colors hover:text-vooj-ink"
            >
              <IconoLupa />
            </button>
            <button
              type="button"
              onClick={onCerrarMovil}
              aria-label="Cerrar búsqueda"
              className="shrink-0 text-vooj-ink/50 transition-colors hover:text-vooj-ink"
            >
              <IconoCerrar />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={onAbrirMovil}
            aria-label="Abrir búsqueda"
            className="-mr-1 rounded-md border border-vooj-ink/10 bg-vooj-bone p-2 text-vooj-ink/60 transition-colors hover:text-vooj-ink"
          >
            <IconoLupa className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </>
  )
}
