/**
 * Slides del carrusel de la home. Para agregar o editar uno:
 *
 *  - imagen: ruta a una imagen en /public (ej. '/banners/verano.jpg').
 *            null  ->  usa el panel oscuro con el sello VOOJ (placeholder).
 *  - titulo: texto corto y grande.
 *  - texto:  una línea de apoyo (opcional).
 *  - cta:    texto del botón.
 *  - href:   destino. Puede llevar filtro de categoría:
 *            '/catalogo'  ó  '/catalogo?categoria=Blusas'
 *
 * El carrusel se auto-adapta: con 1 slide no muestra flechas ni puntos.
 */
export const banners = [
  {
    id: 'nueva-coleccion',
    imagen: null,
    titulo: 'Nueva colección',
    texto: 'Piezas de temporada, en cantidades cortas.',
    cta: 'Ver el catálogo',
    href: '/catalogo',
  },
  {
    id: 'destacado-blusas',
    imagen: null,
    titulo: 'Blusas',
    texto: 'Lo esencial, con carácter.',
    cta: 'Ver blusas',
    href: '/catalogo?categoria=Blusas',
  },
]
