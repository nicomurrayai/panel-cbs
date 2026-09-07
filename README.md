# Panel de administración de juegos

Panel web para configurar los juegos (Ruleta, Memory Card y Quiz) que la app
`panel-juegos` lee desde Supabase. Pensado para que una persona **no técnica**
pueda cambiar premios, probabilidades, imágenes, textos y visibilidad **sin tocar
código**.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Supabase · Zod
- **Backend:** el mismo proyecto Supabase que usan los juegos
  (`dzeawkyvhkumvtytpggd`), bucket de imágenes `game-assets`.

---

## 1. Instalación

Requisitos: **Node.js 18.18+** (recomendado 20+).

```bash
npm install
```

### Variables de entorno

Copiá `.env.example` a `.env.local` y completá los valores:

```bash
cp .env.example .env.local
```

| Variable | Qué es | Dónde se obtiene |
|---|---|---|
| `SUPABASE_URL` | URL del proyecto | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave con acceso total (**solo servidor**) | Supabase → Project Settings → API → `service_role` |
| `NEXT_PUBLIC_SUPABASE_URL` | Igual a `SUPABASE_URL` (para armar URLs de imágenes) | — |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública para Supabase Realtime en el navegador | Supabase → Project Settings → API → publishable/anon key |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Bucket de imágenes (`game-assets`) | — |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Usuario y contraseña del panel | Lo elegís vos |
| `SESSION_SECRET` | Secreto para firmar la sesión (≥32 caracteres) | Generalo (ver abajo) |

Generar un `SESSION_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> ⚠️ **Seguridad:** `.env.local` está en `.gitignore` y **nunca** se sube al
> repositorio. La `SUPABASE_SERVICE_ROLE_KEY` da acceso total a la base: vive
> solo en el servidor y jamás se envía al navegador.

---

## 2. Ejecutar

```bash
npm run dev      # desarrollo en http://localhost:3000
npm run build    # build de producción
npm run start    # servir el build
```

Entrá a `http://localhost:3000`, te va a pedir login con `ADMIN_USERNAME` /
`ADMIN_PASSWORD`.

---

## 3. Guía de uso (para usuarios no técnicos)

Todas las secciones avisan si la configuración es **válida** (verde) o tiene un
**problema** (rojo). Si está en rojo, el botón **Guardar** queda deshabilitado:
así una mala configuración nunca llega a los juegos.

### Dashboard
Resumen de juegos visibles/ocultos, contadores y el **estado de conexión** con
Supabase (verde = conectado).

### Juegos
Mostrá u ocultá cada juego en la pantalla principal con el interruptor
**"Mostrar en la home"**. También podés editar el título, el texto del botón, la
descripción y la **imagen de portada**.

### Ruleta
- Cada **segmento** es un premio. Definí su **nombre**, **tipo**
  (premio / gracias / reintentar), **peso**, **colores** e **imagen**.
- La **probabilidad** se calcula con el peso: a mayor peso, más chances. El panel
  muestra el porcentaje real de cada segmento.
- No se puede guardar si: la suma de pesos es 0, un segmento habilitado no tiene
  nombre, o no hay ningún segmento habilitado.

### Memory Card
- Definí el **tiempo límite** (10–600 segundos) y las **cartas** del juego.
- Subí una imagen única para personalizar el **reverso de todas las cartas**.
- Cada carta es un par: subí una imagen desde el panel. El juego duplica cada
  carta automáticamente para formar los pares.
- No se puede guardar una carta activa sin imagen.

### Quiz
- Preguntas **Verdadero / Falso**: escribí la afirmación, elegí la respuesta
  correcta y subí una imagen de referencia.
- No se puede activar una pregunta sin enunciado ni sin imagen.

### Ajustes globales
Textos de la pantalla principal, nombres de marca e imagen de fondo, y la
**paleta de colores** del tema.

### Medios
Biblioteca de imágenes del bucket `game-assets`: **subir**, **reemplazar**
(mantiene el vínculo con donde se usa) y **eliminar**. Formatos: PNG, JPG, WEBP,
SVG (máx. 8 MB).

---

## 4. Arquitectura

```
src/
  app/
    login/                  Pantalla de login
    (panel)/                Rutas protegidas (dashboard + secciones)
    api/auth, api/health    Login/logout y chequeo de conexión
  actions/                  Server Actions (única vía de escritura a la base)
  lib/
    supabase/               Cliente admin (service_role) y Storage
    validation/             Esquemas Zod por dominio
    data/                   Lecturas para cada pantalla
  components/               UI, formularios, carga de imágenes
  proxy.ts                  Protección de rutas (sesión)
```

- **Seguridad:** la `service_role` solo se usa en `lib/supabase/admin.ts`
  (marcado `server-only`). Las mutaciones pasan por *Server Actions* y se validan
  con Zod **en el servidor** además del navegador.
- **Realtime:** los formularios se hidratan con SSR y luego escuchan
  `postgres_changes` con la publishable/anon key pública. Si un formulario tiene
  cambios sin guardar, los cambios externos quedan pendientes para aplicar sin
  pisar la edición local.
- **Tablas compartidas con panel-juegos:** `quiz_questions`, `memory_settings`,
  `memory_card_faces`, `media_assets` y `games`. Los juegos leen solo filas
  activas; el panel gestiona todo el contenido real sin datos demo.
