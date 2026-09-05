/**
 * Los 6 paneles de la home: 3 a la izquierda del carrusel, 3 a la derecha
 * (en móvil se apilan debajo). Estilo "bloques de departamento".
 *
 *  - titulo: etiqueta corta.
 *  - sub:    tagline de 3 a 5 palabras (o null).
 *  - href:   destino.
 *            '/catalogo'                     -> todo, ordenado por lo más reciente
 *            '/catalogo?categoria=Blusas'    -> esa categoría ya filtrada
 *
 * Cambiá orden, textos o categorías cuando haga falta. Las categorías deben
 * coincidir con las que existen en la tabla `productos`.
 */
export const panelesHome = {
  izquierda: [
    {
      id: 'novedades',
      titulo: 'Novedades',
      sub: 'Lo que acaba de llegar',
      href: '/catalogo',
    },
    {
      id: 'blusas',
      titulo: 'Blusas',
      sub: 'Telas nobles, cortes limpios',
      href: '/catalogo?categoria=Blusas',
    },
    {
      id: 'faldas',
      titulo: 'Faldas',
      sub: 'La caída importa',
      href: '/catalogo?categoria=Faldas',
    },
  ],
  derecha: [
    {
      id: 'pantalones',
      titulo: 'Pantalones',
      sub: 'Mezclilla de todos los días',
      href: '/catalogo?categoria=Pantalones',
    },
    {
      id: 'chamarras',
      titulo: 'Chamarras',
      sub: 'Capas para el frío',
      href: '/catalogo?categoria=Chamarras',
    },
    {
      id: 'deportivo',
      titulo: 'Deportivo',
      sub: 'Comodidad que se ve bien',
      href: '/catalogo?categoria=Deportivo',
    },
  ],
}
