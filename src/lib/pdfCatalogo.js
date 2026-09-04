import { jsPDF } from 'jspdf'
import { formatPrecioMXN, primeraFoto } from './format.js'
import { exportablesAPdf } from './inventario.js'

/**
 * Exportación del catálogo a PDF. Se usa SÓLO desde /admin (vista ya
 * protegida por sesión + perfil). Nada público importa este módulo.
 *
 * Diseño: fondo hueso, tipografía clara, negro reservado al sello de marca
 * y al mosaico de las piezas sin foto. Jerarquía igual que en las tarjetas
 * del catálogo: la foto manda, el nombre acompaña, el precio se retira.
 * A diferencia de la vitrina pública, aquí van talla, existencias y
 * descripción (herramienta de trabajo, no escaparate).
 *
 * Las piezas se agrupan por categoría, con un encabezado de sección sutil.
 * El layout es de flujo: cada fila mide lo que necesita (una pieza sin
 * descripción no deja hueco), y las páginas se cortan solas.
 */

// ── Geometría (A4 vertical, mm) ──────────────────────────────────────────
const PAGINA = { w: 210, h: 297 }
const MARGEN = 16
const CONTENIDO_W = PAGINA.w - MARGEN * 2
const CUERPO_Y = 34 // arranca debajo del encabezado de página
const LIMITE_INFERIOR = 279
const PIE_Y = 288

const COLS = 3
const GUTTER = 7
const CELDA_W = (CONTENIDO_W - GUTTER * (COLS - 1)) / COLS
const IMG_H = (CELDA_W * 4) / 3

// Ritmo vertical: el aire crece de dentro hacia fuera —
// dentro de la ficha < entre filas < entre secciones.
const GAP_IMG_TEXTO = 5.2
const GAP_NOMBRE_PRECIO = 1.4
const GAP_PRECIO_META = 1.2
const GAP_META_DESC = 2.0
const GAP_FILA = 11
const GAP_SECCION = 17
const GAP_TITULO_FILA = 6.5
const ALTO_TITULO = 3.2 // del tope del bloque a la línea base del título

// ── Tipografía ───────────────────────────────────────────────────────────
const MM_POR_PT = 0.352778
const FACTOR_LINEA = 1.32
const lh = (pt) => pt * FACTOR_LINEA * MM_POR_PT

const PT_NOMBRE = 9
const PT_PRECIO = 8
const PT_META = 6.8
const PT_DESC = 6.8
const PT_SECCION = 8.5

const MAX_LINEAS_NOMBRE = 2
const MAX_LINEAS_DESC = 2

// ── Paleta ───────────────────────────────────────────────────────────────
const HUESO = [245, 240, 232]
const TINTA = [22, 21, 20]
const GRIS = [120, 118, 114]
const GRIS_CLARO = [152, 149, 145]
const GRIS_TENUE = [170, 166, 161]
const LINEA = [216, 210, 200]
const NEGRO = [10, 10, 10]

// ── Imágenes ─────────────────────────────────────────────────────────────
// ~150 ppp al tamaño impreso de la celda: se ve bien sin disparar el peso.
const FOTO_PX = { w: 320, h: 427 }
const MARCA_PX = { w: 160, h: 160 }
const CALIDAD_JPEG = 0.72
const CONCURRENCIA = 6

function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
    img.src = src
  })
}

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

/** Descarga en paralelo (con tope) y cachea por URL. */
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

// ── Contenido de la ficha ────────────────────────────────────────────────
function lineaMeta(producto) {
  const n = Number(producto.existencias)
  const stock = `${n} ${n === 1 ? 'disponible' : 'disponibles'}`
  return producto.talla ? `${producto.talla} · ${stock}` : stock
}

function recortar(lineas, maximo) {
  if (lineas.length <= maximo) return lineas
  const cortadas = lineas.slice(0, maximo)
  cortadas[maximo - 1] = `${cortadas[maximo - 1].replace(/\s+\S*$/, '')}…`
  return cortadas
}

/** Mide el bloque de texto de una ficha (alto real, sin huecos fantasma). */
function medir(doc, producto) {
  doc.setFontSize(PT_NOMBRE)
  const nombre = recortar(
    doc.splitTextToSize(String(producto.nombre ?? ''), CELDA_W),
    MAX_LINEAS_NOMBRE,
  )

  let descripcion = []
  const textoDesc = String(producto.descripcion ?? '').trim()
  if (textoDesc) {
    doc.setFontSize(PT_DESC)
    descripcion = recortar(
      doc.splitTextToSize(textoDesc, CELDA_W),
      MAX_LINEAS_DESC,
    )
  }

  let alto = GAP_IMG_TEXTO + nombre.length * lh(PT_NOMBRE)
  alto += GAP_NOMBRE_PRECIO + lh(PT_PRECIO)
  alto += GAP_PRECIO_META + lh(PT_META)
  if (descripcion.length) {
    alto += GAP_META_DESC + descripcion.length * lh(PT_DESC)
  }

  return { nombre, descripcion, alto }
}

const ALTO_MINIMO_FICHA =
  IMG_H +
  GAP_IMG_TEXTO +
  lh(PT_NOMBRE) +
  GAP_NOMBRE_PRECIO +
  lh(PT_PRECIO) +
  GAP_PRECIO_META +
  lh(PT_META)

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

function dibujarPies(doc) {
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRIS_CLARO)
    doc.text(`${i} / ${total}`, PAGINA.w / 2, PIE_Y, { align: 'center' })
  }
}

/** Encabezado de sección: nombre de categoría + filete fino hasta el margen. */
function dibujarSeccion(doc, categoria, yTop) {
  const base = yTop + ALTO_TITULO
  const texto = String(categoria).toUpperCase()
  const charSpace = 1.1

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PT_SECCION)
  doc.setTextColor(...TINTA)
  doc.text(texto, MARGEN, base, { charSpace })

  const ancho = doc.getTextWidth(texto) + texto.length * charSpace
  const xFilete = MARGEN + ancho + 5
  if (xFilete < PAGINA.w - MARGEN) {
    doc.setDrawColor(...LINEA)
    doc.setLineWidth(0.2)
    doc.line(xFilete, base - 1.1, PAGINA.w - MARGEN, base - 1.1)
  }

  return base + GAP_TITULO_FILA
}

function dibujarProducto(doc, producto, x, y, foto, medida) {
  if (foto) {
    doc.addImage(foto, 'JPEG', x, y, CELDA_W, IMG_H)
  } else {
    doc.setFillColor(...NEGRO)
    doc.rect(x, y, CELDA_W, IMG_H, 'F')
  }

  doc.setFont('helvetica', 'normal')
  let ty = y + IMG_H + GAP_IMG_TEXTO

  doc.setFontSize(PT_NOMBRE)
  doc.setTextColor(...TINTA)
  doc.text(medida.nombre, x, ty)
  ty += medida.nombre.length * lh(PT_NOMBRE)

  ty += GAP_NOMBRE_PRECIO
  doc.setFontSize(PT_PRECIO)
  doc.setTextColor(...GRIS)
  doc.text(formatPrecioMXN(producto.precio), x, ty)
  ty += lh(PT_PRECIO)

  ty += GAP_PRECIO_META
  doc.setFontSize(PT_META)
  doc.setTextColor(...GRIS_CLARO)
  doc.text(lineaMeta(producto), x, ty)
  ty += lh(PT_META)

  if (medida.descripcion.length) {
    ty += GAP_META_DESC
    doc.setFontSize(PT_DESC)
    doc.setTextColor(...GRIS_TENUE)
    doc.text(medida.descripcion, x, ty)
  }
}

function agruparPorCategoria(productos) {
  const grupos = new Map()
  for (const p of productos) {
    const categoria = String(p.categoria ?? '').trim() || 'Sin categoría'
    if (!grupos.has(categoria)) grupos.set(categoria, [])
    grupos.get(categoria).push(p)
  }
  return [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'))
}

// ── API ──────────────────────────────────────────────────────────────────
export { exportablesAPdf }

export function nombreArchivoPdf(fecha = new Date()) {
  const dosDigitos = (n) => String(n).padStart(2, '0')
  const y = fecha.getFullYear()
  const m = dosDigitos(fecha.getMonth() + 1)
  const d = dosDigitos(fecha.getDate())
  return `vooj-catalogo-${y}-${m}-${d}.pdf`
}

/** Construye el documento. Devuelve el jsPDF (sin descargarlo). */
export async function generarPdfCatalogo(productos) {
  const lista = exportablesAPdf(productos)

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
  })
  doc.setLineHeightFactor(FACTOR_LINEA)

  const { sello, placeholder } = await prepararMarca()
  const fotos = await prepararFotos(lista, placeholder)

  const fechaTexto = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  let primera = true
  const abrirPagina = () => {
    if (!primera) doc.addPage()
    primera = false
    dibujarFondo(doc)
    dibujarEncabezado(doc, sello, `Catálogo · ${fechaTexto}`)
    return CUERPO_Y
  }

  let y = abrirPagina()

  if (lista.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...GRIS)
    doc.text(
      'No hay piezas con existencias para exportar.',
      PAGINA.w / 2,
      120,
      { align: 'center' },
    )
    dibujarPies(doc)
    return doc
  }

  for (const [categoria, items] of agruparPorCategoria(lista)) {
    // Nunca dejar un título de sección huérfano al pie de la página.
    if (y + ALTO_TITULO + GAP_TITULO_FILA + ALTO_MINIMO_FICHA > LIMITE_INFERIOR) {
      y = abrirPagina()
    }
    y = dibujarSeccion(doc, categoria, y)

    for (let i = 0; i < items.length; i += COLS) {
      const fila = items.slice(i, i + COLS)
      const medidas = fila.map((p) => medir(doc, p))
      const altoFila = IMG_H + Math.max(...medidas.map((m) => m.alto))

      if (y + altoFila > LIMITE_INFERIOR) {
        y = abrirPagina()
        y = dibujarSeccion(doc, categoria, y) // se repite al continuar
      }

      fila.forEach((producto, col) => {
        const x = MARGEN + col * (CELDA_W + GUTTER)
        dibujarProducto(doc, producto, x, y, fotos.get(producto.id), medidas[col])
      })

      y += altoFila + GAP_FILA
    }

    y += GAP_SECCION - GAP_FILA // el aire de sección sustituye al de fila
  }

  dibujarPies(doc)
  return doc
}

/** Genera y descarga. Devuelve el doc por si hace falta inspeccionarlo. */
export async function exportarCatalogoPdf(productos) {
  const doc = await generarPdfCatalogo(productos)
  doc.save(nombreArchivoPdf())
  return doc
}
