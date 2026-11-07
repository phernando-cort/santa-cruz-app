Versión Perchance (backend propio) — referencia.

La versión completa con base de datos de Perchance vive en Perchance y usa el bloque
<script type="text/x-server-plugin"> de index.html + main.pjs (imports server-plugin,
super-fetch-plugin, upload-plugin). Este repo usa Supabase en su lugar.

main.pjs original:

```pjs
$meta
  title = Santa Cruz de la Cañada · App Parroquial
  shortTitle = Santa Cruz
  description = App de la Parroquia Santa Cruz de la Cañada (Santa Cruz, NM): Misas, lecturas, rosario y coronilla en voz alta, oraciones, santoral, calendario, ministerios, grupos, boletín y noticias — en 11 idiomas.
  image = https://user.uploads.dev/file/87e0ce0d425df2e875c28112e41d745c.jpg
  icon = https://user.uploads.dev/file/378ea399d5f8db29ad8198499000be7d.png
  tags = parroquia, catolica, santa cruz, misas, rosario, oraciones, calendario, boletin

superFetch = {import:super-fetch-plugin}
uploadPlugin = {import:upload-plugin}
createServerSocket = {import:server-plugin}

$output
  [parishTagline]

parishTagline
  Your parish, always with you — readings, prayers, calendar & bulletins.

```
