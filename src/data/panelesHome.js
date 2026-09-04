/**
 * Los 6 paneles de la home: 3 a la izquierda del carrusel, 3 a la derecha
 * (en móvil se apilan debajo). Estilo "bloques de departamento".
 *
 *  - titulo: etiqueta corta.
 *  - sub:    línea de apoyo opcional (o null).
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
      sub: 'Lo último que llegó',
      href: '/catalogo',
    },
    { id: 'blusas', titulo: 'Blusas', sub: null, href: '/catalogo?categoria=Blusas' },
    { id: 'faldas', titulo: 'Faldas', sub: null, href: '/catalogo?categoria=Faldas' },
  ],
  derecha: [
    {
      id: 'pantalones',
      titulo: 'Pantalones',
      sub: null,
      href: '/catalogo?categoria=Pantalones',
    },
    {
      id: 'chamarras',
      titulo: 'Chamarras',
      sub: null,
      href: '/catalogo?categoria=Chamarras',
    },
    {
      id: 'deportivo',
      titulo: 'Deportivo',
      sub: 'Para moverte',
      href: '/catalogo?categoria=Deportivo',
    },
  ],
}
