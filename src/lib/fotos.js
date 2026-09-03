import { supabase } from './supabase.js'

const BUCKET = 'vooj-fotos'

export const MAX_BYTES = 5 * 1024 * 1024 // 5 MB por imagen

function extensionDe(nombre) {
  const m = /\.([a-z0-9]+)$/i.exec(nombre || '')
  return m ? m[1].toLowerCase() : 'jpg'
}

/** Valida un File antes de subirlo. Devuelve un mensaje de error o null. */
export function validarImagen(file) {
  if (!file.type.startsWith('image/')) {
    return `"${file.name}" no es una imagen.`
  }
  if (file.size > MAX_BYTES) {
    return `"${file.name}" pesa más de 5 MB.`
  }
  return null
}

/** Sube un File al bucket y devuelve la ruta guardada (no la URL). */
export async function subirFoto(file) {
  const ruta = `productos/${crypto.randomUUID()}.${extensionDe(file.name)}`
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  return data.path
}

/**
 * Borra rutas del bucket. Best-effort: no lanza, solo registra en consola.
 * Ignora URLs externas (no viven en nuestro bucket).
 */
export async function eliminarFotos(rutas) {
  const internas = (rutas ?? []).filter(
    (r) => r && !/^https?:\/\//i.test(r),
  )
  if (internas.length === 0) return
  const { error } = await supabase.storage.from(BUCKET).remove(internas)
  if (error) console.error('[fotos] no se pudieron eliminar:', internas, error)
}
