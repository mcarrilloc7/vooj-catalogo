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
  // La portada ya no usa el JPEG del lockup: se dibuja vectorial.
  try {
    const marca = await cargarImagen('/logo-vooj-mark.png')
    return {
      sello: normalizar(marca, { ...SELLO_PX, contener: true }),
      placeholderV: normalizar(marca, { ...FOTO_V, contener: true }),
      placeholderH: normalizar(marca, { ...FOTO_H, contener: true }),
    }
  } catch {
    return { sello: null, placeholderV: null, placeholderH: null }
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

/** Arco como polilínea: jsPDF no trae primitiva de arco. */
function arco(doc, cx, cy, r, a0, a1, pasos = 40) {
  const puntos = []
  for (let i = 0; i <= pasos; i++) {
    const a = a0 + ((a1 - a0) * i) / pasos
    puntos.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  const relativos = []
  for (let i = 1; i < puntos.length; i++) {
    relativos.push([
      puntos[i][0] - puntos[i - 1][0],
      puntos[i][1] - puntos[i - 1][1],
    ])
  }
  doc.lines(relativos, puntos[0][0], puntos[0][1], [1, 1], 'S', false)
}

/**
 * Los dos aros entrelazados del monograma, dibujados como vectores —
 * nítidos a cualquier tamaño, sin depender de un bitmap.
 *
 * Entrelazado: se trazan los dos aros (el derecho queda encima en ambos
 * cruces); luego, en el cruce superior, se BORRA con el color de fondo un
 * arco corto siguiendo el trazo del izquierdo y se repinta ese arco. Así
 * el izquierdo pasa por encima arriba y el derecho por encima abajo.
 * Repintar sin borrar antes no se nota: los dos trazos son del mismo color.
 */
function dibujarAros(doc, cx, cy, r, color, fondo) {
  const separacion = r * 1.35
  const grosor = r * 0.15

  doc.setLineCap('round')
  doc.setDrawColor(...color)
  doc.setLineWidth(grosor)

  const izq = cx - separacion / 2
  const der = cx + separacion / 2

  doc.circle(izq, cy, r, 'S')
  doc.circle(der, cy, r, 'S')

  // Cruce superior: en jsPDF la Y crece hacia abajo, de ahí el negativo.
  const h = Math.sqrt(Math.max(r * r - (separacion / 2) ** 2, 0))
  const angulo = Math.atan2(-h, separacion / 2)
  const span = (grosor * 1.6) / r

  doc.setDrawColor(...fondo)
  doc.setLineWidth(grosor * 2.4)
  arco(doc, izq, cy, r, angulo - span, angulo + span)

  doc.setDrawColor(...color)
  doc.setLineWidth(grosor)
  arco(doc, izq, cy, r, angulo - span, angulo + span)

  doc.setLineCap('butt')
}

/** Texto centrado de verdad: getTextWidth no cuenta el charSpace. */
function textoCentrado(doc, texto, y, { pt, charSpace = 0, color, fuente = 'helvetica', estilo = 'normal' }) {
  doc.setFont(fuente, estilo)
  doc.setFontSize(pt)
  doc.setTextColor(...color)
  const ancho =
    doc.getTextWidth(texto) + Math.max(texto.length - 1, 0) * charSpace
  doc.text(texto, (PAGINA.w - ancho) / 2, y, { charSpace })
}

/**
 * Portada: composición vertical centrada en la página (horizontal y
 * verticalmente). El monograma va vectorial — nítido a cualquier tamaño.
 */
function dibujarPortada(doc, fechaTexto, totalPiezas) {
  dibujarFondo(doc, NEGRO_PORTADA)

  const R_AROS = 13
  const altoDe = (pt) => pt * 0.72 * MM_POR_PT // alto visual de mayúsculas

  const H_VOOJ = altoDe(26)
  const H_TAG = altoDe(7.5)
  const H_TITULO = altoDe(15)
  const H_DATO = altoDe(8.5)
  const H_PIE = altoDe(8)
  const GROSOR_FILETE = 0.3

  const G = {
    arosVooj: 15,
    voojFilete: 5,
    fileteTag: 5.5,
    tagTitulo: 28,
    tituloFecha: 9,
    fechaPiezas: 5.5,
    piezasCta: 30,
    ctaContacto: 6,
  }

  const alturaTotal =
    R_AROS * 2 + G.arosVooj +
    H_VOOJ + G.voojFilete + GROSOR_FILETE + G.fileteTag +
    H_TAG + G.tagTitulo +
    H_TITULO + G.tituloFecha +
    H_DATO + G.fechaPiezas + H_DATO + G.piezasCta +
    H_PIE + G.ctaContacto + H_PIE

  let y = (PAGINA.h - alturaTotal) / 2

  // Monograma vectorial
  dibujarAros(doc, PAGINA.w / 2, y + R_AROS, R_AROS, HUESO, NEGRO_PORTADA)
  y += R_AROS * 2 + G.arosVooj

  y += H_VOOJ
  textoCentrado(doc, 'VOOJ', y, { pt: 26, charSpace: 6, color: HUESO })
  y += G.voojFilete

  const anchoFilete = 48
  doc.setDrawColor(...HUESO)
  doc.setLineWidth(GROSOR_FILETE)
  doc.line((PAGINA.w - anchoFilete) / 2, y, (PAGINA.w + anchoFilete) / 2, y)
  y += GROSOR_FILETE + G.fileteTag

  y += H_TAG
  textoCentrado(doc, 'BOUTIQUE DE MODA', y, {
    pt: 7.5,
    charSpace: 2.6,
    color: [200, 194, 185],
  })
  y += G.tagTitulo

  y += H_TITULO
  textoCentrado(doc, 'CATÁLOGO', y, { pt: 15, charSpace: 3.4, color: HUESO })
  y += G.tituloFecha

  y += H_DATO
  textoCentrado(doc, fechaTexto, y, {
    pt: 8.5,
    charSpace: 0.5,
    color: [186, 180, 171],
  })
  y += G.fechaPiezas

  y += H_DATO
  textoCentrado(
    doc,
    `${totalPiezas} ${totalPiezas === 1 ? 'pieza' : 'piezas'}`,
    y,
    { pt: 8.5, charSpace: 0.5, color: [186, 180, 171] },
  )
  y += G.piezasCta

  y += H_PIE
  textoCentrado(doc, 'Pide con el código de la pieza', y, {
    pt: 8,
    charSpace: 0.4,
    color: [150, 145, 138],
  })
  y += G.ctaContacto

  y += H_PIE
  textoCentrado(doc, CONTACTO, y, {
    pt: 8,
    charSpace: 0.4,
    color: [150, 145, 138],
  })
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

  dibujarPortada(doc, fechaTexto, lista.length)

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
