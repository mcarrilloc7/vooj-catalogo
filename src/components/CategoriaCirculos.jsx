import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { primeraFoto } from '../lib/format.js'
import VoojBadge from './VoojBadge.jsx'

/**
 * Fila de círculos de categoría (misma presentación que en /catalogo, pero
 * centrada y como enlaces). Cada uno abre /catalogo con la categoría ya
 * filtrada. Lee sus propios datos; si no hay categorías, no renderiza nada.
 */
export default function CategoriaCirculos() {
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    let cancelado = false

    supabase
      .from('productos')
      .select('categoria, fotos')
      .eq('disponible', true)
      .then(({ data, error }) => {
        if (cancelado || error || !data) return
        const nombres = [
          ...new Set(data.map((p) => p.categoria).filter(Boolean)),
        ].sort()
        setCategorias(
          nombres.map((c) => {
            const conFoto = data.find(
              (p) => p.categoria === c && primeraFoto(p.fotos),
            )
            return {
              categoria: c,
              thumb: conFoto ? primeraFoto(conFoto.fotos) : null,
            }
          }),
        )
      })

    return () => {
      cancelado = true
    }
  }, [])

  if (categorias.length === 0) return null

  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
      {categorias.map(({ categoria, thumb }) => (
        <Link
          key={categoria}
          to={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
          className="group flex w-20 flex-col items-center gap-2"
        >
          <span className="block h-16 w-16 overflow-hidden rounded-full">
            {thumb ? (
              <img
                src={thumb}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <VoojBadge variant="mark" alt="" className="h-full w-full" />
            )}
          </span>
          <span className="text-xs font-light leading-tight text-center text-vooj-ink/60 transition-colors group-hover:text-vooj-ink">
            {categoria}
          </span>
        </Link>
      ))}
    </div>
  )
}
