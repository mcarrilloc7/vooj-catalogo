import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { banners } from '../data/banners.js'

const AUTO_MS = 6000

function menosMovimiento() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

// `slide.imagen` (fijada a mano en banners.js) manda si existe; si no, se
// usa la foto de producto calculada en Home (misma foto y degradado que los
// paneles laterales, para que el carrusel se sienta parte del mismo bloque).
function Slide({ slide, foto }) {
  const [imgFallo, setImgFallo] = useState(false)
  const src = slide.imagen || foto
  const mostrarFoto = src && !imgFallo

  return (
    <Link
      to={slide.href}
      className="group relative block h-[260px] w-full shrink-0 sm:h-[340px]"
    >
      {mostrarFoto ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setImgFallo(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 bg-vooj-black" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-vooj-black/90 via-vooj-black/70 to-vooj-black/40" />

      <div className="relative flex h-full flex-col items-start justify-end gap-2 p-6 text-vooj-bone sm:p-10">
        {slide.eyebrow && (
          <p className="vooj-eyebrow text-vooj-bone/55">{slide.eyebrow}</p>
        )}
        <h2 className="vooj-wordmark text-2xl text-vooj-bone sm:text-3xl">
          {slide.titulo}
        </h2>
        {slide.texto && (
          <p className="max-w-sm text-sm text-vooj-bone/70">{slide.texto}</p>
        )}
        <span className="mt-3 inline-block border border-vooj-bone/70 px-7 py-3.5 vooj-eyebrow text-sm text-vooj-bone transition-colors group-hover:bg-vooj-bone group-hover:text-vooj-black">
          {slide.cta}
        </span>
      </div>
    </Link>
  )
}

export default function BannerCarrusel({ fotosPorHref = {} }) {
  const slides = banners
  const [i, setI] = useState(0)
  const pausado = useRef(false)

  const ir = (n) => setI(((n % slides.length) + slides.length) % slides.length)

  useEffect(() => {
    if (slides.length < 2 || menosMovimiento()) return
    const t = setInterval(() => {
      if (!pausado.current) setI((v) => (v + 1) % slides.length)
    }, AUTO_MS)
    return () => clearInterval(t)
  }, [slides.length])

  if (slides.length === 0) return null

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados"
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => (pausado.current = true)}
      onMouseLeave={() => (pausado.current = false)}
      onFocusCapture={() => (pausado.current = true)}
      onBlurCapture={() => (pausado.current = false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {slides.map((s) => (
          <Slide key={s.id} slide={s} foto={fotosPorHref[s.href]} />
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => ir(i - 1)}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-vooj-black/50 text-lg leading-none text-vooj-bone transition-colors hover:bg-vooj-black/80"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => ir(i + 1)}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-vooj-black/50 text-lg leading-none text-vooj-bone transition-colors hover:bg-vooj-black/80"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, n) => (
              <button
                key={n}
                type="button"
                onClick={() => ir(n)}
                aria-label={`Ir al destacado ${n + 1}`}
                aria-current={n === i}
                className={`h-1.5 rounded-full transition-all ${
                  n === i ? 'w-6 bg-vooj-bone' : 'w-1.5 bg-vooj-bone/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
