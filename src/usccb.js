// USCCB (texto completo bajo demanda) + helpers de fecha.
// El texto oficial (NABRE en inglés, traducción oficial en español) NO se
// puede copiar dentro de la app (© USCCB): se trae en vivo desde
// bible.usccb.org con superFetch y se muestra DENTRO de la app, con caché
// local de 30 días. Sin red: citas + texto de dominio público (getbible).
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const USCCB_PREFIX = "usccb.day.";

function storageGet(k) {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}
function storageWrite(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export function sundayOfWeek(ref = new Date()) {
  const x = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
// state.readingIdx: 0=dom … 6=sáb (orden de WEEK en data.js)
export function isoForReadingIdx(idx) {
  const s = sundayOfWeek(new Date());
  const d = new Date(s);
  d.setDate(d.getDate() + idx);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function readableDate(iso) {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}

function superFetchFn() {
  const g = globalThis;
  return (g.root && g.root.superFetch) || g.superFetch || null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function withTimeout(p, ms, label) {
  let t = null;
  const to = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(label || "timeout")), ms); });
  return Promise.race([p, to]).finally(() => { if (t) clearTimeout(t); });
}
async function fetchTextOnce(url, useSf) {
  const sf = superFetchFn();
  if (useSf && sf) {
    const r = await sf(url);
    return { ok: r.ok, status: r.status, text: await r.text() };
  }
  const ctl = ("AbortController" in globalThis) ? new AbortController() : null;
  const to = ctl ? setTimeout(() => { try { ctl.abort(); } catch {} }, 20000) : null;
  try {
    const r = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
    return { ok: r.ok, status: r.status, text: await r.text() };
  } finally { if (to) clearTimeout(to); }
}
// 3 intentos (superFetch → fetch directo → superFetch) con pausas y tope de
// 22 s por intento: un micro-corte ya no deja la pantalla en "Sin conexión".
async function fetchTextResilient(url) {
  const sf = superFetchFn();
  const order = sf ? [true, false, true] : [false, false, false];
  let last = null;
  for (let i = 0; i < order.length; i++) {
    if (i) await sleep(i === 1 ? 800 : 2000);
    try {
      const res = await withTimeout(fetchTextOnce(url, order[i]), 22000, "timeout");
      if (res.ok) return res;
      last = new Error("HTTP " + res.status);
    } catch (e) { last = e; }
  }
  throw last || new Error("net");
}

// Patrón de LectionaryApp (CWilsonTSP, backend Heroku muerto):
// leer https://bible.usccb.org/bible/readings/MMDDYY.cfm directo y extraer
// .content-header + cuerpo. Texto © USCCB (NABRE): mostrar con atribución.
export function usccbCode(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${m[2]}${m[3]}${m[1].slice(2)}`;
}
// which: "en" (NABRE) o "es" (traducción oficial USCCB en español).
export function usccbWhich(lang) { return lang === "es" ? "es" : "en"; }
export function usccbUrl(iso, lang) {
  const code = usccbCode(iso);
  if (!code) return null;
  if (usccbWhich(lang) === "es") return `https://bible.usccb.org/es/bible/lecturas/${code}.cfm`;
  return `https://bible.usccb.org/bible/readings/${code}.cfm`;
}
const KIND_RX = [
  [/primer(a|o)? lectura|reading 1|first reading/i, "first"],
  [/salmo|psalm/i, "psalm"],
  [/segunda lectura|reading 2|second reading/i, "second"],
  [/tercera lectura|reading 3|third reading/i, "third"],
  [/aclamaci|alleluia/i, "alleluia"],
  [/evangelio|gospel/i, "gospel"],
  [/^o bien|^or$/i, "alt"],
  [/secuencia|sequence/i, "sequence"],
];
export function usccbKind(title) {
  const t = String(title || "").trim();
  for (const [rx, k] of KIND_RX) if (rx.test(t)) return k;
  return "reading";
}
export function parseUsccb(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = (doc.querySelector('meta[property="og:title"]')?.content || "").trim()
    || [...doc.querySelectorAll("h2")].map(e => e.textContent.trim()).find(x => x && !/^Menu|navigation/i.test(x) && x.length > 3 && x.length < 140) || null;
  let blocks = [...doc.querySelectorAll(".wr-block.b-verse")];
  let sections = blocks.map(b => {
    const h = (b.querySelector("h3.name")?.textContent || "").trim().replace(/\s+/g, " ");
    const citation = (b.querySelector(".address")?.textContent || "").trim().replace(/\s+/g, " ");
    const body = b.querySelector(".content-body");
    // Párrafos: respeta <p>/<br>; colapsa el resto del espacio.
    let text = "";
    if (body) {
      const ps = [...body.querySelectorAll("p")].map(p => p.textContent.trim().replace(/\s+/g, " ")).filter(Boolean);
      text = ps.length ? ps.join("\n\n") : body.textContent.trim().replace(/\s+/g, " ");
    }
    return { title: h, citation, text: text.slice(0, 12000), kind: usccbKind(h) };
  }).filter(s => s.text && (s.title || s.citation));
  if (!sections.length) {
    // Fallback al formato antiguo (.content-header).
    sections = [...doc.querySelectorAll(".content-header")].map(h => {
      const heading = (h.querySelector("h3")?.textContent || h.textContent || "").trim().replace(/\s+/g, " ");
      const citation = (h.querySelector(".address")?.textContent || "").trim().replace(/\s+/g, " ");
      const wrap = h.parentElement;
      let full = wrap ? wrap.textContent.trim().replace(/\s+/g, " ") : "";
      let text = full;
      const hi = full.indexOf(heading);
      if (hi >= 0) text = full.slice(hi + heading.length).trim();
      if (citation && text.startsWith(citation)) text = text.slice(citation.length).trim();
      return { title: heading, citation, text: text.slice(0, 6000), kind: usccbKind(heading) };
    }).filter(s => (s.title || s.citation) && s.text);
  }
  if (!sections.length) {
    // Rediseños del sitio USCCB: agrupa los párrafos bajo cada encabezado
    // dentro de main/article como último recurso (mejor algo que nada).
    try {
      const scope = doc.querySelector("main") || doc.querySelector("article") || doc.body;
      if (scope) {
        const heads = [...scope.querySelectorAll("h1,h2,h3")].filter((h) => {
          const x = (h.textContent || "").trim();
          return x.length > 3 && x.length < 160 && !/^(menu|navigation|search|daily readings)/i.test(x);
        }).slice(0, 24);
        const generic = [];
        for (const h of heads) {
          const heading = (h.textContent || "").trim().replace(/\s+/g, " ");
          let node = h.nextElementSibling;
          const paras = [];
          let guard = 0;
          while (node && !/^H[1-6]$/.test(node.tagName) && guard++ < 60) {
            const tx = ((node.innerText ?? node.textContent) || "").trim().replace(/\s+/g, " ");
            if (tx.length > 1 && !/^(menu|navigation|search)/i.test(tx)) paras.push(tx);
            node = node.nextElementSibling;
            if (paras.join(" ").length > 6000) break;
          }
          const text = paras.join("\n\n").slice(0, 6000);
          if (text) generic.push({ title: heading, citation: "", text, kind: usccbKind(heading) });
        }
        sections = generic.filter((s) => s.text && (s.title || s.citation));
      }
    } catch {}
  }
  return { title, sections };
}
export async function fetchUsccbDay(iso, lang) {
  const which = usccbWhich(lang);
  const key = USCCB_PREFIX + (which === "es" ? "es." : "") + iso;
  const cached = storageGet(key);
  if (cached && (Date.now() - (cached.savedAt || 0) < CACHE_TTL_MS) && cached.payload) {
    return { status: "cache", data: cached.payload };
  }
  const url = usccbUrl(iso, lang);
  if (!url) return { status: "error", error: "bad-date" };
  try {
    const res = await fetchTextResilient(url);
    const parsed = parseUsccb(res.text);
    if (!parsed.sections.length) {
      // La página cambió de formato: usa la copia guardada aunque esté vieja.
      if (cached?.payload) return { status: "stale", data: cached.payload };
      return { status: "error", error: "parse" };
    }
    const payload = { iso, which, url, savedAt: Date.now(), ...parsed };
    storageWrite(key, { savedAt: Date.now(), payload });
    return { status: "live", data: payload };
  } catch (e) {
    // Sin red o USCCB caído: la copia guardada (de cualquier fecha) vale.
    if (cached?.payload) return { status: "stale", data: cached.payload };
    const msg = String((e && e.message) || e);
    return { status: "error", error: /timeout|abort|network|fetch|failed|load failed/i.test(msg) ? "net" : msg };
  }
}
