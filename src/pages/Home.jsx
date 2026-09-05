import BannerCarrusel from '../components/BannerCarrusel.jsx'
import PanelHome from '../components/PanelHome.jsx'
import CategoriaCirculos from '../components/CategoriaCirculos.jsx'
import { panelesHome } from '../data/panelesHome.js'

export default function Home() {
  return (
    <div className="space-y-16">
      {/* 3 columnas: paneles · carrusel · paneles (1 columna en móvil) */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.9fr_1fr] lg:items-stretch">
        <div className="order-2 flex flex-col gap-4 lg:order-1">
          {panelesHome.izquierda.map((p) => (
            <PanelHome key={p.id} panel={p} />
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <BannerCarrusel />
        </div>

        <div className="order-3 flex flex-col gap-4">
          {panelesHome.derecha.map((p) => (
            <PanelHome key={p.id} panel={p} />
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
