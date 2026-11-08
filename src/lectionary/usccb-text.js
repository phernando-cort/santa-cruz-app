// Fuente única de texto oficial: USCCB (bible.usccb.org).
// EN: https://bible.usccb.org/bible/readings/MMDDYY.cfm
// ES: https://bible.usccb.org/es/bible/lecturas/MMDDYY.cfm
// El texto NO se vende con la app: se descarga en vivo en el dispositivo,
// se muestra en texto plano dentro de la app y se guarda solo en caché
// local (localStorage) para uso personal/parroquial.
// © USCCB — Todos los derechos reservados. Ver bible.usccb.org y el enlace
// "Fuente oficial" que muestra cada pantalla de lectura.
// Basado en la técnica de parsing de catholic-mass-readings (Apache-2.0,
// andrewtryder/catholic-mass-readings — solo la idea de selectores
// .container > .name + .address + .content-body; sin dependencias).

export function usccbUrlFor(iso, lang) {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return null;
  const code =
    String(m).padStart(2, "0") + String(d).padStart(2, "0") + String(y).slice(2);
  if (lang === "es")
    return `https://bible.usccb.org/es/bible/lecturas/${code}.cfm`;
  return `https://bible.usccb.org/bible/readings/${code}.cfm`;
}

function cleanPara(t) {
  return String(t || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Extrae texto plano con párrafos desde .content-body (respeta <p>, <br>).
function bodyPlainText(contentBody) {
  if (!contentBody) return "";
  const clone = contentBody.cloneNode(true);
  clone.querySelectorAll("script,style").forEach((n) => n.remove());
  // <br> → salto de línea
  clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  const paras = [];
  const ps = clone.querySelectorAll("p");
  if (ps.length) {
    for (const p of ps) {
      const t = cleanPara(p.textContent);
      if (t && t.toLowerCase() !== "or" && t.toLowerCase() !== "o bien:") paras.push(t);
    }
  } else {
    const t = cleanPara(clone.textContent);
    if (t) paras.push(t);
  }
  return paras.join("\n\n");
}

function kindFromHeader(h) {
  const s = String(h || "").toLowerCase();
  if (/salmo|psalm|psaume|responsorial/.test(s)) return "psalm";
  if (/evangelio|gospel|évangile|vangelo/.test(s)) return "gospel";
  if (/aclamaci|alleluia|alléluia|acclamation/.test(s)) return "alleluia";
  if (/segunda|second|secunda|deuxi|seconde/.test(s)) return "second";
  if (/primera|first|reading 1|premi|prima|première|lecture 1/.test(s)) return "first";
  if (/^o bien|^or\b|alternative/.test(s)) return "alternative";
  return "reading";
}

// Parsea el HTML ya descargado (vía superFetch) a texto plano.
// Devuelve {title, sections:[{kind, header, citation, text}]}.
export function parseUsccbHtml(html, url) {
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  const title =
    doc.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() ||
    doc.querySelector("title")?.textContent?.split("|")[0]?.trim() ||
    "";
  const sections = [];
  for (const c of doc.querySelectorAll(".container")) {
    const name = c.querySelector(".name")?.textContent?.trim() || "";
    const addrEl = c.querySelector(".address");
    if (!name || !addrEl) continue;
    const citation = addrEl.textContent.replace(/\s+/g, " ").trim();
    if (!citation || citation.length > 160) continue;
    const body = c.querySelector(".content-body");
    const text = bodyPlainText(body);
    if (!text || text.length < 20) continue;
    // Evita bloques de navegación ("Daily Readings", calendarios…).
    if (/daily readings|lecturas del día|calendar/i.test(name) && text.length < 200) continue;
    sections.push({ kind: kindFromHeader(name), header: name, citation, text });
  }
  if (!sections.length) throw new Error("no_sections");
  return { title, url, sections };
}

const memCache = {};

export async function fetchUsccbMass(iso, lang, fetchText) {
  const L = lang === "es" ? "es" : "en";
  const key = `usccb.text.v2.${L}.${iso}`;
  if (memCache[key]) return memCache[key];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const j = JSON.parse(raw);
      if (j && j.sections && j.sections.length) {
        memCache[key] = j;
        return j;
      }
    }
  } catch {}
  const url = usccbUrlFor(iso, L);
  if (!url) throw new Error("bad_date");
  const html = await fetchText(url);
  const mass = parseUsccbHtml(html, url);
  memCache[key] = mass;
  try {
    localStorage.setItem(key, JSON.stringify(mass));
  } catch {}
  return mass;
}
