# My Parish — demo parish app

Original demo inspired by the parish-app category (see `scratch/CURRENT_TASK.md`).
Not affiliated with, and containing no copied content from, myparishapp.com.

## Run
Open the live preview. No build step — `index.html` loads `src/styles.css` + `src/app.js` (module), which imports `src/data.js`.

## Files
- `index.html` — app shell: top bar, 5 tab views, tab bar, parish + builder sheets.
- `src/styles.css` — all styling: adobe-wall theme, light-only (elderly readability), modern dark section titles, big touch targets.
- `src/missal.js` — Ordinario de la Misa / Order of Mass (short people's parts + structure, ES+EN, parish redaction).
- `src/data.js` — sample parishes, week of readings (citations + original reflections), inspirations, traditional prayers, events, bulletins, groups, messages.
- `src/app.js` — rendering + interactions, localStorage persistence (parish, favorites, groups, home layout).
  Cuentas por invitación (coll `users` del servidor): puerta con 3 modos (invitación/contraseña/
  administrador), gestor de invitaciones en Administración (crear, enviar por correo/SMS, cambiar
  permiso, nuevo código, quitar acceso), cambio de contraseña en Comunidad → Perfil.
  Pestañas: Inicio, Lecturas, **Comunidad** (perfil, requisitos, directorio, grupos,
  mensajes, medios, **agenda parroquial**: celebraciones próximas, Misas especiales,
  actividades de los grupos, colectas y todas las actividades del mes entrante), Oración,
  **Vocación** (Hijos de la Sagrada Familia: llamado, formación,
  contacto web y formulario vocacional por correo), Más. Letra ajustable (🔠, zoom 1/1.15/1.3 guardado).
  Como editor, en Más → Contenidos se edita TODO (cada campo de cada lista: grupos, directorio
  con apellido/grupos/miembros/clero, eventos con celebrante, avisos con destinatario, intenciones
  con misa enlazada, boletines con PDF, oraciones con tema libre/en latín, cantos, donativos, muro) y se reordena con ↑ ↓ (listas,
  eventos, inspiración, tabla de ministerios y oraciones agrupadas por tema).
- `main.pjs` — `$meta` + tiny tagline (data lives in `src/` for structure).
- `src/confesion.js` — 8 exámenes de conciencia USCCB (texto completo, ES+EN) para la guía de confesión.
- `src/pastoral.js` — guía de bendición de la corona de Adviento + reflexión familiar (ES+EN) + guía «Preparando el corazón en familia» del P. Hernando (ES+EN).
- `src/calendario-extra.js` — eventos reales verificados (hcccsantacruz.org + boletines): 8 recurrentes (Bible Study, rosarios, unción, adoración, SVdP, Las Palmas, Celadoras), 3 fechas únicas (Guadalupe, Navidad, María Madre de Dios), requisitos de sacramentos (ES+EN), boletín fallback, URLs parroquiales.
- `src/manyanet.js` — textos de vocaciones a los Hijos de la Sagrada Familia (ES+EN) + URLs de las 4 fotos (uploads, de manyanet-us.org). La tarjeta de donativo a los Hijos vive en la sección Vocaciones (`vocacionesHTML`), con enlace a la página de apoyo.
- `src/usccb-prayers.js` — 222 oraciones de usccb.org/prayers/list (generado; lazy via `import()` solo al abrir Oraciones).

## Content notes (keep these true)
- Scripture: citations + short public-domain (KJV) quotes only. Full lectionary texts intentionally NOT included — link users to missal/usccb.org.
- Prayers: traditional public-domain texts only.
- Devotionals/bulletins/messages: original sample writing.
- Giving: proyectos con metas/avances/agradecimientos; el pago real se hace en el sitio seguro OSV Hub de la parroquia (hcccsantacruz.org/giving) y la app lleva el registro local; la capilla del Santísimo tiene mensaje mensual + galería de fotos (admin, sincronizado).

## Leccionario por capas
- Layer 0 `src/lectionary/source/` — HTML crudo, inmutable.
- Layer 1 `src/lectionary/citations.json` — solo citation_id (dominio público).
- Layer 2 `src/lectionary/display.js` — presentación por traductor: textos oficiales solo como enlaces con licencia; RVR1909/KJV vía getbible como alternativa pública.
- Add real readings via a licensed feed; add push via `server-plugin` + `upload-plugin` editable bulletins.
- Multi-parish merge: currently parish switch swaps context; to merge calendars, union EVENTS across followed parishes.
