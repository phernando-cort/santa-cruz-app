// UI de contenidos editables — COMPARTIDA entre la app y la página de admin.
// No depende de app.js: recibe un ctx { ED, parishId, parishName, refresh }.
import { Content, CONTENT_ORDER, CONTENT_TITLES, PARISHES, CATEGORIES, EVENTS, REAL_EVENTS, DATED_SEEDS,
  schedMasses, schedBaseMasses, schedOverridden } from "./content.js";
import { getLang, t } from "./i18n.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const val = (id) => $(id)?.value.trim() || "";
function toISO(d){ return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function lockNote(){ return `<p class="small">${t("readOnlyNote")}</p>`; }

export const cui = { block: "parishes", pedit: "", evList: "events.seed", evEdit: null, schedDate: "", massEdit: null, jsonKey: "links", jsonText: null, jsonErr: "", evErr: "", err: "" };

// Guardado SIN diálogos (los errores salen en la sección, nunca congelan la página).
export function cSave(promise, done, ctx){
  (async()=>{
    try { await promise; cui.err = ""; if(done) done(); else if(ctx && ctx.refresh) ctx.refresh(); }
    catch(e){
      const m = String((e && e.message) || e || "");
      cui.err = m.includes("editors") ? t("srvNeedName") : m.includes("flood") ? t("srvBusy")
        : (m.includes("srv") || m.includes("net") || m.includes("Failed to fetch"))
          ? (cbEN() ? "Cloud save failed. In Supabase run the site_content SQL (src/cloud/supabase-schema.sql, second part), then retry." : "No se pudo guardar en la nube. En Supabase ejecuta el SQL de site_content (src/cloud/supabase-schema.sql, segunda parte) y reintenta.")
          : m;
      try { if(ctx && ctx.refresh) ctx.refresh(); } catch(e2){}
    }
  })();
  return true;
}

const CB_SHORT = { parishes:"⛪ Parroquia", "events.seed":"📅 Semanales", "events.real":"📅 Verificados", "events.dated":"📅 Fechas únicas", schedule:"⛪ Misas/fecha", links:"🔗 Enlaces", sacraments:"🤲 Sacramentos", "bulletin.fallback":"📄 Boletín", clergy:"⛪ Clero", groups:"👥 Grupos", giving:"💛 Donativos", "news.seed":"🌎 Noticias", "bulletins.seed":"📄 Boletines", "messages.seed":"🔔 Avisos", "cantos.seed":"🎵 Cantos", "prayers.trad":"🙏 Oraciones", inspirations:"✨ Inspiración", week:"📖 Lecturas", saints:"✨ Santos", "muro.seed":"🧱 Muro", "intenciones.seed":"🎉 Intenciones", "directory.seed":"📇 Directorio", "ministry.seed":"🙌 Ministerio", art:"🖼️ Imágenes", categories:"🏷️ Categorías", "ministry.roles":"🙌 Roles", fieles:"👥 Fieles" };
const CB_JSON = ["links","bulletin.fallback","sacraments","inspirations","week","prayers.trad","clergy","groups","giving","news.seed","bulletins.seed","messages.seed","cantos.seed","saints","muro.seed","intenciones.seed","directory.seed","ministry.seed","ministry.roles","fieles","art","categories"];
const CB_DAYS = [["sun","Dom","Sun"],["mon","Lun","Mon"],["tue","Mar","Tue"],["wed","Mié","Wed"],["thu","Jue","Thu"],["fri","Vie","Fri"],["sat","Sáb","Sat"]];
export function cbEN(){ return getLang() === "en"; }
function cEvList(key){ return key === "events.real" ? REAL_EVENTS : key === "events.dated" ? DATED_SEEDS : EVENTS; }
function cOvTag(key){ return Content.overridden(key) ? ` <span class="tag gold">${cbEN() ? "edited" : "editado"}</span>` : ""; }

export function contentMgrHTML(ctx){
  const ED = ctx && ctx.ED;
  const en = cbEN();
  let h = `<section class="card" id="sec-contenido"><h3>✏️ ${en ? "Site content" : "Contenidos"}</h3>
    <p class="sub">${en ? "As an editor you can fix ALL parish info here. Changes reach every phone." : "Como editor puedes corregir TODA la información aquí. Los cambios llegan a todos los teléfonos."}</p>`;
  if(!ED) return h + lockNote() + `</section>`;
  const pid = (ctx && ctx.parishId) || "";
  if(!cui.pedit || !PARISHES.some(p => p.id === cui.pedit)) cui.pedit = PARISHES.some(p => p.id === pid) ? pid : (PARISHES[0] && PARISHES[0].id);
  if(!cui.schedDate || !/^\d{4}-\d{2}-\d{2}$/.test(cui.schedDate)) cui.schedDate = toISO(new Date());
  if(cui.err) h += `<div class="notice">⚠️ ${esc(cui.err)}</div>`;
  h += `<div class="chipRow">${CONTENT_ORDER.map(k => `<button class="fchip ${cui.block === k ? "active" : ""}" data-action="content-block" data-b="${k}">${CB_SHORT[k] || k}${Content.overridden(k) ? " ●" : ""}</button>`).join("")}</div>`;
  if(cui.block === "parishes") h += contentParishHTML();
  else if(cui.block === "schedule") h += contentSchedHTML(ctx && ctx.parishName);
  else if(cui.block && cui.block.indexOf("events.") === 0) h += contentEventsHTML();
  else h += contentJsonHTML(cui.block);
  return h + `</section>`;
}
function contentParishHTML(){
  const en = cbEN();
  const p = PARISHES.find(x => x.id === cui.pedit) || PARISHES[0];
  const mt = p.massTimes || {};
  const ta = (id, arr) => `<textarea id="${id}" rows="3">${esc((arr || []).join("\n"))}</textarea>`;
  return `<div class="chipRow">${PARISHES.map(x => `<button class="fchip ${x.id === p.id ? "active" : ""}" data-action="content-pedit" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join("")}</div>
  ${cOvTag("parishes")}
  <div class="grid2"><div><label>${en ? "Name" : "Nombre"}</label><input id="cp-name" value="${esc(p.name || "")}"></div>
  <div><label>${en ? "City" : "Ciudad"}</label><input id="cp-city" value="${esc(p.city || "")}"></div></div>
  <label>${en ? "Address" : "Dirección"}</label><input id="cp-address" value="${esc(p.address || "")}">
  <div class="grid2"><div><label>${en ? "Phone" : "Teléfono"}</label><input id="cp-phone" value="${esc(p.phone || "")}"></div>
  <div><label>Web</label><input id="cp-web" value="${esc(p.web || "")}" inputmode="url"></div></div>
  <label>${en ? "Priest" : "Párroco"}</label><input id="cp-priest" value="${esc(p.priest || "")}">
  <label>${en ? "Welcome message" : "Bienvenida"}</label><textarea id="cp-greeting" rows="2">${esc(p.greeting || "")}</textarea>
  <div class="grid2"><div><label>${en ? "Sunday Masses (one per line)" : "Misas domingo (una por línea)"}</label>${ta("cp-sun", mt.Sunday)}</div>
  <div><label>${en ? "Saturday (one per line)" : "Sábado (una por línea)"}</label>${ta("cp-sat", mt.Saturday)}</div></div>
  <label>${en ? "Weekdays (one per line)" : "Entre semana (una por línea)"}</label>${ta("cp-daily", mt.Daily)}
  <div class="grid2"><div><label>${en ? "Confessions" : "Confesiones"}</label><input id="cp-conf" value="${esc(p.confession || "")}"></div>
  <div><label>${en ? "Adoration" : "Adoración"}</label><input id="cp-ador" value="${esc(p.adoration || "")}"></div></div>
  <div class="btnRow"><button class="btn btnNavy" data-action="content-parish-save">${en ? "Save" : "Guardar"}</button>
  <button class="btn btnGhost" data-action="content-reset" data-b="parishes">${en ? "Reset" : "Restablecer"}</button></div>`;
}
function contentEventsHTML(){
  const en = cbEN();
  const key = cui.evList, dated = key === "events.dated";
  const list = cEvList(key);
  const cats = Array.isArray(CATEGORIES) && CATEGORIES.length ? CATEGORIES : ["Comunidad"];
  const ed = cui.evEdit && cui.evEdit !== "new" ? list.find(e => e.id === cui.evEdit) : null;
  const fe = ed || {};
  let h = `<div class="chipRow">${["events.seed", "events.real", "events.dated"].map(k => `<button class="fchip ${key === k ? "active" : ""}" data-action="content-evlist" data-b="${k}">${CB_SHORT[k]}${Content.overridden(k) ? " ●" : ""}</button>`).join("")}</div>${cOvTag(key)}`;
  h += list.map(e => `<div class="eventRow"><div style="flex:1"><b>${esc(e.title)}</b><div class="small">${esc(e.date || (CB_DAYS.find(d => d[0] === e.day) || ["", e.day || ""])[cbEN() ? 2 : 1])} · ${esc(e.time || "")} · ${esc(e.category || "")}${e.location ? " · " + esc(e.location) : ""}</div></div>
    <button class="btn btnGhost" data-action="content-ev-edit" data-id="${esc(e.id)}">${en ? "Edit" : "Editar"}</button>
    <button class="btn btnGhost" data-action="content-ev-del" data-id="${esc(e.id)}">${en ? "Delete" : "Borrar"}</button></div>`).join("") || `<p class="small">${en ? "No events." : "Sin eventos."}</p>`;
  if(cui.evErr) h += `<div class="notice">${esc(cui.evErr)}</div>`;
  if(cui.evEdit){
    h += `<h4 style="margin:10px 0 2px">${ed ? (en ? "Edit event" : "Editar evento") : (en ? "New event" : "Nuevo evento")}</h4>
    <label>${en ? "Title" : "Título"}</label><input id="ce-title" value="${esc(fe.title || "")}">
    <div class="grid2"><div><label>${en ? "Weekday" : "Día semana"}</label><select id="ce-day">${CB_DAYS.map(d => `<option value="${d[0]}" ${fe.day === d[0] ? "selected" : ""}>${d[cbEN() ? 2 : 1]}</option>`).join("")}</select></div>
    <div><label>${en ? "Date (YYYY-MM-DD)" : "Fecha (AAAA-MM-DD)"}${dated ? " *" : ""}</label><input id="ce-date" value="${esc(fe.date || "")}" placeholder="2026-12-12"></div></div>
    <div class="grid2"><div><label>${en ? "Time" : "Hora"}</label><input id="ce-time" value="${esc(fe.time || "")}" placeholder="6:00 PM"></div>
    <div><label>${en ? "Category" : "Categoría"}</label><select id="ce-cat">${cats.map(c => `<option ${fe.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div></div>
    <label>${en ? "Place" : "Lugar"}</label><input id="ce-place" value="${esc(fe.location || "")}">
    <label>${en ? "Description" : "Descripción"}</label><textarea id="ce-desc" rows="2">${esc(fe.desc || "")}</textarea>
    <div class="grid2"><div><label>${en ? "Mass tag (optional)" : "Etiqueta de Misa (opcional)"}</label><input id="ce-mass" value="${esc(fe.mass || "")}"></div>
    <div><label>⭐ ${en ? "Featured" : "Destacado"}</label><input type="checkbox" id="ce-special" ${fe.special ? "checked" : ""}></div></div>
    <div class="btnRow"><button class="btn btnNavy" data-action="content-ev-save">${en ? "Save" : "Guardar"}</button>
    <button class="btn btnGhost" data-action="content-ev-cancel">${en ? "Cancel" : "Cancelar"}</button></div>`;
  } else {
    h += `<div class="btnRow"><button class="btn btnNavy" data-action="content-ev-new">${en ? "＋ New event" : "＋ Nuevo evento"}</button>
    <button class="btn btnGhost" data-action="content-reset" data-b="${key}">${en ? "Reset list" : "Restablecer lista"}</button></div>`;
  }
  return h;
}
function contentSchedHTML(pname){
  const en = cbEN();
  const iso = cui.schedDate;
  const base = schedBaseMasses(iso);
  const over = schedOverridden(iso);
  const cur = schedMasses(iso);
  const ed = cui.massEdit && cui.massEdit !== "new" ? cur.find(m => massKey(m) === cui.massEdit) : null;
  let h = `<p class="small">${en ? "Daily Masses and intentions. Edited dates win over the generated schedule." : "Misas e intenciones de cada fecha. Lo editado gana al horario generado."}${over ? ` <span class="tag gold">${en ? "edited" : "editado"}</span>` : ""}</p>
  <div class="btnRow"><input id="cs-date" type="date" value="${esc(iso)}" style="flex:1"><button class="btn btnNavy" data-action="content-sched-go">${en ? "View" : "Ver"}</button></div>`;
  h += cur.map(m => `<div class="eventRow"><div style="flex:1"><b>${esc(m.t || "")}${m.e ? " – " + esc(m.e) : ""}</b> · ${esc(m.pl || "")}<div class="small">${(m.int || []).length} ${en ? "intentions" : "intenciones"}</div></div>
    <button class="btn btnGhost" data-action="content-mass-edit" data-id="${esc(massKey(m))}">${en ? "Edit" : "Editar"}</button>
    <button class="btn btnGhost" data-action="content-mass-del" data-id="${esc(massKey(m))}">${en ? "Delete" : "Borrar"}</button></div>`).join("") || `<p class="small">${en ? "No Masses this date." : "Sin Misas esta fecha."}</p>`;
  if(!over && base.length) h += `<p class="small">${en ? "Showing generated schedule." : "Mostrando horario generado."}</p>`;
  if(cui.massEdit){
    const fm = ed || { t: "", e: "", pl: "", int: [] };
    h += `<h4 style="margin:10px 0 2px">${ed ? (en ? "Edit Mass" : "Editar Misa") : (en ? "New Mass" : "Nueva Misa")}</h4>
    <div class="grid2"><div><label>${en ? "Time" : "Hora"} *</label><input id="cm-t" value="${esc(fm.t || "")}" placeholder="7:00"></div>
    <div><label>${en ? "Ends" : "Termina"}</label><input id="cm-e" value="${esc(fm.e || "")}" placeholder="7:30"></div></div>
    <label>${en ? "Place" : "Lugar"}</label><input id="cm-pl" value="${esc(fm.pl || "")}" placeholder="${esc(pname || "")}">
    <label>${en ? "Intentions (one per line)" : "Intenciones (una por línea)"}</label><textarea id="cm-int" rows="4">${esc((fm.int || []).join("\n"))}</textarea>
    <div class="btnRow"><button class="btn btnNavy" data-action="content-mass-save">${en ? "Save" : "Guardar"}</button>
    <button class="btn btnGhost" data-action="content-mass-cancel">${en ? "Cancel" : "Cancelar"}</button></div>`;
  } else {
    h += `<div class="btnRow"><button class="btn btnNavy" data-action="content-mass-new">${en ? "＋ Add Mass" : "＋ Agregar Misa"}</button>
    ${over ? `<button class="btn btnGhost" data-action="content-sched-reset">${en ? "Reset date" : "Restablecer fecha"}</button>` : ""}</div>`;
  }
  return h;
}
export function massKey(m){ return (m.t || "") + "|" + (m.pl || "") + "|" + ((m.int || [])[0] || ""); }
function contentJsonHTML(key){
  const en = cbEN();
  if(!key || CB_JSON.indexOf(key) < 0) key = cui.jsonKey = "links";
  cui.jsonKey = key;
  const txt = cui.jsonText != null ? cui.jsonText : JSON.stringify(jsonCurrentOf(key), null, 2);
  return `<div class="chipRow">${CB_JSON.map(k => `<button class="fchip ${key === k ? "active" : ""}" data-action="content-block" data-b="${k}">${CB_SHORT[k] || k}${Content.overridden(k) ? " ●" : ""}</button>`).join("")}</div>
  <h4 style="margin:8px 0 2px">${esc(CONTENT_TITLES[key] || key)}${cOvTag(key)}</h4>
  <p class="small">${en ? "Advanced: edit as JSON. Keep the same structure." : "Avanzado: edita como JSON. Mantén la misma estructura."}</p>
  ${cui.jsonErr ? `<div class="notice">${esc(cui.jsonErr)}</div>` : ""}
  <textarea id="cj-text" rows="12" spellcheck="false" style="font-family:monospace;font-size:12px">${esc(txt)}</textarea>
  <div class="btnRow"><button class="btn btnNavy" data-action="content-json-save">${en ? "Save" : "Guardar"}</button>
  <button class="btn btnGhost" data-action="content-json-reset" data-b="${esc(key)}">${en ? "Reset" : "Restablecer"}</button></div>`;
}
function jsonCurrentOf(key){
  const got = Content.get(key);
  if(got !== undefined) return got;
  const cur = Content.currentOf(key);
  return cur === undefined ? null : cur;
}

// Maneja TODAS las acciones content-*. Devuelve true si la manejó.
// ctx: { ED, parishId, parishName, refresh }
export function handleContentAction(a, el, ctx){
  ctx = ctx || {};
  const refresh = ctx.refresh || (() => {});
  const needEd = () => { if(!(ctx && ctx.ED)) return true; return false; };
  if(a === "content-block"){ cui.block = el.dataset.b; cui.jsonText = null; cui.jsonErr = ""; cui.evErr = ""; cui.err = ""; refresh(); return true; }
  if(a === "content-pedit"){ cui.pedit = el.dataset.id; refresh(); return true; }
  if(a === "content-parish-save"){ if(needEd()) return true;
    const lines = id => val("#" + id).split("\n").map(s => s.trim()).filter(Boolean);
    const arr = PARISHES.map(p => p.id === cui.pedit ? { ...p, name: val("#cp-name") || p.name, city: val("#cp-city"), address: val("#cp-address"), phone: val("#cp-phone"), web: val("#cp-web"), priest: val("#cp-priest"), greeting: val("#cp-greeting"), confession: val("#cp-conf"), adoration: val("#cp-ador"), massTimes: { Sunday: lines("cp-sun"), Saturday: lines("cp-sat"), Daily: lines("cp-daily") } } : p);
    if(!arr.find(p => p.id === cui.pedit)) return true;
    cSave(Content.save("parishes", arr), () => refresh(), ctx); return true; }
  if(a === "content-reset"){ if(needEd()) return true;
    cui.jsonText = null; cui.jsonErr = ""; cui.evErr = ""; cui.evEdit = null; cui.massEdit = null;
    cSave(Content.reset(el.dataset.b), () => refresh(), ctx); return true; }
  if(a === "content-json-reset"){ if(needEd()) return true;
    cui.jsonText = null; cui.jsonErr = "";
    cSave(Content.reset(el.dataset.b || cui.jsonKey), () => refresh(), ctx); return true; }
  if(a === "content-evlist"){ cui.evList = el.dataset.b; cui.evEdit = null; cui.evErr = ""; refresh(); return true; }
  if(a === "content-ev-new"){ if(needEd()) return true; cui.evEdit = "new"; cui.evErr = ""; refresh(); return true; }
  if(a === "content-ev-edit"){ if(needEd()) return true; cui.evEdit = el.dataset.id; cui.evErr = ""; refresh(); return true; }
  if(a === "content-ev-cancel"){ cui.evEdit = null; cui.evErr = ""; refresh(); return true; }
  if(a === "content-ev-save"){ if(needEd()) return true;
    const key = cui.evList, dated = key === "events.dated";
    const t2 = val("#ce-title"); let dt = val("#ce-date");
    if(!t2){ cui.evErr = cbEN() ? "Title is required." : "Falta el título."; refresh(); return true; }
    if(dated && !/^\d{4}-\d{2}-\d{2}$/.test(dt)){ cui.evErr = cbEN() ? "Date required (YYYY-MM-DD)." : "Falta la fecha (AAAA-MM-DD)."; refresh(); return true; }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(dt)) dt = "";
    const rec = { id: (cui.evEdit && cui.evEdit !== "new") ? cui.evEdit : "c" + Date.now(), title: t2, day: $("#ce-day")?.value || "sun", ...(dt ? { date: dt } : {}), time: val("#ce-time") || "—", category: $("#ce-cat")?.value || "Comunidad", location: val("#ce-place"), desc: val("#ce-desc"), recurring: dated ? "Única" : "Semanal", ...($("#ce-special")?.checked ? { special: true } : {}) };
    const mtag = val("#ce-mass"); if(mtag) rec.mass = mtag;
    const arr = cEvList(key).slice();
    const ix = arr.findIndex(e => e.id === rec.id);
    if(ix >= 0) arr[ix] = { ...arr[ix], ...rec }; else arr.unshift(rec);
    cui.evErr = ""; cui.evEdit = null;
    cSave(Content.save(key, arr), () => refresh(), ctx); return true; }
  if(a === "content-ev-del"){ if(needEd()) return true;
    const key = cui.evList;
    const arr = cEvList(key).filter(e => e.id !== el.dataset.id);
    if(cui.evEdit === el.dataset.id) cui.evEdit = null;
    cSave(Content.save(key, arr), () => refresh(), ctx); return true; }
  if(a === "content-sched-go"){ cui.schedDate = val("#cs-date") || cui.schedDate; cui.massEdit = null; refresh(); return true; }
  if(a === "content-mass-new"){ if(needEd()) return true; cui.massEdit = "new"; refresh(); return true; }
  if(a === "content-mass-edit"){ if(needEd()) return true; cui.massEdit = el.dataset.id; refresh(); return true; }
  if(a === "content-mass-cancel"){ cui.massEdit = null; refresh(); return true; }
  if(a === "content-mass-save"){ if(needEd()) return true;
    const t2 = val("#cm-t"); if(!t2){ refresh(); return true; }
    const iso = cui.schedDate;
    const cur = schedMasses(iso).slice();
    let prev = {}, ix = -1;
    if(cui.massEdit && cui.massEdit !== "new"){ ix = cur.findIndex(m => massKey(m) === cui.massEdit); if(ix >= 0) prev = cur[ix]; }
    const rec = { t: t2, e: val("#cm-e"), pl: val("#cm-pl") || ctx.parishName || "", lg: prev.lg || "", k: prev.k || "", ce: prev.ce || "", de: prev.de || "", full: prev.full || 0, int: val("#cm-int").split("\n").map(s => s.trim()).filter(Boolean), ti: prev.ti || "" };
    if(ix >= 0) cur[ix] = rec; else cur.push(rec);
    cur.sort((x, y) => String(x.t).localeCompare(String(y.t)));
    const all = { ...((Content.get("schedule")) || { masses: {} }) };
    all.masses = { ...(all.masses || {}) }; all.masses[iso] = cur;
    cui.massEdit = null;
    cSave(Content.save("schedule", all), () => refresh(), ctx); return true; }
  if(a === "content-mass-del"){ if(needEd()) return true;
    const iso = cui.schedDate;
    const cur = schedMasses(iso).filter(m => massKey(m) !== el.dataset.id);
    const all = { ...((Content.get("schedule")) || { masses: {} }) };
    all.masses = { ...(all.masses || {}) }; all.masses[iso] = cur;
    if(cui.massEdit === el.dataset.id) cui.massEdit = null;
    cSave(Content.save("schedule", all), () => refresh(), ctx); return true; }
  if(a === "content-sched-reset"){ if(needEd()) return true;
    const all = { ...((Content.get("schedule")) || { masses: {} }) };
    all.masses = { ...(all.masses || {}) }; delete all.masses[cui.schedDate];
    cui.massEdit = null;
    if(!Object.keys(all.masses).length){ cSave(Content.reset("schedule"), () => refresh(), ctx); }
    else cSave(Content.save("schedule", all), () => refresh(), ctx); return true; }
  if(a === "content-json-save"){ if(needEd()) return true;
    const raw = $("#cj-text")?.value ?? "";
    let v; try { v = JSON.parse(raw); } catch(e){ cui.jsonText = raw; cui.jsonErr = (cbEN() ? "Invalid JSON: " : "JSON inválido: ") + String(e.message || e); refresh(); return true; }
    cui.jsonText = raw; cui.jsonErr = "";
    (async()=>{ try { await Content.save(cui.jsonKey, v); cui.jsonText = null; cui.jsonErr = ""; } catch(e){ cui.jsonText = raw; cui.jsonErr = String((e && e.message) || e); } refresh(); })();
    return true; }
  return false;
}
