# Lecturas — instalación limpia (2026-11-09)

Solo texto oficial USCCB dentro de la app. Sin textos de dominio público ni botones externos.

## Condiciones vigentes (todas aplicadas)

1. **Rango 2023-01-01..2032-12-31** — `clampReadingDate()` + prev/next deshabilitados fuera de rango.
   - Base: `src/vendor/lectionary-daily.js` (westhong, 2023-01-01..2027-10-31, Layer 1 solo citas).
   - Extensión: `src/daily-extra.js` (generada por `src/tools/build-daily-extra.js`, 2027-11-01..2032-12-31).
   - Rellenos: `FEAST_FILL` (Jueves Santo/Navidad/Pentecostés/Asunción, leccionarios 39/16/63/622)
     + `DAILY_FILL` (filas vacías) + `FEAST_FIX` (etiquetas) en `src/daily-citations.js`.
2. **SOLO USCCB** — `src/usccb.js` es la única fuente de texto. Carga sola al abrir la pestaña
   Lecturas; lectura + Escuchar + A−/A+ in-app. Sin RVR/KJV/getbible ni enlaces externos.
   Etiqueta: `readingsRange` = “Lecturas 2023–2032 · texto oficial USCCB”.
3. **Hoy en vivo, resto offline** — `readingDayData()`: si es hoy usa `getDayData()` (cpbjr primario
   + LiturgicalCalendarAPI fallback); si no, `dailyFor(iso)`. Tag 🟢 USCCB/live si hay dato vivo.
4. **Fiesta/rango/color** — `rankOf(fiesta)` → solemnity/feast/memorial/optional/sunday, resto = Feria
   (`rankFerial`: Feria/Weekday…). Chip de color + `#nº leccionario` + cita USCCB si hay (`quote`).
5. **Santo único** — `saintsForDay(fiesta, MM-DD, lang)`: primero el santo de la fiesta de la Misa;
   si no hay (domingos/ferias), los santos de la fecha. Misma regla en Inicio, Lecturas y Santoral.
6. **Resumen en Inicio** — citas en una línea + fiesta/color; texto completo solo en Lecturas.
   Meditación semanal (`WEEK`) separada abajo con Escuchar.
7. **Copyright** — Nunca se empaqueta texto USCCB. Solo `citation_id` viaja con la app (Layer 1).
   El texto se descarga en vivo, se muestra en texto plano in-app y se guarda solo en caché
   local (30 días, `usccb.day.[es.]ISO`) para uso personal/parroquial. Atribución © USCCB en UI.
8. **Resiliencia** — `fetchTextResilient()`: superFetch → fetch → superFetch (3 intentos, 22 s c/u,
   pausas). Detecta reto anti-bots (Obolus) y cambios de formato: usa copia guardada (stale)
   antes de mostrar error. Parser con 4 formatos (wr-block + content-header + container + genérico).
9. **Idiomas** — ES (traducción oficial) / EN (NABRE); resto → EN. UI en 11 idiomas vía `src/i18n.js`.
10. **No mezclar shells** — `index.html` del workspace es la versión Perchance (con server-plugin);
    el shell de GitHub Pages es otro archivo del repo. Este zip solo trae `src/...` con rutas.

## Qué subir a GitHub (conservar rutas)

```
src/app.js                  (Lecturas limpia: sin getbible, con citas + USCCB + santos)
src/usccb.js                (única fuente USCCB)
src/daily-citations.js      (citas 2023-2032 + rellenos)
src/daily-extra.js          (extensión 2027-2032 generada)
src/vendor/lectionary-daily.js (fuente westhong)
src/lectionary/litcal.js   (cpbjr + LitCal, solo metadatos)
src/saints.js               (rankOf + saintsForDay)
src/i18n.js                 (readingsRange, rankFerial, ferialNote, …)
```

NO subir (deprecated, fuera del bundle):

```
src/lectionary/display.js   (stub: ruta getbible eliminada)
src/lectionary/usccb-text.js (shim → src/usccb.js)
src/offline-lectionary.js   (stub: daily-* ya cubre todo el rango)
src/vendor/lectionary-data.js (solo la usaba offline-lectionary)
src/lectionary/citations.json (plantilla de 7 días, no se usa)
```

Si tu shell aún importa alguno de los deprecated, cambia el import
(`src/usccb.js` en vez de `usccb-text.js`; borra `display.js` / `offline-lectionary.js`).

## Shell GitHub Pages (script tags necesarios)

```html
<script src="src/vendor/lectionary-daily.js"></script>
<script src="src/daily-extra.js"></script>
<script src="src/vendor/saints-data.js"></script>
<script src="src/vendor/saints-es.js"></script>
<script src="src/vendor/saints-extra.js"></script>
<script type="module" src="src/app.js"></script>
```

`src/app.js` importa desde el módulo:

```
./usccb.js  ./lectionary/litcal.js  ./daily-citations.js  ./saints.js  ./i18n.js
```

## Verificación rápida

- 2026-11-08 (domingo): fiesta + citas + santo Godfrey en Inicio/Lecturas/Santoral.
- 2026-11-04 (memoria Borromeo): rango «Memoria».
- 2026-12-25 / 2027-04-06 / 2027-05-28 / 2027-08-15: rellenos FEAST_FILL.
- Sin red: citas + copia guardada (stale), sin pantalla rota.
- Recarga limpia sin errores de consola.
