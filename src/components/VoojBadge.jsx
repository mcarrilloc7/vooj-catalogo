/**
 * Sello de marca VOOJ. SIEMPRE oscuro (fondo vooj-black, texto vooj-bone),
 * sin importar la paleta clara del resto del sitio. No invertir.
 *
 * El tamaño se controla con `className` (ej. "text-lg", "text-7xl px-8 py-4");
 * el texto hereda el font-size del contenedor.
 */
export default function VoojBadge({ className = '', ...props }) {
  return (
    <span
      className={`inline-flex items-center bg-vooj-black px-3 py-2 leading-none ${className}`}
      {...props}
    >
      <span className="font-sans font-medium uppercase tracking-wordmark text-vooj-bone -mr-[0.35em]">
        VOOJ
      </span>
    </span>
  )
}
