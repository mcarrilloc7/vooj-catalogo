import { supabase } from './supabase.js'

const BUCKET_FOTOS = 'vooj-fotos'

const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

/** Precio numérico de Supabase → "$1,299.00" en pesos mexicanos. */
export function formatPrecioMXN(precio) {
  const n = Number(precio)
  return Number.isFinite(n) ? mxn.format(n) : ''
}

/**
 * Un elemento del array `fotos` puede ser una URL completa o una ruta dentro
 * del bucket `vooj-fotos`. Devuelve siempre una URL usable, o null si no hay foto.
 */
export function fotoPublicUrl(foto) {
  if (!foto || typeof foto !== 'string') return null
  if (/^https?:\/\//i.test(foto)) return foto

  const ruta = foto.replace(/^\/+/, '')
  const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ruta)
  return data?.publicUrl ?? null
}

/** Primera foto utilizable del array `fotos`, o null. */
export function primeraFoto(fotos) {
  if (!Array.isArray(fotos)) return null
  for (const f of fotos) {
    const url = fotoPublicUrl(f)
    if (url) return url
  }
  return null
}
