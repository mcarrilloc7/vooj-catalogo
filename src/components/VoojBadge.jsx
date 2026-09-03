/**
 * Logo VOOJ como imagen. Dos variantes, ambas con fondo negro sólido propio
 * (no se envuelven en otro contenedor negro):
 *
 *  - variant="full" (default): /logo-vooj.jpg — lockup completo
 *    (wordmark + "Boutique de moda"). Para donde hay espacio: home,
 *    login, tarjeta sin foto del catálogo.
 *  - variant="mark": /logo-vooj-mark.png — sólo el monograma (los anillos
 *    de la "OO"), sin tagline. Para espacios chicos: headers (~48px) y favicon.
 *
 * El tamaño se controla con `className` en cada lugar de uso.
 */
export default function VoojBadge({
  variant = 'full',
  className = '',
  alt = 'VOOJ — Boutique de moda',
  ...props
}) {
  const src = variant === 'mark' ? '/logo-vooj-mark.png' : '/logo-vooj.jpg'
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`block select-none object-contain bg-vooj-black ${className}`}
      {...props}
    />
  )
}
