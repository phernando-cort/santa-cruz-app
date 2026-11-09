# Backend compartido (Supabase) — muro, mensajes y avisos entre todos

GitHub Pages solo sirve archivos estáticos: **no puede guardar datos compartidos por sí solo**.
Por eso la app usa Supabase (gratis, sin tarjeta) como base de datos en tiempo real.
Con esto, lo que se publica en un teléfono aparece en todos.

## A. Crear el proyecto (una vez, ~10 min)

1. Entra a https://supabase.com → **Start your project** → crea cuenta (GitHub/Google/email).
2. **New project**:
   - *Name*: `santa-cruz-app`
   - *Database Password*: inventa una larga y guárdala (solo la usa Supabase por dentro).
   - *Region*: la más cercana (p.ej. `East US` para Nuevo México).
   - **Create new project** → espera ~2 min.
3. Menú izquierdo → **SQL Editor** → **New query** → abre el archivo
   `src/cloud/supabase-schema.sql` de este repo, pega TODO su contenido → **Run**.
   Debe decir `Success. No rows returned`.
4. Menú → **Project Settings (⚙) → API** → copia:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **anon · public** (clave larga; es pública por diseño).
5. Pega esos dos valores en `src/cloud-config.js`:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
6. Sube los cambios a GitHub (web o `git push`). GitHub Pages despliega solo.

## B. Probar que comparten (2 teléfonos)

1. Abre la URL de GitHub Pages en dos teléfonos.
2. En uno: Comunidad → Muro → publica algo.
3. En el otro: espera unos segundos (llega solo por Realtime) o cambia de pestaña.
4. Si no llega: revisa que AMBOS tengan la misma `SUPABASE_URL` desplegada
   (Pages tarda 1–2 min en actualizar) y que el SQL se ejecutó sin errores.

## C. Administración

- La contraseña de administrador te la entregó el asistente por el chat.
  **Guárdala fuera del repo** (solo su hash está en `src/cloud-config.js`).
- Entrar: Más → Administración → pega la contraseña → modo admin.
- Como admin puedes: aprobar/borrar avisos y muro, gestionar editores,
  crear cuentas por invitación (Comunidad → Perfil / Administración).
- Si pierdes la contraseña: genera otra con
  `node -e "console.log(require('crypto').randomBytes(12).toString('base64'))"`,
  calcula su SHA-256 y reemplaza `ADMIN_SHA256` en `src/cloud-config.js`.

## D. Límites del plan gratis (suficiente para una parroquia)

- 500 MB de base de datos, ~200 conexiones, Realtime incluido.
- Los textos de la app son pequeños (avisos/muro/intenciones): caben decenas de miles.
- Las FOTOS no van a la base de datos (serían pesadas): la app las sube a
  `upload-plugin` de Perchance o se guardan locales. Si necesitas galería
  compartida pesada, usa Supabase Storage (pregunta y te lo conecto).

## E. Seguridad

- Modo actual (demo): lectura/escritura pública con validación en el cliente;
  los botones de borrar/administrar solo los ve el admin o editores.
  Igual que la versión Perchance: suficiente para avisos y muro parroquial.
- Si publicas datos sensibles (directorios con teléfonos), pide el **modo
  estricto**: políticas RLS por rol + borrado solo-admin en el servidor.

## F. Proxy del texto USCCB para el sitio web (5 min, una vez)

Sin esto, la pestaña **Lecturas** en GitHub Pages muestra *"Sin conexión"*:
el navegador bloquea la lectura directa de `bible.usccb.org` (sin CORS) y
allí no existe el `superFetch` de Perchance. La solución es una Edge Function
propia (gratis) que descarga la página en el servidor y la entrega a la app.

1. Supabase → tu proyecto → menú **Edge Functions** → **Create a new function** → nombre: `usccb` → **Create**.
2. Borra el código de ejemplo y pega TODO el archivo `src/cloud/usccb-proxy.ts` de este repo → **Deploy function**. Debe decir *Deployed*.
3. La función queda pública de lectura (el cliente envía tu clave `anon`, la misma de `src/cloud-config.js`; no se necesita ningún secreto nuevo).
4. Comprueba en el navegador (cualquiera):
   `https://okaaxtyhivybfcmtjjfs.supabase.co/functions/v1/usccb?iso=2026-11-09&lang=es`
   con cabeceras `apikey: <tu anon>` y `Authorization: Bearer <tu anon>`.
   Debe devolver `{"ok":true,"url":"https://bible.usccb.org/...","html":"<!DOCTYPE..."}`.
   (Sin las cabeceras verás `{"message":"Missing authorization header"}`: es normal.)
5. Sube la app a GitHub Pages con los archivos del zip de lecturas. La pestaña Lecturas probará,
   en orden: `superFetch` (preview Perchance) → este proxy (sitio web) → directo →
   proxy público. Sin proxy desplegado, el sitio muestra las citas + reintento +
   enlace externo de último recurso.

## Archivos

- `src/admin.html` + `src/admin.js` — PÁGINA DE ADMINISTRACIÓN separada (no enlazada desde la app): entra con tu contraseña o cuenta de editor y cambia todo; la app lo refleja al instante. En GitHub Pages vive en `/src/admin.html` (guárdala en favoritos, no la compartas).

- `src/cloud/usccb-proxy.ts` — Edge Function `usccb` (proxy del texto oficial para
  GitHub Pages; desplegar UNA vez según §F de este README, sin CLI).
- `src/cloud-config.js` — URL + clave anon + hash admin (EDITA TÚ).
- `src/sync-cloud.js` — adaptador (misma interfaz que el servidor Perchance).
- `src/sync.js` — usa la nube si está configurada; si no, Perchance; si no, local.
- `src/cloud/supabase-schema.sql` — este esquema (ejecutar una vez).
