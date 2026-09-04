import { useState } from 'react'
import { useAuth } from '../../lib/auth.jsx'
import { exportablesAPdf } from '../../lib/inventario.js'

/**
 * Exporta a PDF las piezas visibles en el catálogo público (disponible = true).
 *
 * Sólo se renderiza si hay sesión CON perfil (dueña o soporte). Vive dentro
 * de /admin, que ya está protegido, pero la comprobación va aquí también
 * para que el botón no pueda acabar en una vista pública por descuido.
 */
export default function BotonExportarPdf({ productos }) {
  const { session, perfil } = useAuth()
  const [estado, setEstado] = useState('listo') // 'listo' | 'generando' | 'error'

  if (!session || !perfil) return null

  // Misma regla que el PDF: visible en el catálogo Y con existencias.
  const exportables = exportablesAPdf(productos)

  async function handleExportar() {
    setEstado('generando')
    try {
      // jsPDF se carga sólo al pulsar: no entra en el bundle público.
      const { exportarCatalogoPdf } = await import('../../lib/pdfCatalogo.js')
      await exportarCatalogoPdf(exportables)
      setEstado('listo')
    } catch (error) {
      console.error('[admin] error al generar el PDF:', error)
      setEstado('error')
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleExportar}
        disabled={estado === 'generando' || exportables.length === 0}
        className="vooj-btn py-2"
      >
        {estado === 'generando' ? 'Generando PDF…' : 'Exportar catálogo a PDF'}
      </button>
      <p className="vooj-meta mt-1.5">
        {estado === 'error'
          ? 'No se pudo generar el PDF. Inténtalo de nuevo.'
          : `${exportables.length} ${
              exportables.length === 1 ? 'pieza' : 'piezas'
            } con existencias`}
      </p>
    </div>
  )
}
