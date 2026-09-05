/**
 * Slides del carrusel de la home. Para agregar o editar uno:
 *
 *  - imagen:  ruta a una imagen en /public (ej. '/banners/verano.jpg').
 *             null  ->  usa el panel oscuro con el sello VOOJ (placeholder).
 *  - eyebrow: etiqueta corta en mayúsculas, arriba del título.
 *  - titulo:  dos o tres palabras, con gancho.
 *  - texto:   una línea de apoyo (opcional).
 *  - cta:     texto del botón.
 *  - href:    destino. Puede llevar filtro de categoría:
 *             '/catalogo'  ó  '/catalogo?categoria=Blusas'
 *
 * El carrusel se auto-adapta: con 1 slide no muestra flechas ni puntos.
 *
 * Nota de tono: boutique, no fast fashion. Nada de descuentos ni urgencias
 * inventadas — sólo lo que de verdad ofrece VOOJ.
 */
export const banners = [
  {
    id: 'nueva-coleccion',
    imagen: null,
    eyebrow: 'Nueva colección',
    titulo: 'La pieza justa',
    texto:
      'Elegimos pocas prendas por temporada para que cada una tenga su lugar.',
    cta: 'Ver la colección',
    href: '/catalogo',
  },
  {
    id: 'destacado-blusas',
    imagen: null,
    eyebrow: 'Esenciales',
    titulo: 'Blusas de diario',
    texto: 'Cortes limpios en lino, algodón y satén, para todos los días.',
    cta: 'Ver blusas',
    href: '/catalogo?categoria=Blusas',
  },
]
