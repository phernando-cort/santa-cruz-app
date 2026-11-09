// USCCB — ÚNICA fuente de texto oficial (instalación limpia 2026-11-09).
// Condiciones:
// - Texto oficial (NABRE en inglés, traducción oficial en español) © USCCB: NUNCA se
//   empaqueta en el repo. Solo citas (Layer 1) viajan con la app; el texto se trae en
//   vivo desde bible.usccb.org (superFetch → proxy Supabase Edge → directo →
//   proxy público) y se muestra DENTRO de la app (lectura + Escuchar + A−/A+),
//   con caché local de 30 días.
// - Sin red: se muestra la copia guardada (stale) o las citas; botón externo
//   SOLO como último recurso en el estado de error (ver app.js).
// - Detecta página anti-bots (Obolus) en CADA vía y prueba la siguiente;
//   y cambios de formato sin romper la UI.
// - ES: https://bible.usccb.org/es/bible/lecturas/MMDDYY.cfm
// - EN: https://bible.usccb.org/bible/readings/MMDDYY.cfm (otros idiomas → EN).
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
function abortable(ms) {
  const ctl = ("AbortController" in globalThis) ? new AbortController() : null;
  const to = ctl ? setTimeout(() => { try { ctl.abort(); } catch {} }, ms) : null;
  return { signal: ctl ? ctl.signal : undefined, done() { if (to) clearTimeout(to); } };
}
// Error con código para la UI: net | http | blocked | edge-missing...
function coded(msg, code) { const e = new Error(msg); e.code = code; return e; }
function codeOf(e) {
  if (e && e.code) return e.code;
  const msg = String((e && e.message) || e);
  if (/HTTP\s+\d+/.test(msg)) return "http";
  return /timeout|abort|network|fetch|failed|load failed|cors|not allowed/i.test(msg) ? "net" : "net";
}
async function fetchDirect(url, ms) {
  const a = abortable(ms || 12000);
  try {
    const r = await fetch(url, a.signal ? { signal: a.signal } : undefined);
    const text = await r.text();
    if (!r.ok) throw coded("HTTP " + r.status, "http");
    return text;
  } finally { a.done(); }
}
async function fetchSuper(url, ms) {
  const sf = superFetchFn();
  if (!sf) throw coded("no-superfetch", "net");
  const r = await withTimeout((async () => {
    const res = await sf(url);
    return { ok: res.ok, status: res.status, text: await res.text() };
  })(), ms || 22000, "timeout");
  if (!r.ok) throw coded("HTTP " + r.status, "http");
  return r.text;
}
// Proxy propio en Supabase (Edge Function `usccb`, ver src/cloud/usccb-proxy.ts).
// Es el camino principal en GitHub Pages, donde no hay superFetch y el navegador
// bloquea la lectura directa (CORS). Devuelve el HTML oficial tal cual.
let edgeCfg = null; // null = sin averiguar | false = sin proxy | {base, anon}
async function edgeConfig() {
  if (edgeCfg !== null) return edgeCfg;
  try {
    const m = await import("./cloud-config.js");
    const C = (m && m.CLOUD) || {};
    if (C.SUPABASE_URL && String(C.SUPABASE_URL).indexOf("https://") === 0 &&
        C.SUPABASE_ANON_KEY && String(C.SUPABASE_ANON_KEY).length > 20) {
      edgeCfg = { base: String(C.SUPABASE_URL).replace(/\/$/, "") + "/functions/v1/usccb", anon: String(C.SUPABASE_ANON_KEY) };
    } else edgeCfg = false;
  } catch { edgeCfg = false; }
  return edgeCfg;
}
async function fetchEdge(iso, lang, ms) {
  const cfg = await edgeConfig();
  if (!cfg) throw coded("no-edge", "net");
  const eq = cfg.base + "?iso=" + encodeURIComponent(iso) + "&lang=" + (lang === "es" ? "es" : "en");
  const a = abortable(ms || 20000);
  try {
    const r = await fetch(eq, { headers: { apikey: cfg.anon, Authorization: "Bearer " + cfg.anon }, signal: a.signal });
    if (!r.ok) throw coded("HTTP " + r.status, "http");
    let j = null;
    try { j = await r.json(); } catch { throw coded("edge-bad", "net"); }
    if (!j || j.ok !== true || typeof j.html !== "string") throw coded((j && j.error) || "edge-bad", "net");
    return j.html;
  } finally { a.done(); }
}
// Último recurso (best-effort, 12 s): proxy público. En algunas redes funciona;
// si devuelve el reto anti-bots se detecta y se sigue (ver sawBlocked).
async function fetchPublicProxy(url, ms) {
  const a = abortable(ms || 12000);
  try {
    const r = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url), a.signal ? { signal: a.signal } : undefined);
    const text = await r.text();
    if (!r.ok) throw coded("HTTP " + r.status, "http");
    return text;
  } finally { a.done(); }
}
// Cadena de descarga (instalación 2026-11-10):
// 1) superFetch (preview Perchance) · 2) proxy Supabase Edge (GitHub Pages)
// 3) fetch directo (si USCCB algún día envía CORS) · 4) proxy público (best-effort).
// El HTML con reto anti-bots NO vale: se anota (sawBlocked) y se prueba la vía
// siguiente. Solo se lanza error cuando ninguna vía trae HTML útil.
async function fetchTextResilient(url, iso, lang) {
  const jobs = [];
  if (superFetchFn()) jobs.push(["perchance", () => fetchSuper(url, 22000)]);
  jobs.push(["edge", () => fetchEdge(iso, lang, 20000)]);
  jobs.push(["direct", () => fetchDirect(url, 12000)]);
  jobs.push(["public", () => fetchPublicProxy(url, 12000)]);
  let sawBlocked = false, last = coded("net", "net");
  for (let i = 0; i < jobs.length; i++) {
    if (i) await sleep(600);
    try {
      const text = await jobs[i][1]();
      if (usccbBlocked(text) || /access denied/i.test(String(text).slice(0, 5000))) { sawBlocked = true; last = coded("blocked", "blocked"); continue; }
      return { text, via: jobs[i][0] };
    } catch (e) { last = e; }
  }
  if (sawBlocked && codeOf(last) === "net") throw coded("blocked", "blocked");
  throw last;
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
// Alias histórico (usccb-text.js): misma firma usccbUrlFor(iso, lang).
export const usccbUrlFor = usccbUrl;
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
// USCCB a veces devuelve una página de reto anti-bots ("Obolus") en vez de
// las lecturas. Detectarla evita confundirla con un cambio de formato.
export function usccbBlocked(html) {
  return typeof html === "string"
    && html.includes("X_Obolus_Proof")
    && html.includes("challengeToken")
    && html.includes("Checking connection");
}
export function parseUsccb(html) {
  if (usccbBlocked(html) || /access denied/i.test(String(html || "").slice(0, 5000))) {
    return { title: null, sections: [], blocked: true };
  }
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
    // Formato alternativo (.container > .name + .address + .content-body).
    try {
      const built = [];
      for (const c of doc.querySelectorAll(".container")) {
        const nm = c.querySelector(".name"), ad = c.querySelector(".address");
        if (!nm || !ad) continue;
        const heading = (nm.textContent || "").trim().replace(/\s+/g, " ");
        const citation = (ad.textContent || "").trim().replace(/\s+/g, " ");
        const body = c.querySelector(".content-body");
        let text = "";
        if (body) {
          const ps = [...body.querySelectorAll("p")].map((p) => p.textContent.trim().replace(/\s+/g, " ")).filter(Boolean);
          text = ps.length ? ps.join("\n\n") : body.textContent.trim().replace(/\s+/g, " ");
        }
        if (text && (heading || citation)) built.push({ title: heading, citation, text: text.slice(0, 12000), kind: usccbKind(heading) });
      }
      if (built.length) sections = built;
    } catch {}
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
    const got = await fetchTextResilient(url, iso, lang);
    const parsed = parseUsccb(got.text);
    if (parsed.blocked) {
      // Reto anti-bots en TODAS las vías: vale la copia guardada.
      try { console.warn("[lecturas] USCCB devolvió reto anti-bots en todas las vías"); } catch {}
      if (cached?.payload) return { status: "stale", data: cached.payload };
      return { status: "error", error: "blocked" };
    }
    if (!parsed.sections.length) {
      // La página cambió de formato: usa la copia guardada aunque esté vieja.
      if (cached?.payload) return { status: "stale", data: cached.payload };
      return { status: "error", error: "parse" };
    }
    const payload = { iso, which, url, savedAt: Date.now(), ...parsed };
    storageWrite(key, { savedAt: Date.now(), payload });
    return { status: "live", data: payload };
  } catch (e) {
    // Sin red / CORS / proxy caído: la copia guardada (de cualquier fecha) vale.
    if (cached?.payload) return { status: "stale", data: cached.payload };
    return { status: "error", error: codeOf(e) };
  }
}
