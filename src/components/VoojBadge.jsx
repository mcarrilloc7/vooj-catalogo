/**
 * Logo VOOJ — imagen real (/logo-vooj.jpg).
 *
 * El archivo ya trae su propio fondo negro sólido y el lockup completo
 * (wordmark + "Boutique de moda"), así que se usa tal cual, sin envolverlo
 * en otro contenedor negro. El `bg-vooj-black` solo cubre el instante de
 * carga y el letterbox de object-contain (invisible: mismo negro).
 *
 * El tamaño se controla con `className` en cada lugar de uso
 * (ej. "h-10 w-10" en el header, "w-full max-w-[440px]" en la home).
 */
export default function VoojBadge({
  className = '',
  alt = 'VOOJ — Boutique de moda',
  ...props
}) {
  return (
    <img
      src="/logo-vooj.jpg"
      alt={alt}
      draggable={false}
      className={`block select-none object-contain bg-vooj-black ${className}`}
      {...props}
    />
  )
}
