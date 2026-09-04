import { jsPDF } from 'jspdf'
import { formatPrecioMXN, primeraFoto } from './format.js'

/**
 * Exportación del catálogo a PDF. Se usa SÓLO desde /admin (vista ya
 * protegida por sesión + perfil). Nada público importa este módulo.
 *
 * Diseño: fondo hueso, tipografía clara, negro reservado al sello de marca
 * y al mosaico de las piezas sin foto. Jerarquía igual que en las tarjetas
 * del catálogo: la foto manda, el nombre acompaña, el precio se retira.
 * A diferencia de la vitrina pública, aquí sí va la talla (herramienta de
 * trabajo, no escaparate).
 */

// ── Geometría (A4 vertical, mm) ──────────────────────────────────────────
const PAGINA = { w: 210, h: 297 }
const MARGEN = 16
const CONTENIDO_W = PAGINA.w - MARGEN * 2
const REJILLA_Y = 34 // arranca debajo del encabezado
const LIMITE_INFERIOR = 281
const PIE_Y = 288

const COLS = 3
const GUTTER = 7
const CELDA_W = (CONTENIDO_W - GUTTER * (COLS - 1)) / COLS
const IMG_H = (CELDA_W * 4) / 3
const TEXTO_H = 14
const CELDA_H = IMG_H + TEXTO_H
const FILA_GAP = 12

// Filas que caben por página; si algún día cambia la geometría, se recalcula
// solo — la paginación no está clavada a un número de productos.
const FILAS = Math.max(
  1,
  Math.floor((LIMITE_INFERIOR - REJILLA_Y + FILA_GAP) / (CELDA_H + FILA_GAP)),
)
export const POR_PAGINA = COLS * FILAS

// ── Paleta ───────────────────────────────────────────────────────────────
const HUESO = [245, 240, 232]
const TINTA = [22, 21, 20]
const GRIS = [120, 118, 114]
const GRIS_CLARO = [152, 149, 145]
const LINEA = [216, 210, 200]
const NEGRO = [10, 10, 10]

// ── Imágenes ─────────────────────────────────────────────────────────────
// ~150 ppp al tamaño impreso de la celda: suficiente para verse bien sin
// que el archivo se dispare.
const FOTO_PX = { w: 320, h: 427 }
const MARCA_PX = { w: 160, h: 160 }
const CALIDAD_JPEG = 0.72

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    img.src = src
  })
}

/**
 * Redibuja la imagen a un lienzo del tamaño objetivo y la re-codifica como
 * JPEG. `contener` centra sin recortar (para el monograma); por defecto
 * recorta tipo object-cover (para las fotos de producto).
 */
function normalizar(img, { w, h, contener = false }) {
  const lienzo = document.createElement('canvas')
  lienzo.width = w
  lienzo.height = h
  const ctx = lienzo.getContext('2d')

  ctx.fillStyle = '#0A0A0A'
  ctx.fillRect(0, 0, w, h)

  const escala = contener
    ? Math.min(w / img.width, h / img.height)
    : Math.max(w / img.width, h / img.height)
  const dw = img.width * escala
  const dh = img.height * escala
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)

  return lienzo.toDataURL('image/jpeg', CALIDAD_JPEG)
}

/** Monograma VOOJ para el encabezado y para las piezas sin foto. */
async function prepararMarca() {
  try {
    const img = await cargarImagen('/logo-vooj-mark.png')
    return {
      sello: normalizar(img, { ...MARCA_PX, contener: true }),
      placeholder: normalizar(img, { ...FOTO_PX, contener: true }),
    }
  } catch {
    return { sello: null, placeholder: null }
  }
}

const CONCURRENCIA = 6

/**
 * Un data-URL por producto (foto normalizada o placeholder de marca).
 * Descarga en paralelo con tope de concurrencia y cachea por URL, así el
 * tiempo no crece linealmente cuando el catálogo tenga 50+ piezas.
 */
async function prepararFotos(productos, placeholder) {
  const urls = [
    ...new Set(productos.map((p) => primeraFoto(p.fotos)).filter(Boolean)),
  ]

  const cache = new Map()
  let siguiente = 0
  async function trabajador() {
    while (siguiente < urls.length) {
      const url = urls[siguiente++]
      try {
        cache.set(url, normalizar(await cargarImagen(url), FOTO_PX))
      } catch {
        cache.set(url, placeholder) // foto rota -> mosaico de marca
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCIA, urls.length) }, trabajador),
  )

  const porProducto = new Map()
  for (const p of productos) {
    const url = primeraFoto(p.fotos)
    porProducto.set(p.id, (url && cache.get(url)) || placeholder)
  }
  return porProducto
}

// ── Dibujo ───────────────────────────────────────────────────────────────
function dibujarFondo(doc) {
  doc.setFillColor(...HUESO)
  doc.rect(0, 0, PAGINA.w, PAGINA.h, 'F')
}

function dibujarEncabezado(doc, sello, fechaTexto) {
  if (sello) {
    doc.addImage(sello, 'JPEG', MARGEN, 13, 12, 12)
  } else {
    doc.setFillColor(...NEGRO)
    doc.rect(MARGEN, 13, 12, 12, 'F')
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...TINTA)
  doc.text('VOOJ', MARGEN + 16, 19.5, { charSpace: 1.4 })

  doc.setFontSize(6)
  doc.setTextColor(...GRIS)
  doc.text('BOUTIQUE DE MODA', MARGEN + 16, 23.5, { charSpace: 0.7 })

  doc.setFontSize(7.5)
  doc.text(fechaTexto, PAGINA.w - MARGEN, 23.5, { align: 'right' })

  doc.setDrawColor(...LINEA)
  doc.setLineWidth(0.2)
  doc.line(MARGEN, 28, PAGINA.w - MARGEN, 28)
}

function dibujarPie(doc, pagina, total) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...GRIS_CLARO)
  doc.text(`${pagina} / ${total}`, PAGINA.w / 2, PIE_Y, { align: 'center' })
}

function dibujarProducto(doc, producto, x, y, foto) {
  if (foto) {
    doc.addImage(foto, 'JPEG', x, y, CELDA_W, IMG_H)
  } else {
    doc.setFillColor(...NEGRO)
    doc.rect(x, y, CELDA_W, IMG_H, 'F')
  }

  // Nombre: máximo 2 líneas, el resto se recorta con elipsis.
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TINTA)
  const lineas = doc.splitTextToSize(String(producto.nombre ?? ''), CELDA_W)
  const visibles = lineas.slice(0, 2)
  if (lineas.length > 2) visibles[1] = `${visibles[1].slice(0, -1)}…`

  let ty = y + IMG_H + 5.4
  doc.text(visibles, x, ty)
  ty += visibles.length > 1 ? 8.4 : 4.6

  doc.setFontSize(8)
  doc.setTextColor(...GRIS)
  doc.text(formatPrecioMXN(producto.precio), x, ty)

  if (producto.talla) {
    doc.setFontSize(7)
    doc.setTextColor(...GRIS_CLARO)
    doc.text(String(producto.talla), x + CELDA_W, ty, { align: 'right' })
  }
}

// ── API ──────────────────────────────────────────────────────────────────
export function nombreArchivoPdf(fecha = new Date()) {
  const dosDigitos = (n) => String(n).padStart(2, '0')
  const y = fecha.getFullYear()
  const m = dosDigitos(fecha.getMonth() + 1)
  const d = dosDigitos(fecha.getDate())
  return `vooj-catalogo-${y}-${m}-${d}.pdf`
}

/** Construye el documento. Devuelve el jsPDF (sin descargarlo). */
export async function generarPdfCatalogo(productos) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  })

  const { sello, placeholder } = await prepararMarca()
  const fotos = await prepararFotos(productos, placeholder)

  const fechaTexto = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const totalPaginas = Math.max(1, Math.ceil(productos.length / POR_PAGINA))

  for (let pagina = 0; pagina < totalPaginas; pagina++) {
    if (pagina > 0) doc.addPage()
    dibujarFondo(doc)
    dibujarEncabezado(doc, sello, `Catálogo · ${fechaTexto}`)

    const lote = productos.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)
    lote.forEach((producto, i) => {
      const col = i % COLS
      const fila = Math.floor(i / COLS)
      const x = MARGEN + col * (CELDA_W + GUTTER)
      const y = REJILLA_Y + fila * (CELDA_H + FILA_GAP)
      dibujarProducto(doc, producto, x, y, fotos.get(producto.id))
    })

    dibujarPie(doc, pagina + 1, totalPaginas)
  }

  if (productos.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...GRIS)
    doc.text('No hay piezas disponibles para exportar.', PAGINA.w / 2, 120, {
      align: 'center',
    })
  }

  return doc
}

/** Genera y descarga. Devuelve el doc por si hace falta inspeccionarlo. */
export async function exportarCatalogoPdf(productos) {
  const doc = await generarPdfCatalogo(productos)
  doc.save(nombreArchivoPdf())
  return doc
}
