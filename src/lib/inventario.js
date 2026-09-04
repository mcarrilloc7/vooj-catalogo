/**
 * Regla única de qué entra al PDF del catálogo.
 *
 * No basta con `disponible`: si a alguien se le olvida bajar el flag de una
 * pieza que ya se agotó, el PDF mentiría. Se exige además existencias > 0,
 * así el documento siempre refleja lo que de verdad hay en inventario.
 *
 * Vive aparte de pdfCatalogo.js para que el panel pueda contar las piezas
 * sin arrastrar jsPDF al bundle.
 */
export function exportablesAPdf(productos) {
  return (productos ?? []).filter(
    (p) => p.disponible && Number(p.existencias) > 0,
  )
}
