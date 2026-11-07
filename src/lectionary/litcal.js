// Layer 1 (live) — citation_id JSON.
// Primary: cpbjr/catholic-readings-api (USCCB-scraped citations + celebration +
// saint quote, static JSON on GitHub Pages, no lectionary text inside).
//   https://github.com/cpbjr/catholic-readings-api
// Fallback: LiturgicalCalendarAPI General Roman / US calendar (seasons, colors).
//   https://github.com/Liturgical-Calendar/LiturgicalCalendarAPI
// Offline fallback: src/lectionary/citations.json template.
// Only feast/season/color/citation metadata is used — no copyright issue.

const CPBJR = "https://cpbjr.github.io/catholic-readings-api";
const LITCAL = "https://litcal.johnromanodorazio.com/api/v5";
const memCache = {};

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function toMD(d) {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------- primary: cpbjr ----------
async function fetchCpbjr(date) {
  const iso = toISO(date);
  const md = toMD(date);
  const year = date.getFullYear();
  const key = `cpbjr.${iso}`;
  if (memCache[key]) return memCache[key];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const j = JSON.parse(raw);
      memCache[key] = j;
      return j;
    }
  } catch {}
  const [r1, r2] = await Promise.all([
    fetch(`${CPBJR}/readings/${year}/${md}.json`),
    fetch(`${CPBJR}/liturgical-calendar/${year}/${md}.json`),
  ]);
  if (!r1.ok && !r2.ok) throw new Error("cpbjr http");
  const readings = r1.ok ? await r1.json() : null;
  const cal = r2.ok ? await r2.json() : null;
  const out = { readings, cal };
  memCache[key] = out;
  try { localStorage.setItem(key, JSON.stringify(out)); } catch {}
  return out;
}

// ---------- fallback: LiturgicalCalendarAPI ----------
async function fetchLitCalYear(nation, year, lang) {
  const key = `litcal.${nation}.${year}`;
  if (memCache[key]) return memCache[key];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const j = JSON.parse(raw);
      if (Date.now() - j.savedAt < 30 * 86400000) {
        memCache[key] = j.events;
        return j.events;
      }
    }
  } catch {}
  const r = await fetch(`${LITCAL}/calendar/nation/${nation}/${year}`, {
    headers: { "Accept": "application/json", "Accept-Language": lang === "en" ? "en" : "es" },
  });
  if (!r.ok) throw new Error("litcal http " + r.status);
  const j = await r.json();
  const events = j.litcal || j || [];
  memCache[key] = events;
  try { localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), events })); } catch {}
  return events;
}

async function getLitCalEvent(date, nation = "US", lang = "es") {
  let events;
  try {
    events = await fetchLitCalYear(nation, date.getFullYear(), lang);
  } catch {
    return null;
  }
  const iso = toISO(date);
  const ev = events.find(e => typeof e.date === "string" && e.date.slice(0, 10) === iso && !e.is_vigil_mass);
  return ev || events.find(e => typeof e.date === "string" && e.date.slice(0, 10) === iso) || null;
}

const COLOR_ES = { green: "verde", purple: "morado", white: "blanco", red: "rojo", rose: "rosa", blue: "azul", black: "negro", gold: "dorado" };

// Unified day data. Returns null only when fully offline with no cache.
export async function getDayData(date = new Date(), nation = "US", lang = "es") {
  try {
    const { readings, cal } = await fetchCpbjr(date);
    if (readings || cal) {
      const c = readings?.readings || {};
      const citations = {};
      if (c.firstReading) citations.first = c.firstReading;
      if (c.psalm) citations.psalm = c.psalm;
      if (c.secondReading) citations.second = c.secondReading;
      if (c.gospel) citations.gospel = c.gospel;
      return {
        source: "cpbjr",
        feast: cal?.celebration?.name || "",
        rank: cal?.celebration?.type || "",
        season: readings?.season || cal?.season || "",
        color: "",
        citations: Object.keys(citations).length ? citations : null,
        quote: cal?.celebration?.quote || "",
        saintDesc: cal?.celebration?.description || "",
        saintImage: cal?.celebration?.image || "",
        usccbLink: readings?.usccbLink || "",
      };
    }
  } catch {}
  const ev = await getLitCalEvent(date, nation, lang);
  if (!ev) return null;
  const r = ev.readings || {};
  const citations = {};
  if (r.first_reading) citations.first = r.first_reading;
  if (r.responsorial_psalm) citations.psalm = r.responsorial_psalm;
  if (r.second_reading) citations.second = r.second_reading;
  if (r.gospel) citations.gospel = r.gospel;
  const colorEn = (ev.color && ev.color[0]) || "";
  return {
    source: "litcal",
    feast: ev.name || "",
    rank: ev.grade_lcl || "",
    season: ev.liturgical_season_lcl || ev.liturgical_season || "",
    color: lang === "en" ? colorEn : (COLOR_ES[colorEn] || colorEn),
    citations: Object.keys(citations).length ? citations : null,
    quote: "",
    saintDesc: "",
    saintImage: "",
    usccbLink: "",
  };
}
