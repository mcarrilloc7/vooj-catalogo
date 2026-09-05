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

/**
 * ¿`fechaIso` cayó dentro de los últimos `dias` días? Se usa como criterio
 * de "Nuevo" en home y /catalogo. La tabla sólo guarda `actualizado_en`
 * (se pisa en cada UPDATE, no sólo al crear) — no hay fecha de alta
 * separada, así que esto es en rigor "tocado recientemente", no "dado de
 * alta recientemente". Costo aceptable en un catálogo chico.
 */
export function esReciente(fechaIso, dias = 7) {
  if (!fechaIso) return false
  const dif = (Date.now() - new Date(fechaIso).getTime()) / 86_400_000
  return dif <= dias
}

// Traducción de nombres de color en español (texto libre del admin) a un
// valor CSS aproximado, para el puntito de color de ProductoCard. No es
// exhaustivo — cubre los tonos más comunes de un catálogo de ropa; lo que
// no matchea simplemente no pinta el punto (ver colorAHex).
const COLORES_CONOCIDOS = {
  negro: '#161514',
  blanco: '#F5F0E8',
  hueso: '#F5F0E8',
  crema: '#F0E6D2',
  beige: '#E3D5B8',
  gris: '#9CA3AF',
  plateado: '#C0C0C0',
  azul: '#2563EB',
  'azul marino': '#1E3A5F',
  marino: '#1E3A5F',
  celeste: '#7DD3FC',
  turquesa: '#14B8A6',
  rojo: '#DC2626',
  vino: '#7F1D1D',
  rosa: '#F0ABC4',
  fucsia: '#DB2777',
  verde: '#16A34A',
  oliva: '#6B7A3A',
  amarillo: '#FACC15',
  mostaza: '#C99A2E',
  dorado: '#C6A15B',
  naranja: '#F97316',
  terracota: '#C1663A',
  café: '#6B4226',
  cafe: '#6B4226',
  marrón: '#6B4226',
  marron: '#6B4226',
  chocolate: '#4B2E1E',
  morado: '#7C3AED',
  lila: '#C4B5FD',
  lavanda: '#C7B8E8',
  khaki: '#B4A76C',
  caqui: '#B4A76C',
  denim: '#4A6B8A',
}

/** Nombre de color en español → valor CSS aproximado, o null si no matchea. */
export function colorAHex(nombre) {
  if (!nombre) return null
  return COLORES_CONOCIDOS[nombre.trim().toLowerCase()] ?? null
}
