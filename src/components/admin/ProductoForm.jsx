import { useEffect, useMemo, useState } from 'react'
import { fotoPublicUrl } from '../../lib/format.js'
import { subirFoto, eliminarFotos, validarImagen } from '../../lib/fotos.js'

const VACIO = {
  nombre: '',
  descripcion: '',
  precio: '',
  precio_oferta: '',
  categoria: '',
  coleccion: '',
  material: '',
  color: '',
  talla: '',
  existencias: '',
  disponible: true,
}

function desdeProducto(p) {
  if (!p) return VACIO
  return {
    nombre: p.nombre ?? '',
    descripcion: p.descripcion ?? '',
    precio: p.precio ?? '',
    precio_oferta: p.precio_oferta ?? '',
    categoria: p.categoria ?? '',
    coleccion: p.coleccion ?? '',
    material: p.material ?? '',
    color: p.color ?? '',
    talla: p.talla ?? '',
    existencias: p.existencias ?? '',
    disponible: p.disponible ?? true,
  }
}

function Miniatura({ src, onQuitar }) {
  return (
    <div className="relative aspect-[3/4] border border-vooj-ink/20 overflow-hidden bg-vooj-black">
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onQuitar}
        title="Quitar"
        className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center
          bg-vooj-black/70 text-vooj-bone/80 text-xs hover:bg-vooj-black hover:text-vooj-bone"
      >
        ✕
      </button>
    </div>
  )
}

/**
 * Formulario de alta / edición de producto, con fotos.
 * props:
 *  - inicial: producto a editar, o null para alta
 *  - onGuardar(payload) -> Promise<boolean>: true si se guardó bien
 *  - onCancelar(): solo en modo edición
 *  - guardando: bool (operación de base de datos en curso, la controla el padre)
 */
export default function ProductoForm({ inicial, onGuardar, onCancelar, guardando }) {
  const editando = Boolean(inicial)
  const [form, setForm] = useState(() => desdeProducto(inicial))
  const [fotos, setFotos] = useState(() => inicial?.fotos ?? []) // rutas ya guardadas
  const [nuevas, setNuevas] = useState([]) // File[] pendientes de subir
  const [aEliminar, setAEliminar] = useState([]) // rutas quitadas al editar
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  // Previsualización de los archivos nuevos (object URLs); se revocan al cambiar.
  const previews = useMemo(
    () => nuevas.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [nuevas],
  )
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url))
  }, [previews])

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function agregarArchivos(e) {
    const elegidos = Array.from(e.target.files ?? [])
    e.target.value = '' // permite volver a elegir el mismo archivo
    for (const file of elegidos) {
      const err = validarImagen(file)
      if (err) {
        setError(err)
        return
      }
    }
    setError('')
    setNuevas((n) => [...n, ...elegidos])
  }

  function quitarFotoExistente(ruta) {
    setFotos((f) => f.filter((r) => r !== ruta))
    setAEliminar((a) => [...a, ruta])
  }

  function quitarNueva(file) {
    setNuevas((n) => n.filter((f) => f !== file))
  }

  function limpiar() {
    setForm(VACIO)
    setFotos([])
    setNuevas([])
    setAEliminar([])
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    const nombre = form.nombre.trim()
    const categoria = form.categoria.trim()
    const precio = Number(form.precio)
    const existencias = Number(form.existencias)
    // form.precio_oferta puede llegar como number (valor original de la
    // fila, si no se tocó el campo al editar) o como string (lo que sea
    // que haya escrito el usuario) — String() normaliza antes de .trim().
    const hayOferta = String(form.precio_oferta).trim() !== ''
    const precioOferta = hayOferta ? Number(form.precio_oferta) : null

    if (!nombre || !categoria) {
      setError('Nombre y categoría son obligatorios.')
      return
    }
    if (!Number.isFinite(precio) || precio < 0) {
      setError('El precio debe ser un número válido.')
      return
    }
    if (!Number.isInteger(existencias) || existencias < 0) {
      setError('Las existencias deben ser un número entero (0 o más).')
      return
    }
    if (hayOferta && (!Number.isFinite(precioOferta) || precioOferta < 0)) {
      setError('El precio de oferta debe ser un número válido.')
      return
    }
    if (hayOferta && precioOferta >= precio) {
      setError('El precio de oferta debe ser menor al precio normal.')
      return
    }

    setSubiendo(true)
    let subidas = []
    try {
      subidas = await Promise.all(nuevas.map((file) => subirFoto(file)))
    } catch (err) {
      console.error('[form] error al subir fotos:', err)
      setSubiendo(false)
      setError('No se pudieron subir las fotos. Inténtalo de nuevo.')
      return
    }

    const ok = await onGuardar({
      nombre,
      descripcion: form.descripcion.trim() || null,
      precio,
      precio_oferta: precioOferta,
      categoria,
      coleccion: form.coleccion.trim() || null,
      material: form.material.trim() || null,
      color: form.color.trim() || null,
      talla: form.talla.trim() || null,
      existencias,
      disponible: Boolean(form.disponible),
      fotos: [...fotos, ...subidas],
    })

    if (ok) {
      // Recién ahora borramos del bucket las fotos que se quitaron.
      eliminarFotos(aEliminar)
      setAEliminar([])
      setNuevas([])
      if (!editando) limpiar()
    } else {
      // El guardado falló: las fotos recién subidas quedarían huérfanas.
      eliminarFotos(subidas)
    }
    setSubiendo(false)
  }

  const ocupado = guardando || subiendo

  return (
    <form
      onSubmit={onSubmit}
      className="border border-vooj-ink/15 p-6 grid gap-4 sm:grid-cols-2"
    >
      <div className="sm:col-span-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="vooj-eyebrow text-vooj-ink/75">
          {editando ? `Editando: ${inicial.nombre}` : 'Nuevo producto'}
        </p>
        {/* El SKU se genera solo en la base; aquí sólo se consulta. */}
        <p className="vooj-meta font-mono">
          {editando ? inicial.sku : 'SKU automático al guardar'}
        </p>
      </div>

      <div className="sm:col-span-2">
        <label className="vooj-label" htmlFor="f-nombre">Nombre</label>
        <input
          id="f-nombre"
          className="vooj-input"
          value={form.nombre}
          onChange={(e) => set('nombre', e.target.value)}
        />
      </div>

      <div className="sm:col-span-2">
        <label className="vooj-label" htmlFor="f-descripcion">Descripción</label>
        <textarea
          id="f-descripcion"
          rows={2}
          className="vooj-input resize-y"
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
        />
      </div>

      <div>
        <label className="vooj-label" htmlFor="f-precio">Precio (MXN)</label>
        <input
          id="f-precio"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          className="vooj-input"
          value={form.precio}
          onChange={(e) => set('precio', e.target.value)}
        />
      </div>

      <div>
        <label className="vooj-label" htmlFor="f-precio-oferta">
          Precio de oferta (opcional)
        </label>
        <input
          id="f-precio-oferta"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          className="vooj-input"
          value={form.precio_oferta}
          onChange={(e) => set('precio_oferta', e.target.value)}
        />
        <p className="mt-1.5 text-[0.7rem] text-vooj-ink/45 tracking-wide2">
          Si se llena, debe ser menor al precio normal
        </p>
      </div>

      <div>
        <label className="vooj-label" htmlFor="f-categoria">Categoría</label>
        <input
          id="f-categoria"
          className="vooj-input"
          value={form.categoria}
          onChange={(e) => set('categoria', e.target.value)}
        />
      </div>

      <div>
        <label className="vooj-label" htmlFor="f-coleccion">Colección (opcional)</label>
        <input
          id="f-coleccion"
          className="vooj-input"
          placeholder="Primavera 2026…"
          value={form.coleccion}
          onChange={(e) => set('coleccion', e.target.value)}
        />
      </div>

      <div>
        <label className="vooj-label" htmlFor="f-material">Material (opcional)</label>
        <input
          id="f-material"
          className="vooj-input"
          placeholder="Algodón, lino…"
          value={form.material}
          onChange={(e) => set('material', e.target.value)}
        />
      </div>

      <div>
        <label className="vooj-label" htmlFor="f-color">Color (opcional)</label>
        <input
          id="f-color"
          className="vooj-input"
          placeholder="Beige, negro…"
          value={form.color}
          onChange={(e) => set('color', e.target.value)}
        />
      </div>

      <div>
        <label className="vooj-label" htmlFor="f-talla">Talla (opcional)</label>
        <input
          id="f-talla"
          className="vooj-input"
          value={form.talla}
          onChange={(e) => set('talla', e.target.value)}
        />
      </div>

      <div>
        <label className="vooj-label" htmlFor="f-existencias">Existencias</label>
        <input
          id="f-existencias"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          className="vooj-input"
          value={form.existencias}
          onChange={(e) => set('existencias', e.target.value)}
        />
      </div>

      <label className="sm:col-span-2 flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-4 w-4 accent-vooj-ink"
          checked={form.disponible}
          onChange={(e) => set('disponible', e.target.checked)}
        />
        <span className="vooj-eyebrow text-vooj-ink/70">
          Disponible en el catálogo público
        </span>
      </label>

      {/* Fotos */}
      <div className="sm:col-span-2">
        <span className="vooj-label">Fotos</span>

        {(fotos.length > 0 || previews.length > 0) && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
            {fotos.map((ruta) => (
              <Miniatura
                key={ruta}
                src={fotoPublicUrl(ruta)}
                onQuitar={() => quitarFotoExistente(ruta)}
              />
            ))}
            {previews.map(({ file, url }) => (
              <Miniatura
                key={url}
                src={url}
                onQuitar={() => quitarNueva(file)}
              />
            ))}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={agregarArchivos}
          disabled={ocupado}
          className="block w-full text-xs text-vooj-ink/60
            file:mr-3 file:border file:border-vooj-ink/30 file:bg-transparent
            file:px-3 file:py-2 file:text-vooj-ink/75 file:vooj-eyebrow
            hover:file:bg-vooj-ink hover:file:text-vooj-bone file:transition-colors"
        />
        <p className="mt-1.5 text-[0.7rem] text-vooj-ink/45 tracking-wide2">
          JPG o PNG · máx 5 MB cada una · se suben al guardar
        </p>
      </div>

      {error && (
        <p className="sm:col-span-2 text-xs text-red-700 tracking-wide2">
          {error}
        </p>
      )}

      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={ocupado} className="vooj-btn">
          {subiendo
            ? 'Subiendo fotos…'
            : guardando
              ? 'Guardando…'
              : editando
                ? 'Guardar cambios'
                : 'Agregar producto'}
        </button>
        {editando && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            className="vooj-btn-plain"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
