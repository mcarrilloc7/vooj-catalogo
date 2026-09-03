# vooj-catalogo

Catálogo digital + inventario para la boutique de ropa **VOOJ**.

Stack: React + Vite + Tailwind + Supabase + Vercel (mismo patrón que GymPro y La Caja).

## Estado

Paso 1 — scaffolding e identidad visual. **Supabase y CRUD todavía no conectados.**

## Rutas

| Ruta        | Descripción                                            |
| ----------- | ----------------------------------------------------- |
| `/`         | Home de marca (pantalla completa, sin nav)            |
| `/catalogo` | Vista pública del catálogo (placeholder)              |
| `/admin`    | Vista privada — placeholder de login, sin lógica real |
| `/nosotros` | Historia de la marca (placeholder)                    |
| `/contacto` | Contacto (placeholder)                                |

## Identidad visual

Definida en [`tailwind.config.js`](tailwind.config.js):

- `vooj-black` `#0A0A0A` — fondo negro puro
- `vooj-bone` `#F5F0E8` — texto / acento hueso
- Tipografía sans minimalista (Jost / Inter) con tracking amplio
- Wordmark en mayúsculas: clase `.vooj-wordmark` (`tracking-wordmark` = `0.35em`)

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Próximo paso

Conectar Supabase (auth para `/admin`, tabla de inventario) y CRUD del catálogo.
