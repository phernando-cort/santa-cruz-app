// Capa offline: calendario litúrgico + citas dominicales/de fiesta sin red.
// Fuente vendorizada: src/vendor/lectionary-data.js (BryceHuntsman/LectionaryProject,
// expone window.LectionaryModule). Todo se calcula en el dispositivo con el
// computus de Pascua: cualquier año, sin servidor y sin caché que caduque.
// Cubre domingos + solemnidades/fiestas (66 días/año); los días de semana
// ordinarios siguen vía USCCB bajo demanda.

function mod() {
  return (typeof window !== "undefined" && window.LectionaryModule) || null;
}
export function offlineAvailable() { return !!mod(); }

function utcMidnightOfIso(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
}
// El "endYear" es el año civil en que termina el año litúrgico:
// si la fecha cae en/tras el Adviento 1 del ciclo siguiente, +1.
export function endYearForIso(iso) {
  const M = mod();
  const t = utcMidnightOfIso(iso);
  if (!M || t == null) return new Date().getFullYear();
  const y = +String(iso).slice(0, 4);
  const next = M.LiturgicalCalendar.getLiturgicalYear(y + 1);
  if (t >= next.dates.advent1.getTime()) return y + 1;
  return y;
}

const yearCache = new Map();
function yearData(endYear) {
  if (!yearCache.has(endYear)) {
    const M = mod();
    if (!M) return null;
    const { liturgicalYear, slots } = M.buildSlots(endYear);
    const byDate = new Map(slots.map(s => [s.date.getTime(), s]));
    yearCache.set(endYear, { ly: liturgicalYear, slots, byDate });
  }
  return yearCache.get(endYear);
}

// Datos litúrgicos exactos para una fecha ISO: temporada, ciclo (A/B/C),
// color, y —si el día está en la tabla— nombre, rango y citas.
export function offlineFor(iso) {
  const M = mod();
  if (!M) return null;
  const t = utcMidnightOfIso(iso);
  if (t == null) return null;
  const yd = yearData(endYearForIso(iso));
  if (!yd) return null;
  const season = M.seasonOf(new Date(t), yd.ly);
  const base = { iso, season, cycle: yd.ly.cycle, color: null, colorLabel: null, slot: null };
  const seasonEntry = yd.ly.seasons.find(s => {
    const st = (s.start instanceof Date ? s.start : new Date(s.start)).getTime();
    const en = (s.end instanceof Date ? s.end : new Date(s.end)).getTime();
    return t >= st && t <= en;
  });
  if (seasonEntry) {
    base.color = seasonEntry.color || null;
    base.colorLabel = (M.COLOR_LABEL && M.COLOR_LABEL[seasonEntry.color]) || seasonEntry.color;
  }
  const slot = yd.byDate.get(t);
  if (!slot) return base;
  const r = M.readingsForCycle(slot, yd.ly.cycle) || {};
  const txt = (v) => M.readingText(v, yd.ly.cycle);
  base.slot = {
    name: slot.name, rank: slot.rank || "", kind: slot.kind || "",
    color: slot.color || base.color, id: slot.id,
    readings: { first: txt(r.first), psalm: txt(r.psalm), second: txt(r.second), gospel: txt(r.gospel) },
  };
  if (slot.color) base.color = slot.color;
  return base;
}
export function seasonToday() {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return offlineFor(iso);
}
