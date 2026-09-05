import { useEffect, useMemo, useState } from 'react'
import BannerCarrusel from '../components/BannerCarrusel.jsx'
import PanelHome from '../components/PanelHome.jsx'
import CategoriaCirculos from '../components/CategoriaCirculos.jsx'
import { panelesHome } from '../data/panelesHome.js'
import { banners } from '../data/banners.js'
import { supabase } from '../lib/supabase.js'
import { mapaFotosPorHref } from '../lib/fotosHref.js'

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

  // Foto de fondo por destino de /catalogo (paneles laterales + slides del
  // carrusel): "Novedades" / slides sin categoría usan la más reciente de
  // cualquier producto; el resto, la 1ª foto disponible de esa categoría
  // (mismo criterio que los círculos de /catalogo).
  const fotosPorHref = useMemo(
    () =>
      mapaFotosPorHref(productos, [
        ...panelesHome.izquierda.map((p) => p.href),
        ...panelesHome.derecha.map((p) => p.href),
        ...banners.map((b) => b.href),
      ]),
    [productos],
  )

  return (
    <div className="space-y-16">
      {/* 3 columnas: paneles · carrusel · paneles (1 columna en móvil) */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.9fr_1fr] lg:items-stretch">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          {panelesHome.izquierda.map((p) => (
            <PanelHome key={p.id} panel={p} foto={fotosPorHref[p.href]} />
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <BannerCarrusel fotosPorHref={fotosPorHref} />
        </div>

        <div className="order-3 flex flex-col gap-4">
          {panelesHome.derecha.map((p) => (
            <PanelHome key={p.id} panel={p} foto={fotosPorHref[p.href]} />
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
