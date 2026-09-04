import { jsPDF } from 'jspdf'
import { formatPrecioMXN, primeraFoto } from './format.js'
import { exportablesAPdf } from './inventario.js'

/**
 * Exportación del catálogo a PDF. Se usa SÓLO desde /admin (vista ya
 * protegida por sesión + perfil). Nada público importa este módulo.
 *
 * Estructura: portada negra + páginas de contenido en hueso, agrupadas por
 * categoría. Jerarquía tipográfica de tres pasos (nombre > precio > datos),
 * con el SKU en monoespaciada porque es el código que la clienta copia al
 * WhatsApp. Sin filetes decorativos: el aire separa.
 */

// ── Contacto de la boutique (aparece en el pie y en la portada) ──────────
const CONTACTO = 'WhatsApp 55 4840 1782'

// ── Geometría (A4 vertical, mm) ─────────────────────────────────────────
const PAGINA = { w: 210, h: 297 }
const MARGEN = 16
const CONTENIDO_W = PAGINA.w - MARGEN * 2
const CUERPO_Y = 32
const LIMITE_INFERIOR = 277
const PIE_Y = 288

const COLS = 3
const GUTTER = 7
const CELDA_W = (CONTENIDO_W - GUTTER * (COLS - 1)) / COLS
const IMG_H = (CELDA_W * 4) / 3 // retrato 3:4
const ANCHA_W = CELDA_W * 2 + GUTTER
const ANCHA_H = (ANCHA_W * 2) / 3 // apaisado 3:2

// Ritmo: el aire crece de dentro hacia fuera.
const GAP_IMG_TEXTO = 5.2
const GAP_NOMBRE_PRECIO = 1.4
const GAP_PRECIO_SKU = 1.6
const GAP_SKU_META = 1.2
const GAP_META_DESC = 2.0
const GAP_FILA = 11
const GAP_SECCION = 17
const GAP_TITULO_FILA = 6.5
const ALTO_TITULO = 3.4

// ── Tipografía ──────────────────────────────────────────────────────────
const MM_POR_PT = 0.352778
const FACTOR_LINEA = 1.32
const lh = (pt) => pt * FACTOR_LINEA * MM_POR_PT

const PT_NOMBRE = 10
const PT_PRECIO = 8
const PT_SKU = 6.5
const PT_META = 6.2
const PT_DESC = 6.2
const PT_SECCION = 9

const MAX_LINEAS_NOMBRE = 2
const MAX_LINEAS_META = 2
const MAX_LINEAS_DESC = 2

// ── Paleta ──────────────────────────────────────────────────────────────
const HUESO = [245, 240, 232]
const TINTA = [22, 21, 20]
const GRIS = [120, 118, 114]
const GRIS_CLARO = [152, 149, 145]
const GRIS_TENUE = [170, 166, 161]
const NEGRO = [10, 10, 10]
// El JPEG del lockup trae el negro casi puro (0–2). La portada se pinta con
// ese mismo negro para que la imagen no se recorte como un recuadro visible.
const NEGRO_PORTADA = [0, 0, 0]

// ── Imágenes ────────────────────────────────────────────────────────────
const FOTO_V = { w: 320, h: 427 } // retrato
const FOTO_H = { w: 480, h: 320 } // apaisado
const SELLO_PX = { w: 200, h: 200 }
const LOCKUP_PX = { w: 520, h: 520 }
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

function normalizar(img, { w, h, contener = false, fondo = '#0A0A0A' }) {
  const lienzo = document.createElement('canvas')
  lienzo.width = w
  lienzo.height = h
  const ctx = lienzo.getContext('2d')

  ctx.fillStyle = fondo
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
  const vacio = { sello: null, lockup: null, placeholderV: null, placeholderH: null }
  try {
    const [marca, lockup] = await Promise.all([
      cargarImagen('/logo-vooj-mark.png'),
      cargarImagen('/logo-vooj.jpg').catch(() => null),
    ])
    return {
      sello: normalizar(marca, { ...SELLO_PX, contener: true }),
      lockup: lockup
        ? normalizar(lockup, { ...LOCKUP_PX, contener: true, fondo: '#000000' })
        : null,
      placeholderV: normalizar(marca, { ...FOTO_V, contener: true }),
      placeholderH: normalizar(marca, { ...FOTO_H, contener: true }),
    }
  } catch {
    return vacio
  }
}

/**
 * Normaliza cada foto al recorte que le toca según su sitio en el layout
 * (retrato o apaisado). Paralelo con tope y caché por url+orientación.
 */
async function prepararFotos(productos, orientaciones, marca) {
  const tareas = []
  const vistos = new Set()

  for (const p of productos) {
    const url = primeraFoto(p.fotos)
    if (!url) continue
    const horizontal = orientaciones.get(p.id) === 'h'
    const clave = `${horizontal ? 'h' : 'v'}|${url}`
    if (vistos.has(clave)) continue
    vistos.add(clave)
    tareas.push({ clave, url, horizontal })
  }

  const cache = new Map()
  let siguiente = 0
  async function trabajador() {
    while (siguiente < tareas.length) {
      const { clave, url, horizontal } = tareas[siguiente++]
      try {
        const img = await cargarImagen(url)
        cache.set(clave, normalizar(img, horizontal ? FOTO_H : FOTO_V))
      } catch {
        cache.set(clave, horizontal ? marca.placeholderH : marca.placeholderV)
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCIA, tareas.length) }, trabajador),
  )

  const porProducto = new Map()
  for (const p of productos) {
    const url = primeraFoto(p.fotos)
    const horizontal = orientaciones.get(p.id) === 'h'
    const respaldo = horizontal ? marca.placeholderH : marca.placeholderV
    porProducto.set(p.id, (url && cache.get(`${horizontal ? 'h' : 'v'}|${url}`)) || respaldo)
  }
  return porProducto
}

// ── Contenido de la ficha ───────────────────────────────────────────────
function lineaMeta(producto) {
  const n = Number(producto.existencias)
  const partes = []
  if (producto.talla) partes.push(String(producto.talla))
  partes.push(`${n} ${n === 1 ? 'disponible' : 'disponibles'}`)
  const material = String(producto.material ?? '').trim()
  if (material) partes.push(material)
  return partes.join(' · ')
}

function recortar(lineas, maximo) {
  if (lineas.length <= maximo) return lineas
  const cortadas = lineas.slice(0, maximo)
  cortadas[maximo - 1] = `${cortadas[maximo - 1].replace(/\s+\S*$/, '')}…`
  return cortadas
}

/** Mide el bloque de texto de una ficha al ancho que le toque. */
function medir(doc, producto, ancho) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PT_NOMBRE)
  const nombre = recortar(
    doc.splitTextToSize(String(producto.nombre ?? ''), ancho),
    MAX_LINEAS_NOMBRE,
  )

  doc.setFontSize(PT_META)
  const meta = recortar(doc.splitTextToSize(lineaMeta(producto), ancho), MAX_LINEAS_META)

  let descripcion = []
  const texto = String(producto.descripcion ?? '').trim()
  if (texto) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(PT_DESC)
    descripcion = recortar(doc.splitTextToSize(texto, ancho), MAX_LINEAS_DESC)
    doc.setFont('helvetica', 'normal')
  }

  let alto = GAP_IMG_TEXTO + nombre.length * lh(PT_NOMBRE)
  alto += GAP_NOMBRE_PRECIO + lh(PT_PRECIO)
  alto += GAP_PRECIO_SKU + lh(PT_SKU)
  alto += GAP_SKU_META + meta.length * lh(PT_META)
  if (descripcion.length) alto += GAP_META_DESC + descripcion.length * lh(PT_DESC)

  return { nombre, meta, descripcion, alto }
}

// ── Dibujo ──────────────────────────────────────────────────────────────
function dibujarFondo(doc, color) {
  doc.setFillColor(...color)
  doc.rect(0, 0, PAGINA.w, PAGINA.h, 'F')
}

/** Portada: negra, lockup centrado, y el gancho del SKU. */
function dibujarPortada(doc, marca, fechaTexto, totalPiezas) {
  dibujarFondo(doc, NEGRO_PORTADA)

  const lado = 74
  if (marca.lockup) {
    doc.addImage(marca.lockup, 'JPEG', (PAGINA.w - lado) / 2, 74, lado, lado)
  } else if (marca.sello) {
    doc.addImage(marca.sello, 'JPEG', (PAGINA.w - 40) / 2, 90, 40, 40)
  }

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...HUESO)
  doc.setFontSize(17)
  doc.text('CATÁLOGO', PAGINA.w / 2, 178, { align: 'center', charSpace: 3.4 })

  doc.setFontSize(8.5)
  doc.setTextColor(190, 184, 175)
  doc.text(fechaTexto, PAGINA.w / 2, 190, { align: 'center', charSpace: 0.5 })
  doc.text(
    `${totalPiezas} ${totalPiezas === 1 ? 'pieza' : 'piezas'}`,
    PAGINA.w / 2,
    197.5,
    { align: 'center', charSpace: 0.5 },
  )

  doc.setFontSize(8)
  doc.setTextColor(150, 145, 138)
  doc.text('Pide con el código de la pieza', PAGINA.w / 2, 250, {
    align: 'center',
    charSpace: 0.4,
  })
  doc.text(CONTACTO, PAGINA.w / 2, 258, { align: 'center', charSpace: 0.4 })
}

/** Membrete ligero de las páginas de contenido: sin filete. */
function dibujarMembrete(doc, marca, fechaTexto) {
  if (marca.sello) {
    doc.addImage(marca.sello, 'JPEG', MARGEN, 12, 9, 9)
  } else {
    doc.setFillColor(...NEGRO)
    doc.rect(MARGEN, 12, 9, 9, 'F')
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TINTA)
  doc.text('VOOJ', MARGEN + 12.5, 18.6, { charSpace: 1.2 })

  doc.setFontSize(7)
  doc.setTextColor(...GRIS_CLARO)
  doc.text(fechaTexto, PAGINA.w - MARGEN, 18.6, { align: 'right' })
}

function dibujarPies(doc) {
  const total = doc.getNumberOfPages()
  for (let i = 2; i <= total; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...GRIS_CLARO)
    doc.text('VOOJ · Boutique de moda', MARGEN, PIE_Y)
    doc.text(CONTACTO, PAGINA.w / 2, PIE_Y, { align: 'center' })
    doc.text(`${i} / ${total}`, PAGINA.w - MARGEN, PIE_Y, { align: 'right' })
  }
}

/** Encabezado de categoría: sin filete — mayúsculas + conteo discreto. */
function dibujarSeccion(doc, categoria, piezas, yTop) {
  const base = yTop + ALTO_TITULO
  const texto = String(categoria).toUpperCase()
  const charSpace = 1.2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PT_SECCION)
  doc.setTextColor(...TINTA)
  doc.text(texto, MARGEN, base, { charSpace })

  const ancho = doc.getTextWidth(texto) + texto.length * charSpace
  doc.setFontSize(PT_META)
  doc.setTextColor(...GRIS_TENUE)
  doc.text(
    `${piezas} ${piezas === 1 ? 'pieza' : 'piezas'}`,
    MARGEN + ancho + 4,
    base,
  )

  return base + GAP_TITULO_FILA
}

function dibujarProducto(doc, producto, x, y, ancho, altoImg, foto, medida) {
  if (foto) {
    doc.addImage(foto, 'JPEG', x, y, ancho, altoImg)
  } else {
    doc.setFillColor(...NEGRO)
    doc.rect(x, y, ancho, altoImg, 'F')
  }

  let ty = y + altoImg + GAP_IMG_TEXTO

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PT_NOMBRE)
  doc.setTextColor(...TINTA)
  doc.text(medida.nombre, x, ty)
  ty += medida.nombre.length * lh(PT_NOMBRE)

  ty += GAP_NOMBRE_PRECIO
  doc.setFontSize(PT_PRECIO)
  doc.setTextColor(...GRIS)
  doc.text(formatPrecioMXN(producto.precio), x, ty)
  ty += lh(PT_PRECIO)

  // SKU en monoespaciada: es el código que se copia al pedir.
  ty += GAP_PRECIO_SKU
  doc.setFont('courier', 'normal')
  doc.setFontSize(PT_SKU)
  doc.setTextColor(...GRIS)
  doc.text(String(producto.sku ?? ''), x, ty)
  ty += lh(PT_SKU)

  ty += GAP_SKU_META
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PT_META)
  doc.setTextColor(...GRIS_CLARO)
  doc.text(medida.meta, x, ty)
  ty += medida.meta.length * lh(PT_META)

  if (medida.descripcion.length) {
    ty += GAP_META_DESC
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(PT_DESC)
    doc.setTextColor(...GRIS_TENUE)
    doc.text(medida.descripcion, x, ty)
    doc.setFont('helvetica', 'normal')
  }
}

// ── Layout ──────────────────────────────────────────────────────────────
function agruparPorCategoria(productos) {
  const grupos = new Map()
  for (const p of productos) {
    const categoria = String(p.categoria ?? '').trim() || 'Sin categoría'
    if (!grupos.has(categoria)) grupos.set(categoria, [])
    grupos.get(categoria).push(p)
  }
  return [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'))
}

/**
 * Filas de una categoría. La última fila se adapta para no dejar columnas
 * vacías: si sobra 1 pieza va ancha y apaisada (a 2 columnas, centrada);
 * si sobran 2, van a ancho normal centradas en la fila.
 */
function filasDeCategoria(items) {
  const filas = []
  let i = 0
  while (i < items.length) {
    const restantes = items.length - i
    if (restantes >= COLS) {
      filas.push({ tipo: 'normal', items: items.slice(i, i + COLS) })
      i += COLS
    } else if (restantes === 2) {
      filas.push({ tipo: 'dos', items: items.slice(i, i + 2) })
      i += 2
    } else {
      filas.push({ tipo: 'ancha', items: items.slice(i, i + 1) })
      i += 1
    }
  }
  return filas
}

function geometriaFila(fila) {
  if (fila.tipo === 'ancha') {
    return {
      ancho: ANCHA_W,
      altoImg: ANCHA_H,
      xs: [MARGEN + (CONTENIDO_W - ANCHA_W) / 2],
    }
  }
  if (fila.tipo === 'dos') {
    const total = CELDA_W * 2 + GUTTER
    const x0 = MARGEN + (CONTENIDO_W - total) / 2
    return { ancho: CELDA_W, altoImg: IMG_H, xs: [x0, x0 + CELDA_W + GUTTER] }
  }
  return {
    ancho: CELDA_W,
    altoImg: IMG_H,
    xs: [0, 1, 2].map((c) => MARGEN + c * (CELDA_W + GUTTER)),
  }
}

// ── API ─────────────────────────────────────────────────────────────────
export { exportablesAPdf }

export function nombreArchivoPdf(fecha = new Date()) {
  const dd = (n) => String(n).padStart(2, '0')
  return `vooj-catalogo-${fecha.getFullYear()}-${dd(fecha.getMonth() + 1)}-${dd(fecha.getDate())}.pdf`
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

  const marca = await prepararMarca()
  const fechaTexto = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  dibujarPortada(doc, marca, fechaTexto, lista.length)

  if (lista.length === 0) {
    doc.addPage()
    dibujarFondo(doc, HUESO)
    dibujarMembrete(doc, marca, fechaTexto)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...GRIS)
    doc.text('No hay piezas con existencias para exportar.', PAGINA.w / 2, 120, {
      align: 'center',
    })
    dibujarPies(doc)
    return doc
  }

  // 1) Plan de layout — define qué fotos van apaisadas antes de descargarlas.
  const grupos = agruparPorCategoria(lista)
  const plan = grupos.map(([categoria, items]) => ({
    categoria,
    piezas: items.length,
    filas: filasDeCategoria(items),
  }))

  const orientaciones = new Map()
  for (const seccion of plan) {
    for (const fila of seccion.filas) {
      for (const p of fila.items) {
        orientaciones.set(p.id, fila.tipo === 'ancha' ? 'h' : 'v')
      }
    }
  }

  const fotos = await prepararFotos(lista, orientaciones, marca)

  // 2) Dibujo
  const abrirPagina = () => {
    doc.addPage()
    dibujarFondo(doc, HUESO)
    dibujarMembrete(doc, marca, fechaTexto)
    return CUERPO_Y
  }

  let y = abrirPagina()

  for (const seccion of plan) {
    const primeraFila = seccion.filas[0]
    const g0 = geometriaFila(primeraFila)
    const m0 = primeraFila.items.map((p) => medir(doc, p, g0.ancho))
    const altoPrimera = g0.altoImg + Math.max(...m0.map((m) => m.alto))

    // Nunca dejar el título de sección huérfano al pie.
    if (y + ALTO_TITULO + GAP_TITULO_FILA + altoPrimera > LIMITE_INFERIOR) {
      y = abrirPagina()
    }
    y = dibujarSeccion(doc, seccion.categoria, seccion.piezas, y)

    for (const fila of seccion.filas) {
      const g = geometriaFila(fila)
      const medidas = fila.items.map((p) => medir(doc, p, g.ancho))
      const altoFila = g.altoImg + Math.max(...medidas.map((m) => m.alto))

      if (y + altoFila > LIMITE_INFERIOR) {
        y = abrirPagina()
        y = dibujarSeccion(doc, seccion.categoria, seccion.piezas, y)
      }

      fila.items.forEach((producto, i) => {
        dibujarProducto(
          doc,
          producto,
          g.xs[i],
          y,
          g.ancho,
          g.altoImg,
          fotos.get(producto.id),
          medidas[i],
        )
      })

      y += altoFila + GAP_FILA
    }

    y += GAP_SECCION - GAP_FILA
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
