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

function Slide({ slide }) {
  return (
    <Link
      to={slide.href}
      className="group relative block h-[260px] w-full shrink-0 sm:h-[340px]"
    >
      {slide.imagen ? (
        <>
          <img
            src={slide.imagen}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-vooj-black/45" />
        </>
      ) : (
        <span className="absolute inset-0 bg-vooj-black" />
      )}

      <div className="relative flex h-full flex-col items-start justify-end gap-2 p-6 text-vooj-bone sm:p-10">
        <h2 className="vooj-wordmark text-2xl text-vooj-bone sm:text-3xl">
          {slide.titulo}
        </h2>
        {slide.texto && (
          <p className="max-w-sm text-sm text-vooj-bone/70">{slide.texto}</p>
        )}
        <span className="mt-3 inline-block border border-vooj-bone/60 px-4 py-2 vooj-eyebrow text-vooj-bone transition-colors group-hover:bg-vooj-bone group-hover:text-vooj-black">
          {slide.cta}
        </span>
      </div>
    </Link>
  )
}

export default function BannerCarrusel() {
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
      className="relative w-full overflow-hidden border border-vooj-ink/12"
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
          <Slide key={s.id} slide={s} />
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
