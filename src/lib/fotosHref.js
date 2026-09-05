import { primeraFoto } from './format.js'

/** Categoría fijada en un href tipo '/catalogo?categoria=X', o null. */
export function categoriaDeHref(href) {
  const qs = href.split('?')[1]
  return qs ? new URLSearchParams(qs).get('categoria') : null
}

/**
 * Foto de fondo para una lista de hrefs de catálogo: si el href no fija
 * categoría (p. ej. sólo '/catalogo'), la más reciente de cualquier
 * producto; si la fija, la 1ª foto disponible de esa categoría (mismo
 * criterio que los círculos de /catalogo). Devuelve { [href]: url | null }.
 */
export function mapaFotosPorHref(productos, hrefs) {
  const masReciente = [...productos]
    .sort((a, b) => new Date(b.actualizado_en) - new Date(a.actualizado_en))
    .find((p) => primeraFoto(p.fotos))

  const mapa = {}
  for (const href of new Set(hrefs)) {
    const categoria = categoriaDeHref(href)
    if (!categoria) {
      mapa[href] = masReciente ? primeraFoto(masReciente.fotos) : null
      continue
    }
    const conFoto = productos.find(
      (p) => p.categoria === categoria && primeraFoto(p.fotos),
    )
    mapa[href] = conFoto ? primeraFoto(conFoto.fotos) : null
  }
  return mapa
}
