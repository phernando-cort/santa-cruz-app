// USCCB (texto completo bajo demanda) + helpers de fecha.
// Antes vivía en src/lectio.js junto al cliente de lectio-api (asachs01),
// que se eliminó: solo daba citas de domingos/fiestas (404 entre semana,
// `text` vacío) y exigía red+proxy, quedando redundante frente a las citas
// diarias offline vendorizadas. El scraping USCCB sí se conserva: es la única
// fuente de texto completo y funciona todos los días vía superFetch.

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
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
async function fetchText(url) {
  const sf = superFetchFn();
  if (sf) {
    const r = await sf(url);
    return { ok: r.ok, status: r.status, text: await r.text() };
  }
  const r = await fetch(url);
  return { ok: r.ok, status: r.status, text: await r.text() };
}

// Patrón de LectionaryApp (CWilsonTSP, backend Heroku muerto):
// leer https://bible.usccb.org/bible/readings/MMDDYY.cfm directo y extraer
// .content-header + cuerpo. Texto © USCCB (NABRE): mostrar con atribución.
export function usccbCode(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${m[2]}${m[3]}${m[1].slice(2)}`;
}
export function usccbUrl(iso) {
  const code = usccbCode(iso);
  return code ? `https://bible.usccb.org/bible/readings/${code}.cfm` : null;
}
export function parseUsccb(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = (doc.querySelector("h1")?.textContent || "").trim() || null;
  const dayTitle = [...doc.querySelectorAll("h2")].map(e => e.textContent.trim()).find(x => x && !/^Menu|navigation/i.test(x) && x.length > 3 && x.length < 140) || null;
  const sections = [...doc.querySelectorAll(".content-header")].map(h => {
    const heading = (h.querySelector("h3")?.textContent || h.textContent || "").trim().replace(/\s+/g, " ");
    const citation = (h.querySelector(".address")?.textContent || "").trim().replace(/\s+/g, " ");
    const wrap = h.parentElement;
    let full = wrap ? wrap.textContent.trim().replace(/\s+/g, " ") : "";
    let text = full;
    const hi = full.indexOf(heading);
    if (hi >= 0) text = full.slice(hi + heading.length).trim();
    if (citation && text.startsWith(citation)) text = text.slice(citation.length).trim();
    return { heading, citation, text: text.slice(0, 6000) };
  }).filter(s => s.heading || s.citation);
  return { title: dayTitle || title, sections };
}
export async function fetchUsccbDay(iso) {
  const key = USCCB_PREFIX + iso;
  const cached = storageGet(key);
  if (cached && (Date.now() - (cached.savedAt || 0) < CACHE_TTL_MS) && cached.payload) {
    return { status: "cache", data: cached.payload };
  }
  const url = usccbUrl(iso);
  if (!url) return { status: "error", error: "bad-date" };
  try {
    const res = await fetchText(url);
    if (!res.ok) return { status: "error", error: `HTTP ${res.status}` };
    const parsed = parseUsccb(res.text);
    if (!parsed.sections.length) return { status: "error", error: "parse" };
    const payload = { iso, url, ...parsed };
    storageWrite(key, { savedAt: Date.now(), payload });
    return { status: "live", data: payload };
  } catch (e) {
    const fresh = cached?.payload;
    if (fresh) return { status: "cache", data: fresh };
    return { status: "error", error: String((e && e.message) || e) };
  }
}
