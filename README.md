# Santa Cruz de la Cañada · App Parroquial

App de la Parroquia Santa Cruz de la Cañada (Santa Cruz, NM): Misas, lecturas, rosario y coronilla en voz alta, oraciones, santoral, calendario, ministerios, grupos, boletín y noticias — en 11 idiomas.

## Compartido en tiempo real (muro, mensajes, avisos entre todos)

GitHub Pages es solo estático: los datos compartidos viven en **Supabase** (gratis, sin tarjeta).

1. Crea cuenta en https://supabase.com → **New project** (`santa-cruz-app`, región cercana, p. ej. East US) → espera ~2 min.
2. **SQL Editor → New query** → pega TODO el contenido de `supabase-schema.sql` (raíz de este repo) → **Run** (debe decir Success).
3. **Project Settings (⚙) → API** → copia **Project URL** y la clave **anon · public**.
4. Pégalas en `src/cloud-config.js` (`SUPABASE_URL` y `SUPABASE_ANON_KEY`), sube a GitHub, espera 1–2 min.
5. Prueba en 2 teléfonos: lo publicado en uno (Muro, Mensajes, Avisos, Intenciones…) aparece en el otro en segundos.

Sin configurar Supabase, la app funciona en **modo local** (cada teléfono guarda lo suyo).
Guía detallada: `src/cloud/README.md`.

## Probar en local

```bash
python3 -m http.server 8080
# abrir http://localhost:8080
```

## Publicar en GitHub + activar Pages (solo web, sin git)

1. https://github.com/new → nombre p. ej. `santa-cruz-app` → *Public* → *Create repository*.
2. *Add file → Upload files* → arrastra **el contenido** de esta carpeta (`index.html`, `src/`, `supabase-schema.sql`, `README.md`, `.nojekyll`) → *Commit changes*.
3. *Settings → Pages* → *Source: Deploy from a branch* → *Branch: main / (root)* → *Save*.
4. En 1–2 min: `https://TU-USUARIO.github.io/santa-cruz-app/`

Con git:
```bash
git init -b main && git add . && git commit -m "App parroquial Santa Cruz + backend Supabase"
git remote add origin https://github.com/TU-USUARIO/santa-cruz-app.git
git push -u origin main
```

## Administración

- La contraseña de administrador se entrega aparte (por chat), **no va en el repo**: solo su hash está en `src/cloud-config.js`.
- Entrar: Más → Administración → pegar contraseña.
- Como admin: borrar muro/avisos, gestionar editores, crear cuentas por invitación.

## Estructura

- `index.html` — cáscara (barra superior, 6 pestañas, hojas).
- `src/app.js` — render + interacciones.
- `src/sync.js` — usa Supabase si está configurado; si no, modo local.
- `src/sync-cloud.js` + `src/cloud-config.js` — adaptador nube y claves.
- `src/cloud/supabase-schema.sql` — esquema (ejecutar una vez en Supabase).
- `src/*.js` — datos, i18n (11 idiomas), leccionario, santoral, misal, etc.

## Licencia y contenido

- Contenido: citas bíblicas cortas de dominio público (KJV), oraciones tradicionales de dominio público y textos propios de ejemplo. Los textos completos con derechos **no** están incluidos a propósito (la app enlaza a fuentes oficiales).
- Si la publicas como abierta, añade un archivo `LICENSE` (p. ej. MIT).
