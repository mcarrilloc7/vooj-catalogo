import { useEffect, useMemo, useState } from 'react'
import BannerCarrusel from '../components/BannerCarrusel.jsx'
import PanelHome from '../components/PanelHome.jsx'
import CategoriaCirculos from '../components/CategoriaCirculos.jsx'
import { panelesHome } from '../data/panelesHome.js'
import { supabase } from '../lib/supabase.js'
import { primeraFoto } from '../lib/format.js'

/** Categoría filtrada en el href de un panel, o null (p. ej. Novedades). */
function categoriaDe(href) {
  const qs = href.split('?')[1]
  return qs ? new URLSearchParams(qs).get('categoria') : null
}

export default function Home() {
  const [productos, setProductos] = useState([])

  useEffect(() => {
    let cancelado = false

    supabase
      .from('productos')
      .select('categoria, fotos, actualizado_en')
      .eq('disponible', true)
      .then(({ data, error }) => {
        if (cancelado || error || !data) return
        setProductos(data)
      })

    return () => {
      cancelado = true
    }
  }, [])

  // Foto de fondo por panel: "Novedades" usa la más reciente de cualquier
  // producto; el resto, la 1ª foto disponible de esa categoría (mismo
  // criterio que los círculos de /catalogo).
  const fotoPorPanel = useMemo(() => {
    const masReciente = [...productos]
      .sort((a, b) => new Date(b.actualizado_en) - new Date(a.actualizado_en))
      .find((p) => primeraFoto(p.fotos))

    const mapa = {}
    for (const panel of [...panelesHome.izquierda, ...panelesHome.derecha]) {
      const categoria = categoriaDe(panel.href)
      if (!categoria) {
        mapa[panel.id] = masReciente ? primeraFoto(masReciente.fotos) : null
        continue
      }
      const conFoto = productos.find(
        (p) => p.categoria === categoria && primeraFoto(p.fotos),
      )
      mapa[panel.id] = conFoto ? primeraFoto(conFoto.fotos) : null
    }
    return mapa
  }, [productos])

  return (
    <div className="space-y-16">
      {/* 3 columnas: paneles · carrusel · paneles (1 columna en móvil) */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.9fr_1fr] lg:items-stretch">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          {panelesHome.izquierda.map((p) => (
            <PanelHome key={p.id} panel={p} foto={fotoPorPanel[p.id]} />
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <BannerCarrusel />
        </div>

        <div className="order-3 flex flex-col gap-4">
          {panelesHome.derecha.map((p) => (
            <PanelHome key={p.id} panel={p} foto={fotoPorPanel[p.id]} />
          ))}
        </div>
      </section>

      {/* Círculos de categoría, centrados */}
      <section>
        <CategoriaCirculos />
      </section>

      {/* Lema de marca, cierre de la home */}
      <section>
        <p className="vooj-wordmark text-center text-xs text-vooj-ink/45 sm:text-sm">
          Pocas piezas, bien elegidas
        </p>
      </section>
    </div>
  )
}
