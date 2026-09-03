import { useState } from 'react'

const VACIO = {
  nombre: '',
  descripcion: '',
  precio: '',
  categoria: '',
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
    categoria: p.categoria ?? '',
    talla: p.talla ?? '',
    existencias: p.existencias ?? '',
    disponible: p.disponible ?? true,
  }
}

/**
 * Formulario de alta / edición de producto. Sin fotos por ahora.
 * props:
 *  - inicial: producto a editar, o null para alta
 *  - onGuardar(payload): recibe el objeto listo para insert/update
 *  - onCancelar(): solo en modo edición
 *  - guardando: bool
 */
export default function ProductoForm({ inicial, onGuardar, onCancelar, guardando }) {
  const editando = Boolean(inicial)
  const [form, setForm] = useState(() => desdeProducto(inicial))
  const [error, setError] = useState('')

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function onSubmit(e) {
    e.preventDefault()
    setError('')

    const nombre = form.nombre.trim()
    const categoria = form.categoria.trim()
    const precio = Number(form.precio)
    const existencias = Number(form.existencias)

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

    onGuardar({
      nombre,
      descripcion: form.descripcion.trim() || null,
      precio,
      categoria,
      talla: form.talla.trim() || null,
      existencias,
      disponible: Boolean(form.disponible),
    })

    if (!editando) setForm(VACIO)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-vooj-bone/10 p-6 grid gap-4 sm:grid-cols-2"
    >
      <p className="sm:col-span-2 vooj-eyebrow text-vooj-bone/70">
        {editando ? `Editando: ${inicial.nombre}` : 'Nuevo producto'}
      </p>

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
        <label className="vooj-label" htmlFor="f-categoria">Categoría</label>
        <input
          id="f-categoria"
          className="vooj-input"
          value={form.categoria}
          onChange={(e) => set('categoria', e.target.value)}
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
          className="h-4 w-4 accent-vooj-bone"
          checked={form.disponible}
          onChange={(e) => set('disponible', e.target.checked)}
        />
        <span className="vooj-eyebrow text-vooj-bone/60">
          Disponible en el catálogo público
        </span>
      </label>

      {error && (
        <p className="sm:col-span-2 text-xs text-red-300/80 tracking-wide2">
          {error}
        </p>
      )}

      <div className="sm:col-span-2 flex items-center gap-3">
        <button type="submit" disabled={guardando} className="vooj-btn">
          {guardando
            ? 'Guardando…'
            : editando
              ? 'Guardar cambios'
              : 'Agregar producto'}
        </button>
        {editando && (
          <button type="button" onClick={onCancelar} className="vooj-btn-plain">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
