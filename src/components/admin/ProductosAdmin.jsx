import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { formatPrecioMXN } from '../../lib/format.js'
import { eliminarFotos } from '../../lib/fotos.js'
import ProductoForm from './ProductoForm.jsx'

const COLUMNAS = 'id, nombre, descripcion, precio, categoria, talla, existencias, disponible, fotos, actualizado_en'

export default function ProductosAdmin() {
  const [estado, setEstado] = useState('cargando') // 'cargando' | 'ok' | 'error'
  const [productos, setProductos] = useState([])
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const recargar = useCallback(async () => {
    setEstado('cargando')
    const { data, error } = await supabase
      .from('productos')
      .select(COLUMNAS)
      .order('actualizado_en', { ascending: false })

    if (error) {
      console.error('[admin] error al cargar productos:', error)
      setEstado('error')
      return
    }
    setProductos(data ?? [])
    setEstado('ok')
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  async function handleCrear(payload) {
    setGuardando(true)
    setAviso('')
    const { error } = await supabase.from('productos').insert(payload)
    setGuardando(false)
    if (error) {
      console.error('[admin] error al crear producto:', error)
      setAviso('No se pudo guardar el producto. Inténtalo de nuevo.')
      return false
    }
    setAviso('Producto agregado.')
    recargar()
    return true
  }

  async function handleActualizar(payload) {
    if (!editando) return false
    setGuardando(true)
    setAviso('')
    const { error } = await supabase
      .from('productos')
      .update(payload)
      .eq('id', editando.id)
    setGuardando(false)
    if (error) {
      console.error('[admin] error al actualizar producto:', error)
      setAviso('No se pudieron guardar los cambios. Inténtalo de nuevo.')
      return false
    }
    setAviso('Cambios guardados.')
    setEditando(null)
    recargar()
    return true
  }

  async function handleEliminar(producto) {
    const ok = window.confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)
    if (!ok) return

    setAviso('')
    const { error } = await supabase.from('productos').delete().eq('id', producto.id)
    if (error) {
      console.error('[admin] error al eliminar producto:', error)
      setAviso('No se pudo eliminar el producto. Inténtalo de nuevo.')
      return
    }
    // Limpiar sus fotos del bucket (best-effort).
    eliminarFotos(producto.fotos)
    if (editando?.id === producto.id) setEditando(null)
    setAviso('Producto eliminado.')
    recargar()
  }

  return (
    <div className="space-y-10">
      <header className="flex items-baseline justify-between">
        <h1 className="vooj-wordmark text-2xl sm:text-3xl">Productos</h1>
        <span className="vooj-eyebrow text-vooj-bone/40">
          {estado === 'ok' ? `${productos.length} en total` : ''}
        </span>
      </header>

      {aviso && (
        <p className="vooj-eyebrow text-vooj-bone/60 border-l border-vooj-bone/30 pl-3">
          {aviso}
        </p>
      )}

      <ProductoForm
        key={editando ? editando.id : 'nuevo'}
        inicial={editando}
        guardando={guardando}
        onGuardar={editando ? handleActualizar : handleCrear}
        onCancelar={() => setEditando(null)}
      />

      <section>
        {estado === 'cargando' && (
          <p className="vooj-eyebrow text-vooj-bone/40 py-8">Cargando productos…</p>
        )}

        {estado === 'error' && (
          <div className="py-8">
            <p className="vooj-eyebrow text-vooj-bone/60">
              No pudimos cargar los productos.
            </p>
            <button onClick={recargar} className="vooj-btn mt-4">
              Reintentar
            </button>
          </div>
        )}

        {estado === 'ok' && productos.length === 0 && (
          <p className="vooj-eyebrow text-vooj-bone/40 py-8">
            Aún no hay productos. Crea el primero con el formulario de arriba.
          </p>
        )}

        {estado === 'ok' && productos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-vooj-bone/15 text-left">
                  <th className="py-3 pr-4 vooj-eyebrow text-vooj-bone/40 font-light">Nombre</th>
                  <th className="py-3 pr-4 vooj-eyebrow text-vooj-bone/40 font-light">Categoría</th>
                  <th className="py-3 pr-4 vooj-eyebrow text-vooj-bone/40 font-light">Precio</th>
                  <th className="py-3 pr-4 vooj-eyebrow text-vooj-bone/40 font-light">Talla</th>
                  <th className="py-3 pr-4 vooj-eyebrow text-vooj-bone/40 font-light">Exist.</th>
                  <th className="py-3 pr-4 vooj-eyebrow text-vooj-bone/40 font-light">Fotos</th>
                  <th className="py-3 pr-4 vooj-eyebrow text-vooj-bone/40 font-light">Estado</th>
                  <th className="py-3 vooj-eyebrow text-vooj-bone/40 font-light text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-vooj-bone/10 ${
                      editando?.id === p.id ? 'bg-vooj-bone/[0.04]' : ''
                    }`}
                  >
                    <td className="py-3 pr-4 text-vooj-bone/90">{p.nombre}</td>
                    <td className="py-3 pr-4 text-vooj-bone/60">{p.categoria}</td>
                    <td className="py-3 pr-4 text-vooj-bone/60">{formatPrecioMXN(p.precio)}</td>
                    <td className="py-3 pr-4 text-vooj-bone/60">{p.talla || '—'}</td>
                    <td className="py-3 pr-4 text-vooj-bone/60">{p.existencias}</td>
                    <td className="py-3 pr-4 text-vooj-bone/60">{p.fotos?.length || 0}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`vooj-eyebrow ${
                          p.disponible ? 'text-vooj-bone/70' : 'text-vooj-bone/30'
                        }`}
                      >
                        {p.disponible ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditando(p)
                          setAviso('')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="vooj-btn-plain"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(p)}
                        className="vooj-btn-plain hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
