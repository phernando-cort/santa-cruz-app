// Calendario Google de la parroquia: eventos de la semana + Misas especiales.
// Fuentes: (1) semilla empaquetada src/gcal-seed.json (4 calendarios que dio la
// parroquia); (2) calendario público oficial en vivo (el mismo de hcccsantacruz.org/events).
// Todo se maneja en hora local de Santa Cruz (America/Denver) como texto "YYYY-MM-DDTHH:MM"
// para no pelear con zonas horarias.
const LIVE_ICS = "https://calendar.google.com/calendar/ical/03b3305caca18d5cf5d093d17bca6beae8abd2fe85299b51755b412799025a40%40group.calendar.google.com/public/basic.ics";
const LIVE_CACHE_KEY = "gcal.live.v1"; // {ts, ics}
const LIVE_TTL = 6 * 3600 * 1000;

function unfold(t) { return String(t || "").replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n"); }
function unesc(s) { return String(s || "").replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
function nthDow(y, mo, n, dow) {
  if (n > 0) { let c = 0; for (let d = 1; d <= 31; d++) { const t = new Date(Date.UTC(y, mo - 1, d)); if (t.getUTCMonth() !== mo - 1) break; if (t.getUTCDay() === dow) { c++; if (c === n) return d; } } return -1; }
  for (let d = 31; d >= 1; d--) { const t = new Date(Date.UTC(y, mo - 1, d)); if (t.getUTCMonth() !== mo - 1) continue; if (t.getUTCDay() === dow) return d; } return -1;
}
function denverOffset(utcMs) {
  const y = new Date(utcMs).getUTCFullYear();
  const start = Date.UTC(y, 2, nthDow(y, 3, 2, 0), 9, 0, 0);
  const end = Date.UTC(y, 10, nthDow(y, 11, 1, 0), 8, 0, 0);
  return (utcMs >= start && utcMs < end) ? -6 : -7;
}
function wallOf(dtval) {
  const m = String(dtval || "").match(/^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  if (!m[4]) return { date: `${m[1]}-${m[2]}-${m[3]}` };
  if (/Z$/.test(dtval)) {
    const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[5], +(m[6] || "0"));
    const w = new Date(utc + denverOffset(utc) * 3600 * 1000);
    const p = (n) => String(n).padStart(2, "0");
    return { wall: `${w.getUTCFullYear()}-${p(w.getUTCMonth() + 1)}-${p(w.getUTCDate())}T${p(w.getUTCHours())}:${p(w.getUTCMinutes())}` };
  }
  return { wall: `${m[1]}-${m[2]}-${m[3]}T${m[5]}:${m[6] || "00"}` };
}
export function parseICS(txt) {
  const lines = unfold(txt);
  const rules = [], singles = [], overrides = [];
  let inTZ = false, cur = null;
  const push = () => {
    if (!cur) return;
    if (cur.status === "CANCELLED") { cur = null; return; }
    const s = wallOf(cur.dtstart), e = cur.dtend ? wallOf(cur.dtend) : null;
    if (!s) { cur = null; return; }
    const rec = { t: unesc(cur.summary).slice(0, 140), s: (s.wall || s.date), e: (e ? (e.wall || e.date) : ""), l: unesc(cur.location).slice(0, 80), d: unesc(cur.description).slice(0, 240) };
    if (!rec.t) { cur = null; return; }
    if (cur.recid) { const r = wallOf(cur.recid); if (r) overrides.push({ u: cur.uid, for: (r.wall || r.date).slice(0, 10), ...rec }); }
    else if (cur.rrule) rules.push({ u: cur.uid, ...rec, r: cur.rrule, x: cur.exdates || [] });
    else singles.push(rec);
    cur = null;
  };
  for (const ln of lines) {
    if (ln === "BEGIN:VTIMEZONE") { inTZ = true; continue; }
    if (ln === "END:VTIMEZONE") { inTZ = false; continue; }
    if (inTZ) continue;
    if (ln === "BEGIN:VEVENT") { cur = { exdates: [] }; continue; }
    if (ln === "END:VEVENT") { push(); continue; }
    if (!cur) continue;
    const i = ln.indexOf(":"); if (i < 0) continue;
    const head = ln.slice(0, i), v = ln.slice(i + 1);
    if (head === "SUMMARY") cur.summary = v;
    else if (head.startsWith("DTSTART")) cur.dtstart = v;
    else if (head.startsWith("DTEND")) cur.dtend = v;
    else if (head === "LOCATION") cur.location = v;
    else if (head === "DESCRIPTION") cur.description = (cur.description ? cur.description + "\n" : "") + v;
    else if (head === "RRULE") cur.rrule = v;
    else if (head === "UID") cur.uid = v;
    else if (head === "STATUS") cur.status = v;
    else if (head.startsWith("RECURRENCE-ID")) cur.recid = v;
    else if (head.startsWith("EXDATE")) for (const p of v.split(",")) { const w = wallOf(p); if (w) cur.exdates.push((w.wall || w.date).slice(0, 10)); }
  }
  return { rules, singles, overrides };
}
const DOWMAP = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
function parseRRule(r) {
  const o = {};
  for (const p of String(r || "").split(";")) { const i = p.indexOf("="); if (i > 0) o[p.slice(0, i)] = p.slice(i + 1); }
  return o;
}
function daysInMonth(y, mo) { return new Date(Date.UTC(y, mo, 0)).getUTCDate(); }
function expandRule(rule, fromD, toD) {
  // fromD/toD: "YYYY-MM-DD". Devuelve [{date, s, e}] con s/e en hora local.
  const out = [];
  const rr = parseRRule(rule.r);
  const sDate = rule.s.slice(0, 10), sTime = rule.s.length > 10 ? rule.s.slice(11, 16) : "";
  const eTime = rule.e && rule.e.length > 10 ? rule.e.slice(11, 16) : "";
  const mk = (date) => ({ date, s: sTime ? `${date}T${sTime}` : date, e: eTime ? `${date}T${eTime}` : "" });
  const until = rr.UNTIL ? String(rr.UNTIL).slice(0, 10).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") : null;
  const count = rr.COUNT ? parseInt(rr.COUNT, 10) : Infinity;
  const interval = Math.max(1, parseInt(rr.INTERVAL || "1", 10));
  const ex = new Set(rule.x || []);
  let n = 0;
  const accept = (date) => {
    if (date < sDate || date > toD || ex.has(date)) return;
    if (until && date > until) return;
    if (date >= fromD) { out.push(mk(date)); }
    n++;
  };
  const stop = () => n >= count;
  if (rr.FREQ === "DAILY") {
    let d = sDate;
    while (d <= toD && !stop()) {
      if (until && d > until) break;
      // avanzar por intervalo desde sDate
      accept(d);
      d = addDays(d, interval);
    }
  } else if (rr.FREQ === "WEEKLY") {
    const days = (rr.BYDAY ? rr.BYDAY.split(",").map((x) => DOWMAP[x]) : [dowOf(sDate)]).sort();
    // recorrer semanas desde la semana de sDate
    let weekStart = addDays(sDate, -((dowOf(sDate) + 6) % 7)); // lunes
    let wi = 0;
    while (true) {
      if (wi % interval === 0) {
        for (const dw of days) {
          const d = addDays(weekStart, (dw + 6) % 7);
          if (d > toD) return out;
          if (d >= sDate) { accept(d); if (stop()) return out; }
        }
      }
      weekStart = addDays(weekStart, 7); wi++;
      if (weekStart > toD) break;
      if (until && weekStart > until) break;
    }
  } else if (rr.FREQ === "MONTHLY" && rr.BYDAY) {
    // BYDAY=1FR / 3TH / -1MO (puede traer varios: tomar cada uno)
    const parts = rr.BYDAY.split(",");
    let [y, mo] = sDate.split("-").map(Number);
    const [ey, emo] = toD.split("-").map(Number);
    let mi = 0;
    while (y < ey || (y === ey && mo <= emo)) {
      if (mi % interval === 0) {
        for (const p of parts) {
          const mm = p.match(/^(-?\d)([A-Z]{2})$/);
          if (!mm) continue;
          const day = nthDow(y, mo, parseInt(mm[1], 10), DOWMAP[mm[2]]);
          if (day < 0) continue;
          const d = `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          if (d >= sDate && d <= toD) { accept(d); if (stop()) return out; }
        }
      }
      mi++; mo++; if (mo > 12) { mo = 1; y++; }
      if (`${y}-${String(mo).padStart(2, "0")}` > toD.slice(0, 7)) break;
      if (until && `${y}-${String(mo).padStart(2, "0")}-01` > until) break;
    }
  } else if (rr.FREQ === "YEARLY") {
    const [sy] = sDate.split("-").map(Number);
    const [ey] = toD.split("-").map(Number);
    for (let y = sy; y <= ey; y += interval) {
      let d;
      if (rr.BYMONTH && rr.BYDAY) {
        const mm = String(rr.BYDAY).match(/^(-?\d)([A-Z]{2})$/);
        if (!mm) continue;
        const day = nthDow(y, parseInt(rr.BYMONTH, 10), parseInt(mm[1], 10), DOWMAP[mm[2]]);
        if (day < 0) continue;
        d = `${y}-${String(parseInt(rr.BYMONTH, 10)).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      } else d = `${y}${sDate.slice(4)}`;
      if (d >= sDate && d <= toD) { accept(d); if (stop()) return out; }
      if (until && d > until) break;
    }
  } else {
    // FREQ no soportado: al menos la primera instancia
    if (sDate >= fromD && sDate <= toD) out.push(mk(sDate));
  }
  return out;
}
function dowOf(iso) { return new Date(iso + "T12:00:00").getDay(); }
function addDays(iso, k) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function superFetchFn() { const g = globalThis; return (g.root && g.root.superFetch) || g.superFetch || null; }

let seedCache = null;
export async function loadSeed() {
  if (seedCache) return seedCache;
  const url = new URL("./gcal-seed.json", import.meta.url).toString();
  const r = await fetch(url);
  seedCache = await r.json();
  return seedCache;
}
export async function loadLiveICS() {
  try {
    const raw = localStorage.getItem(LIVE_CACHE_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.ts && Date.now() - c.ts < LIVE_TTL && c.ics) return c.ics;
    }
  } catch {}
  const sf = superFetchFn();
  try {
    const r = sf ? await sf(LIVE_ICS) : await fetch(LIVE_ICS);
    const txt = await r.text();
    if (txt && txt.includes("BEGIN:VCALENDAR")) {
      try { localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({ ts: Date.now(), ics: txt.slice(0, 600000) })); } catch {}
      return txt;
    }
  } catch {}
  try { const raw = localStorage.getItem(LIVE_CACHE_KEY); if (raw) return JSON.parse(raw).ics || null; } catch {}
  return null;
}
const normT = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9áéíóúñü ]/gi, "").replace(/\s+/g, " ").trim();
// Lo que NUNCA sale en la app, aunque venga en el calendario Google:
// otras sedes (Santuario, Sagrada Familia / Holy Family) y citas personales
// del padre (anulaciones, visitas/citas particulares, day off, bloques internos).
// Solo eventos, Misas y actividades de la parroquia.
export function isExcludedCal(t, l, d) {
  const s = `${t || ""} ${l || ""} ${d || ""}`;
  if (/santuario|sanctuary/i.test(s)) return true;
  if (/holy family|sagrada familia|\bHFP\b/i.test(s)) return true;
  if (/annul|anulaci/i.test(s)) return true;
  if (/\bday off\b|d[ií]a libre/i.test(s)) return true;
  if (/\bappointment\b|\bcita\b|\bmeeting with\b|\breuni[oó]n con\b|\bvisita de\b/i.test(s)) return true;
  if (/^hccc confession/i.test(String(t || "").trim())) return true;
  return false;
}
// Misas de rutina (ya tienen sus bloques): se excluyen de "eventos".
// Las especiales (funeral, aniversario...) NO son rutina: van aparte.
export function isRoutineMass(t) {
  const s = String(t || "");
  if (/mass intentions/i.test(s)) return true;
  if (/lunch|day off/i.test(s)) return true;
  if (/mass|misa|eucharist|eucarist/i.test(s) && !isSpecialMass(s)) return true;
  return false;
}
// Misas especiales por las que orar: funeral, aniversario, boda, quinceañera, confirmación...
export function isSpecialMass(t) {
  return /funeral|annivers|aniversa|wedding|boda|quince|confirmaci|bautizo|baptism|novena|gallo|first communion|primera comuni|easter|triduum|christmas|navidad|lent|cuaresma|ceniza|holy week|semana santa|difuntos|all souls|memorial mass|misa de (difuntos|rito|aceptaci)/i.test(String(t || ""));
}
// Reuniones de grupos y ministerios.
export function isGroupMeeting(t) {
  return /rosary|rosario|bible|biblia|rica|ocia|coro|choir|music ministry|cda|daughters|caballeros|knights|j_soc|youth|j[uú]venes|oasis|ministry|ministerio|meeting|reuni[oó]n|rehearsal|ensayo|class|clase|faith formation|formaci[oó]n|conferencia|conference|retiro|retreat|adoration|adoraci|holy hour|hora santa|confession|confesi[oó]n|office|oficina|food|despensa|soup|donuts|donas|coffee|caf[eé]/i.test(String(t || ""));
}
export function fmtTime(wall) {
  const m = String(wall || "").match(/T(\d{2}):(\d{2})/);
  if (!m) return "";
  let h = +m[1]; const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
  return `${h}:${m[2]} ${ap}`;
}
const DOW_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function fmtDay(date, en) {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${(en ? DOW_EN : DOW_ES)[dow]} ${d}`;
}
export function denverNow() {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const g = (k) => parts.find((p) => p.type === k).value;
    return { date: `${g("year")}-${g("month")}-${g("day")}`, wall: `${g("year")}-${g("month")}-${g("day")}T${g("hour") === "24" ? "00" : g("hour")}:${g("minute")}` };
  } catch { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, wall: "9999" }; }
}
function dedupe(evs) {
  // Si el mismo evento está en vivo y en la semilla, gana el calendario en
  // vivo (oficial y actualizado); la semilla solo rellena lo que falte.
  const liveKeys = new Set();
  for (const e of evs) if (e.live) liveKeys.add(`${e.date}|${normT(e.t).slice(0, 28)}`);
  const seen = {}, out = [];
  for (const e of evs) {
    if (!e.live && liveKeys.has(`${e.date}|${normT(e.t).slice(0, 28)}`)) continue;
    const k = `${e.date}|${e.s.slice(11, 16)}|${normT(e.t).slice(0, 28)}`;
    if (seen[k]) { if ((e.d || "").length > (seen[k].d || "").length) seen[k].d = e.d; if (!seen[k].l && e.l) seen[k].l = e.l; continue; }
    seen[k] = e; out.push(e);
  }
  return out;
}
// Eventos próximos (hoy → +7 días), ordenados. Incluye todo menos Misas de rutina.
export async function getRangeEvents(fromD, toD) {
  const seed = await loadSeed().catch(() => null);
  let rules = [], singles = [], overrides = [];
  if (seed) { rules = rules.concat(seed.rules || []); singles = singles.concat(seed.singles || []); overrides = overrides.concat(seed.overrides || []); }
  const live = await loadLiveICS();
  if (live) {
    const p = parseICS(live);
    for (const r of p.rules) r.live = true;
    for (const s of p.singles) s.live = true;
    for (const o of p.overrides) o.live = true;
    rules = rules.concat(p.rules); singles = singles.concat(p.singles); overrides = overrides.concat(p.overrides);
  }
  const overByKey = {};
  for (const o of overrides) overByKey[`${o.u}|${o.for}`] = o;
  let evs = [];
  const now = denverNow();
  const skipPast = fromD === now.date; // solo filtrar lo ya pasado si el rango empieza hoy
  for (const sg of singles) {
    const date = sg.s.slice(0, 10);
    if (date < fromD || date > toD) continue;
    if (isExcludedCal(sg.t, sg.l, sg.d)) continue;
    if (skipPast && sg.e && sg.e < now.wall && date === fromD) continue;
    evs.push({ date, s: sg.s, e: sg.e, t: sg.t, l: sg.l, d: sg.d, src: "cal", live: !!sg.live });
  }
  for (const r of rules) {
    for (const occ of expandRule(r, fromD, toD)) {
      const ov = r.u ? overByKey[`${r.u}|${occ.date}`] : null;
      const ev = ov || { t: r.t, l: r.l, d: r.d };
      if (isExcludedCal(ev.t, ev.l, ev.d)) continue;
      const s = ov ? ov.s : occ.s, e = ov ? ov.e : occ.e;
      if (skipPast && occ.date === fromD && e && e < now.wall) continue;
      if (skipPast && occ.date === fromD && s && s < now.wall && (!e || e <= s)) continue;
      evs.push({ date: occ.date, s, e, t: ev.t, l: ev.l, d: ev.d, src: "cal", live: !!(ov ? ov.live : r.live) });
    }
  }
  evs = dedupe(evs).sort((a, b) => (a.s < b.s ? -1 : 1));
  return { events: evs, live: !!live };
}
export async function getWeekEvents() {
  const now = denverNow();
  return getRangeEvents(now.date, addDays(now.date, 7));
}
