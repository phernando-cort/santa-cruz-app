// Contenidos editables del sitio — para que el editor corrija TODO sin tocar código.
//
// Cómo funciona:
// - Todo lo que antes estaba fijo en `src/data.js`, `src/calendario-extra.js` y
//   `src/parish-schedule.js` se re-exporta desde aquí como bindings vivos.
// - Si hay un override guardado (nube Supabase `site_content` o caché local),
//   el override reemplaza al valor fijo. "Restablecer" vuelve al valor original.
// - La app (src/app.js) importa de aquí en vez de data.js/calendario-extra.js.
// - Permiso: solo quien pueda editar (admin o editor). Ver `Content.can`.
import * as D from "./data.js";
import { REAL_EVENTS as _RE, DATED_SEEDS as _DS, BULLETIN_FALLBACK as _BF,
  SACRAMENT_INFO as _SI, PARISH_YT as _PYT, PARISH_BULLETIN_PAGE as _PBP } from "./calendario-extra.js";
import { CLOUD } from "./cloud-config.js";

// ---- re-export fijo (lógica, no editable) ----
export const ROSARY_MYSTERIES = D.ROSARY_MYSTERIES;
export const mysteriesForWeekday = D.mysteriesForWeekday;

// ---- bindings vivos (editables vía overrides) ----
export let PARISHES = D.PARISHES;
export let WEEK = D.WEEK;
export let WEEK_EN = D.WEEK_EN;
export let INSPIRATIONS = D.INSPIRATIONS;
export let INSP_EN = D.INSP_EN;
export let PRAYERS = D.PRAYERS;
export let EVENTS = D.EVENTS;
export let BULLETINS = D.BULLETINS;
export let GROUPS = D.GROUPS;
export let CLERGY = D.CLERGY;
export let MESSAGES = D.MESSAGES;
export let CATEGORIES = D.CATEGORIES;
export let SAINTS = D.SAINTS;
export let CANTOS = D.CANTOS;
export let NEWS = D.NEWS;
export let MINISTRY_ROLES = D.MINISTRY_ROLES;
export let MINISTRY_SEED = D.MINISTRY_SEED;
export let FIELES_SEED = D.FIELES_SEED;
export let MURO_SEED = D.MURO_SEED;
export let INTENCIONES_SEED = D.INTENCIONES_SEED;
export let ART = D.ART;
export let DIRECTORY_SEED = D.DIRECTORY_SEED;
export let GIVING_PROJECTS = D.GIVING_PROJECTS;
export let REAL_EVENTS = _RE;
export let DATED_SEEDS = _DS;
export let BULLETIN_FALLBACK = _BF;
export let SACRAMENT_INFO = _SI;
export let PARISH_YT = _PYT;
export let PARISH_BULLETIN_PAGE = _PBP;

// key -> { kind, apply(v), current(), check(v) }
const REG = {
  "parishes":       { kind: "parishes", apply: v => { PARISHES = v; }, current: () => PARISHES,
                      check: v => Array.isArray(v) && v.length && v.every(p => p && p.id && p.name) ? "" : "Debe ser una lista con {id, name, ...}" },
  "events.seed":    { kind: "events", apply: v => { EVENTS = v; }, current: () => EVENTS, check: checkEvents },
  "events.real":    { kind: "events", apply: v => { REAL_EVENTS = v; }, current: () => REAL_EVENTS, check: checkEvents },
  "events.dated":   { kind: "events", apply: v => { DATED_SEEDS = v; }, current: () => DATED_SEEDS, check: checkEvents },
  "schedule":       { kind: "schedule", apply: () => {}, current: () => Content.data["schedule"] || null,
                      check: v => v && typeof v === "object" && v.masses && typeof v.masses === "object" ? "" : "Debe ser {masses: {\"2026-12-12\": [...]}}" },
  "links":          { kind: "json", apply: v => { PARISH_YT = v.yt; PARISH_BULLETIN_PAGE = v.bulletin; },
                      current: () => ({ yt: PARISH_YT, bulletin: PARISH_BULLETIN_PAGE }),
                      check: v => v && typeof v.yt === "string" && typeof v.bulletin === "string" ? "" : "Debe ser {yt, bulletin}" },
  "bulletin.fallback": { kind: "json", apply: v => { BULLETIN_FALLBACK = v; }, current: () => BULLETIN_FALLBACK, check: isObj },
  "sacraments":     { kind: "json", apply: v => { SACRAMENT_INFO = v; }, current: () => SACRAMENT_INFO,
                      check: v => v && Array.isArray(v.es) && Array.isArray(v.en) ? "" : "Debe ser {es: [...], en: [...]}" },
  "inspirations":   { kind: "json", apply: v => { INSPIRATIONS = v.es; INSP_EN = v.en; },
                      current: () => ({ es: INSPIRATIONS, en: INSP_EN }),
                      check: v => v && Array.isArray(v.es) && Array.isArray(v.en) ? "" : "Debe ser {es: [...], en: [...]}" },
  "week":           { kind: "form", apply: v => { WEEK = v.es; WEEK_EN = v.en; }, current: () => ({ es: WEEK, en: WEEK_EN }),
                      check: v => v && Array.isArray(v.es) && v.es.length === 7 && v.en && typeof v.en === "object" && !Array.isArray(v.en) ? "" : "Faltan días de la semana" },
  "prayers.trad":   { kind: "json", apply: v => { PRAYERS = v; }, current: () => PRAYERS, check: isArr },
  "clergy":         { kind: "json", apply: v => { CLERGY = v; }, current: () => CLERGY, check: isArr },
  "groups":         { kind: "json", apply: v => { GROUPS = v; }, current: () => GROUPS, check: isArr },
  "giving":         { kind: "json", apply: v => { GIVING_PROJECTS = v; }, current: () => GIVING_PROJECTS, check: isArr },
  "news.seed":      { kind: "json", apply: v => { NEWS = v; }, current: () => NEWS, check: isArr },
  "bulletins.seed": { kind: "json", apply: v => { BULLETINS = v; }, current: () => BULLETINS, check: isArr },
  "messages.seed":  { kind: "json", apply: v => { MESSAGES = v; }, current: () => MESSAGES, check: isArr },
  "cantos.seed":    { kind: "json", apply: v => { CANTOS = v; }, current: () => CANTOS, check: isArr },
  "saints":         { kind: "json", apply: v => { SAINTS = v; }, current: () => SAINTS, check: isArr },
  "muro.seed":      { kind: "json", apply: v => { MURO_SEED = v; }, current: () => MURO_SEED, check: isArr },
  "intenciones.seed": { kind: "json", apply: v => { INTENCIONES_SEED = v; }, current: () => INTENCIONES_SEED, check: isArr },
  "directory.seed": { kind: "json", apply: v => { DIRECTORY_SEED = v; }, current: () => DIRECTORY_SEED, check: isArr },
  "ministry.seed":  { kind: "json", apply: v => { MINISTRY_SEED = v; }, current: () => MINISTRY_SEED, check: isObj },
  "ministry.roles": { kind: "json", apply: v => { MINISTRY_ROLES = v; }, current: () => MINISTRY_ROLES, check: isArr },
  "fieles":         { kind: "json", apply: v => { FIELES_SEED = v; }, current: () => FIELES_SEED, check: isArr },
  "art":            { kind: "json", apply: v => { ART = v; }, current: () => ART, check: isObj },
  "categories":     { kind: "json", apply: v => { CATEGORIES = v; }, current: () => CATEGORIES, check: isArr },
};
function isArr(v){ return Array.isArray(v) ? "" : "Debe ser una lista [...]"; }
function isObj(v){ return v && typeof v === "object" && !Array.isArray(v) ? "" : "Debe ser un objeto {...}"; }
function checkEvents(v){
  if(!Array.isArray(v)) return "Debe ser una lista [...]";
  for(const e of v){ if(!e || !e.id || !e.title) return "Cada evento necesita al menos {id, title}"; }
  return "";
}

export const CONTENT_TITLES = {
  "parishes": "⛪ Parroquia y horarios de Misa",
  "events.seed": "📅 Eventos semanales",
  "events.real": "📅 Eventos verificados",
  "events.dated": "📅 Fechas únicas y fiestas",
  "schedule": "⛪ Misas e intenciones por fecha",
  "links": "🔗 Enlaces (YouTube, boletín)",
  "bulletin.fallback": "📄 Boletín de respaldo",
  "sacraments": "🤲 Sacramentos y oficina (ES+EN)",
  "inspirations": "✨ Inspiraciones (ES+EN)",
  "week": "📖 Lecturas semanales (ES+EN)",
  "prayers.trad": "🙏 Oraciones tradicionales",
  "clergy": "⛪ Clero y equipo",
  "groups": "👥 Grupos y ministerios (lista)",
  "giving": "💛 Proyectos de donativos",
  "news.seed": "🌎 Noticias iniciales",
  "bulletins.seed": "📄 Boletines iniciales",
  "messages.seed": "🔔 Avisos iniciales",
  "cantos.seed": "🎵 Cantos base",
  "saints": "✨ Santoral base",
  "muro.seed": "🧱 Muro inicial",
  "intenciones.seed": "🎉 Intenciones iniciales",
  "directory.seed": "📇 Directorio inicial",
  "ministry.seed": "🙌 Quién sirve en cada Misa",
  "ministry.roles": "🙌 Nombres de roles",
  "fieles": "👥 Lista de fieles ejemplo",
  "art": "🖼️ Imágenes (URLs)",
  "categories": "🏷️ Categorías",
};
export const CONTENT_ORDER = ["parishes","events.seed","events.real","events.dated","schedule","links","sacraments","bulletin.fallback","clergy","groups","giving","news.seed","bulletins.seed","messages.seed","muro.seed","intenciones.seed","directory.seed","ministry.seed","cantos.seed","prayers.trad","inspirations","week","saints","art","categories","ministry.roles","fieles"];

// Misas de una fecha: override (editor) gana al generado (parish-schedule.js).
export function schedMasses(iso){
  const o = Content.data["schedule"];
  if(o && o.masses && o.masses[iso]) return o.masses[iso];
  return schedBaseMasses(iso);
}
export function schedBaseMasses(iso){
  try {
    const w = (typeof window !== "undefined" && window.ParishSchedule) || null;
    return (w && w.masses && w.masses[iso]) || [];
  } catch(e){ return []; }
}
export function schedAllDates(){
  const set = new Set();
  try {
    const w = (typeof window !== "undefined" && window.ParishSchedule) || null;
    if(w && w.masses) Object.keys(w.masses).forEach(d => set.add(d));
  } catch(e){}
  const o = Content.data["schedule"];
  if(o && o.masses) Object.keys(o.masses).forEach(d => set.add(d));
  return [...set].sort();
}
export function schedOverridden(iso){
  const o = Content.data["schedule"];
  return !!(o && o.masses && o.masses[iso]);
}

const CACHE_KEY = "content.cache.v1";
function readCache(){
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    for(const k of Object.keys(c)){ if(REG[k]){ try { REG[k].apply(c[k]); Content.data[k] = c[k]; } catch(e){} } }
  } catch(e){}
}
function writeCache(){
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(Content.data)); } catch(e){}
}
readCache();

export const Content = {
  data: (() => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch(e){ return {}; } })(),
  ready: false, error: "",
  can: null,       // () => bool — lo asigna app.js (admin o editor)
  onChange: null,  // () => void — lo asigna app.js (repintar)
  _client: null,
  overridden(key){ return Object.prototype.hasOwnProperty.call(this.data, key); },
  get(key){ return this.data[key]; },
  currentOf(key){ const def = REG[key]; if(!def) return undefined; try { return def.current(); } catch(e){ return undefined; } },
  async load(){
    if(!CLOUD || !CLOUD.SUPABASE_URL || !CLOUD.SUPABASE_ANON_KEY){
      this.ready = true; return;
    }
    try {
      if(!this._client){
        const mod = await import("https://esm.sh/@supabase/supabase-js@2");
        const ctl = (u, o) => {
          try {
            const c = new AbortController(), t = setTimeout(() => { try { c.abort(); } catch(e){} }, 20000);
            return fetch(u, Object.assign({}, o, { signal: c.signal })).then(
              r => { clearTimeout(t); return r; },
              e => { clearTimeout(t); throw e; });
          } catch(e){ return fetch(u, o); }
        };
        this._client = mod.createClient(CLOUD.SUPABASE_URL, CLOUD.SUPABASE_ANON_KEY, { global: { fetch: ctl } });
      }
      const res = await this._client.from("site_content").select("key,body").limit(100);
      if(res.error) throw res.error;
      for(const r of (res.data || [])){
        if(r && REG[r.key]){
          try { REG[r.key].apply(r.body); this.data[r.key] = r.body; } catch(e){}
        }
      }
      writeCache();
      this.ready = true;
      if(this.onChange){ try { this.onChange(); } catch(e){} }
      try {
        this._client.channel("site-content")
          .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, () => {
            clearTimeout(this._rt);
            this._rt = setTimeout(() => this.load().catch(() => {}), 1200);
          })
          .subscribe();
      } catch(e){}
    } catch(e){
      this.error = String((e && e.message) || e);
      this.ready = true;
    }
  },
  async save(key, val){
    const def = REG[key];
    if(!def) throw new Error("bad_key");
    if(this.can && !this.can()) throw new Error("editors");
    const err = def.check ? def.check(val) : "";
    if(err) throw new Error(err);
    const js = JSON.stringify(val);
    if(js.length > 200000) throw new Error("too_large");
    if(this._client || (CLOUD && CLOUD.SUPABASE_URL && CLOUD.SUPABASE_ANON_KEY)){
      if(!this._client){
        const mod = await import("https://esm.sh/@supabase/supabase-js@2");
        this._client = mod.createClient(CLOUD.SUPABASE_URL, CLOUD.SUPABASE_ANON_KEY);
      }
      const res = await this._client.from("site_content").upsert({ key, body: val }, { onConflict: "key" });
      if(res.error) throw new Error("srv");
    }
    def.apply(val);
    this.data[key] = val;
    writeCache();
    if(this.onChange){ try { this.onChange(); } catch(e){} }
    return { ok: 1 };
  },
  async reset(key){
    const def = REG[key];
    if(!def) throw new Error("bad_key");
    if(this.can && !this.can()) throw new Error("editors");
    if(this._client){
      try { await this._client.from("site_content").delete().eq("key", key); } catch(e){}
    }
    delete this.data[key];
    // revertir al valor fijo original
    try {
      const D0 = await import("./data.js");
      const C0 = await import("./calendario-extra.js");
      const back = {
        "parishes": D0.PARISHES, "events.seed": D0.EVENTS, "events.real": C0.REAL_EVENTS,
        "events.dated": C0.DATED_SEEDS, "links": { yt: C0.PARISH_YT, bulletin: C0.PARISH_BULLETIN_PAGE },
        "bulletin.fallback": C0.BULLETIN_FALLBACK, "sacraments": C0.SACRAMENT_INFO,
        "inspirations": { es: D0.INSPIRATIONS, en: D0.INSP_EN }, "week": { es: D0.WEEK, en: D0.WEEK_EN },
        "prayers.trad": D0.PRAYERS, "clergy": D0.CLERGY, "groups": D0.GROUPS, "giving": D0.GIVING_PROJECTS,
        "news.seed": D0.NEWS, "bulletins.seed": D0.BULLETINS, "messages.seed": D0.MESSAGES,
        "cantos.seed": D0.CANTOS, "saints": D0.SAINTS, "muro.seed": D0.MURO_SEED,
        "intenciones.seed": D0.INTENCIONES_SEED, "directory.seed": D0.DIRECTORY_SEED,
        "ministry.seed": D0.MINISTRY_SEED, "ministry.roles": D0.MINISTRY_ROLES,
        "fieles": D0.FIELES_SEED, "art": D0.ART, "categories": D0.CATEGORIES,
      };
      if(key === "schedule"){ /* sin binding: basta con borrar el override */ }
      else if(back[key] !== undefined) def.apply(back[key]);
    } catch(e){}
    writeCache();
    if(this.onChange){ try { this.onChange(); } catch(e){} }
    return { ok: 1 };
  }
};
