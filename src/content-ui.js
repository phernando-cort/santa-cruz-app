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

export const cui = { block: "parishes", pedit: "", evList: "events.seed", evEdit: null, schedDate: "", massEdit: null, formEdit: null, formLang: "es", weekDay: "sun", err: "", evErr: "" };
function SV(id){ const el = document.getElementById(id); return el ? (el.value || "").trim() : ""; }
function SC(id){ const el = document.getElementById(id); return !!(el && el.checked); }

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
  else h += contentFormHTML(cui.block);
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
// ---------- Formularios visuales (SIN código): cada bloque se edita con campos ----------
function formArr(key){
  const got = Content.get(key);
  if(got !== undefined) return got;
  const cur = Content.currentOf(key);
  if(cur === undefined || cur === null) return [];
  return cur;
}
function formObj(key, fb){
  const got = Content.get(key);
  if(got !== undefined) return got;
  const cur = Content.currentOf(key);
  if(cur === undefined || cur === null) return fb;
  return cur;
}
// Esquemas: fields {k, es, en, t: text|area|num|check|select|combo, opts, rows, req}
const SCH = {
  "prayers.trad": { hint: ["Oraciones de la biblioteca (Oración → Biblioteca). No toques el código: solo escribe.", "Library prayers (Prayer → Library). Just type, no code."],
    add: ["＋ Añadir oración", "＋ Add prayer"], t: x => x.name || "—", s: x => [x.category, x.id].filter(Boolean).join(" · "),
    fields: [
      { k: "name", es: "Nombre", en: "Name", t: "text", req: 1 },
      { k: "category", es: "Categoría", en: "Category", t: "select", opts: ["Esenciales", "Credos", "Misericordia", "María", "Santos", "Liturgia", "Coronillas", "Diaria", "Vocaciones", "Sagrada Familia", "Capilla"] },
      { k: "text", es: "Texto de la oración", en: "Prayer text", t: "area", rows: 6, req: 1 }] },
  "clergy": { hint: ["Sacerdotes, diáconos y equipo (se ven en Comunidad y en las Misas).", "Priests, deacons and staff (shown in Community and Masses)."],
    add: ["＋ Añadir persona", "＋ Add person"], t: x => x.name || "—", s: x => [x.role, x.phone].filter(Boolean).join(" · "),
    fields: [
      { k: "name", es: "Nombre", en: "Name", t: "text", req: 1 },
      { k: "role", es: "Cargo", en: "Role", t: "combo", opts: ["parroco", "vicario", "sacerdote", "diacono", "religiosa"] },
      { k: "phone", es: "Teléfono", en: "Phone", t: "text" },
      { k: "email", es: "Correo", en: "Email", t: "text" },
      { k: "office", es: "Horario/oficina", en: "Office hours", t: "text" },
      { k: "bio", es: "Presentación corta", en: "Short bio", t: "area", rows: 2 }] },
  "groups": { hint: ["Grupos y ministerios (Comunidad → Grupos).", "Groups and ministries (Community → Groups)."],
    add: ["＋ Añadir grupo", "＋ Add group"], t: x => x.name || "—", s: x => [(x.members != null ? ("👥 " + x.members) : ""), x.meets].filter(Boolean).join(" · "),
    fields: [
      { k: "name", es: "Nombre del grupo", en: "Group name", t: "text", req: 1 },
      { k: "members", es: "Miembros (número)", en: "Members (number)", t: "num" },
      { k: "desc", es: "Descripción (español)", en: "Description (Spanish)", t: "area", rows: 2 },
      { k: "descEn", es: "Descripción (inglés)", en: "Description (English)", t: "area", rows: 2 },
      { k: "cat", es: "Tipo", en: "Kind", t: "combo", opts: ["liturgia", "jovenes", "caridad", "devocion", "formacion", "comunidad", "familia"] },
      { k: "meets", es: "Cuándo y dónde se reúne", en: "When and where it meets", t: "text" },
      { k: "lang", es: "Idioma", en: "Language", t: "select", opts: ["ambos", "es", "en"] },
      { k: "open", es: "Acepta nuevos miembros", en: "Accepts new members", t: "check" }] },
  "giving": { hint: ["Proyectos de donativos (Más → Donativos). El nombre corto (id) no se puede cambiar.", "Giving projects (More → Giving). The short id cannot change."],
    add: ["＋ Añadir proyecto", "＋ Add project"], t: x => x.name || "—", s: x => [("$" + (x.goal || 0))].join(""),
    fields: [
      { k: "name", es: "Nombre", en: "Name", t: "text", req: 1 },
      { k: "desc", es: "Descripción (español)", en: "Description (Spanish)", t: "area", rows: 2 },
      { k: "descEn", es: "Descripción (inglés)", en: "Description (English)", t: "area", rows: 2 },
      { k: "goal", es: "Meta ($)", en: "Goal ($)", t: "num" },
      { k: "raised0", es: "Ya juntado ($)", en: "Already raised ($)", t: "num" },
      { k: "_updates", es: "Novedades (una por línea: Fecha | texto)", en: "Updates (one per line: Date | text)", t: "area", rows: 3 }] },
  "news.seed": { hint: ["Noticias iniciales (Diócesis, País, Iglesia).", "Starter news (Diocese, Country, Church)."],
    add: ["＋ Añadir noticia", "＋ Add news"], t: x => x.title || "—", s: x => [x.cat, x.date].filter(Boolean).join(" · "),
    fields: [
      { k: "title", es: "Título", en: "Title", t: "text", req: 1 },
      { k: "cat", es: "Sección", en: "Section", t: "combo", opts: ["Diócesis", "País", "Iglesia"] },
      { k: "date", es: "Fecha (texto libre)", en: "Date (free text)", t: "text" },
      { k: "body", es: "Texto", en: "Body", t: "area", rows: 3, req: 1 }] },
  "bulletins.seed": { hint: ["Boletines iniciales.", "Starter bulletins."],
    add: ["＋ Añadir boletín", "＋ Add bulletin"], t: x => x.title || "—", s: x => x.date || "",
    fields: [
      { k: "title", es: "Título", en: "Title", t: "text", req: 1 },
      { k: "date", es: "Fecha (texto libre)", en: "Date (free text)", t: "text" },
      { k: "cover", es: "Tema de portada", en: "Cover theme", t: "text" },
      { k: "_sections", es: "Secciones (una por línea: Encabezado | párrafo)", en: "Sections (one per line: Heading | paragraph)", t: "area", rows: 4 }] },
  "messages.seed": { hint: ["Avisos iniciales de la app.", "Starter app announcements."],
    add: ["＋ Añadir aviso", "＋ Add announcement"], t: x => x.title || "—", s: x => [x.channel, x.time].filter(Boolean).join(" · "),
    fields: [
      { k: "title", es: "Título", en: "Title", t: "text", req: 1 },
      { k: "from", es: "De (quién lo envía)", en: "From (sender)", t: "text" },
      { k: "time", es: "Cuándo (texto libre)", en: "When (free text)", t: "text" },
      { k: "channel", es: "Canal", en: "Channel", t: "select", opts: ["Aviso", "Correo", "SMS", "Comunidad", "Oficina"] },
      { k: "body", es: "Mensaje", en: "Message", t: "area", rows: 3, req: 1 }] },
  "muro.seed": { hint: ["Mensajes iniciales del muro comunitario.", "Starter community wall posts."],
    add: ["＋ Añadir mensaje", "＋ Add post"], t: x => x.text ? (x.text.slice(0, 60) + "…") : "—", s: x => [x.name, x.kind].filter(Boolean).join(" · "),
    fields: [
      { k: "name", es: "Nombre", en: "Name", t: "text", req: 1 },
      { k: "kind", es: "Tipo", en: "Kind", t: "select", opts: ["Saludo", "Nota", "Aviso", "Oración"] },
      { k: "when", es: "Cuándo (texto libre)", en: "When (free text)", t: "text" },
      { k: "text", es: "Mensaje", en: "Message", t: "area", rows: 3, req: 1 }] },
  "intenciones.seed": { hint: ["Intenciones iniciales (cumpleaños, bodas, difuntos…).", "Starter intentions (birthdays, weddings, departed…)."],
    add: ["＋ Añadir intención", "＋ Add intention"], t: x => x.names || "—", s: x => [x.type, x.date].filter(Boolean).join(" · "),
    fields: [
      { k: "type", es: "Tipo", en: "Type", t: "select", opts: ["Cumpleaños", "Aniversarios", "Nacimientos", "Matrimonios", "Quinceañeras", "Exequias", "Defunciones"] },
      { k: "names", es: "Nombres", en: "Names", t: "text", req: 1 },
      { k: "date", es: "Fecha (texto libre)", en: "Date (free text)", t: "text" },
      { k: "mass", es: "Misa (opcional)", en: "Mass (optional)", t: "text" },
      { k: "place", es: "Lugar (opcional)", en: "Place (optional)", t: "text" },
      { k: "text", es: "Texto", en: "Text", t: "area", rows: 2 }] },
  "directory.seed": { hint: ["Directorio inicial. Los cumpleaños avisan solos (Nombre, MM-DD).", "Starter directory. Birthdays remind automatically (Name, MM-DD)."],
    add: ["＋ Añadir familia", "＋ Add family"], t: x => x.family || "—", s: x => [x.contact, x.phone].filter(Boolean).join(" · "),
    fields: [
      { k: "family", es: "Familia", en: "Family", t: "text", req: 1 },
      { k: "contact", es: "Contacto", en: "Contact", t: "text" },
      { k: "phone", es: "Teléfono", en: "Phone", t: "text" },
      { k: "email", es: "Correo", en: "Email", t: "text" },
      { k: "address", es: "Dirección", en: "Address", t: "text" },
      { k: "notes", es: "Notas", en: "Notes", t: "area", rows: 2 },
      { k: "_birthdays", es: "Cumpleaños (uno por línea: Nombre, MM-DD)", en: "Birthdays (one per line: Name, MM-DD)", t: "area", rows: 3 },
      { k: "_anniv", es: "Aniversario (Pareja, MM-DD — vacío si no hay)", en: "Anniversary (Couple, MM-DD — empty if none)", t: "text" },
      { k: "homebound", es: "No puede salir de casa (visita)", en: "Homebound (needs visit)", t: "check" }] },
  "cantos.seed": { hint: ["Cantos base con letra (la melodía se conserva sola).", "Base songs with lyrics (melody is kept automatically)."],
    add: ["＋ Añadir canto", "＋ Add song"], t: x => x.title || "—", s: x => x.origin || "",
    fields: [
      { k: "title", es: "Título", en: "Title", t: "text", req: 1 },
      { k: "origin", es: "Origen", en: "Source", t: "text" },
      { k: "lyrics", es: "Letra (usa / para separar versos)", en: "Lyrics (use / to separate lines)", t: "area", rows: 4, req: 1 }] },
  "saints": { hint: ["Santoral (se muestra cada día su santo).", "Saints (each day shows its saint)."],
    add: ["＋ Añadir santo", "＋ Add saint"], t: x => x.name || "—", s: x => [x.feast, x.patron].filter(Boolean).join(" · "),
    fields: [
      { k: "name", es: "Nombre", en: "Name", t: "text", req: 1 },
      { k: "feast", es: "Fiesta (ej. 12 dic)", en: "Feast (e.g. Dec 12)", t: "text" },
      { k: "patron", es: "Patrono de…", en: "Patron of…", t: "text" },
      { k: "bio", es: "Vida (2–3 líneas)", en: "Life (2–3 lines)", t: "area", rows: 3 }] },
  "sacraments": { langs: 1, hint: ["Requisitos y contactos de sacramentos, en español e inglés.", "Sacrament requirements and contacts, in Spanish and English."],
    add: ["＋ Añadir renglón", "＋ Add row"], t: x => x.h || "—", s: x => (x.p || "").slice(0, 80),
    fields: [
      { k: "h", es: "Título", en: "Heading", t: "text", req: 1 },
      { k: "p", es: "Texto", en: "Text", t: "area", rows: 3, req: 1 }] }
};
function fieldHTML(f, v){
  const en = cbEN(), lb = en ? f.en : f.es, id = "cf-" + f.k;
  if(f.t === "area") return `<label>${esc(lb)}${f.req ? " *" : ""}</label><textarea id="${id}" rows="${f.rows || 3}">${esc(v ?? "")}</textarea>`;
  if(f.t === "check") return `<label><input type="checkbox" id="${id}"${v ? " checked" : ""}> ${esc(lb)}</label>`;
  if(f.t === "num") return `<label>${esc(lb)}</label><input id="${id}" type="number" value="${esc(v ?? "")}">`;
  if(f.t === "select"){
    const opts = (f.opts || []).slice();
    if(v && opts.indexOf(v) < 0) opts.unshift(v);
    return `<label>${esc(lb)}</label><select id="${id}">${opts.map(o => `<option value="${esc(o)}"${o === v ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  }
  if(f.t === "combo"){
    const dl = "dl-" + f.k;
    return `<label>${esc(lb)}</label><input id="${id}" list="${dl}" value="${esc(v ?? "")}"><datalist id="${dl}">${(f.opts || []).map(o => `<option value="${esc(o)}">`).join("")}</datalist>`;
  }
  return `<label>${esc(lb)}${f.req ? " *" : ""}</label><input id="${id}" value="${esc(v ?? "")}">`;
}
function specialVal(key, it){
  if(key === "giving") return ((it.updates || []).map(u => (u.d || "") + " | " + (u.t || "")).join("\n"));
  if(key === "bulletins.seed") return (((it.sections || []).map(s => (s.h || "") + " | " + (s.p || "")).join("\n")));
  if(key === "directory.seed") return ([((it.birthdays || []).map(b => (b.name || "") + ", " + (b.md || "")).join("\n")), (it.anniversary ? ((it.anniversary.couple || "") + ", " + (it.anniversary.md || "")) : "")]);
  return "";
}
function itemListHTML(key){
  const en = cbEN(), S = SCH[key];
  let arr = formArr(key), other = null;
  if(S.langs){ const o = formObj(key, { es: [], en: [] }); other = (cui.formLang === "es" ? o.en : o.es) || []; arr = o[cui.formLang] || []; }
  const fe = (cui.formEdit && cui.formEdit.key === key) ? cui.formEdit : null;
  const ed = fe ? (fe.ix === "new" ? {} : (arr[fe.ix] || {})) : null;
  let h = `<h4 style="margin:8px 0 2px">${esc(CONTENT_TITLES[key] || key)}${cOvTag(key)}</h4><p class="small">${esc(en ? S.hint[1] : S.hint[0])}</p>`;
  if(cui.err) h += `<div class="notice">⚠️ ${esc(cui.err)}</div>`;
  if(S.langs) h += `<div class="chipRow">${["es", "en"].map(l => `<button class="fchip ${cui.formLang === l ? "active" : ""}" data-action="content-lang" data-l="${l}">${l === "es" ? "Español" : "English"}</button>`).join("")}</div>`;
  h += arr.map((it, i) => `<div class="eventRow"><div style="flex:1"><b>${esc(S.t(it))}</b><div class="small">${esc(S.s(it))}</div></div>
    <button class="btn btnGhost" data-action="content-edit" data-b="${key}" data-ix="${i}">${en ? "Edit" : "Editar"}</button>
    <button class="btn btnGhost" data-action="content-del" data-b="${key}" data-ix="${i}">${en ? "Delete" : "Borrar"}</button></div>`).join("") || `<p class="small">${en ? "Empty list." : "Lista vacía."}</p>`;
  if(ed){
    h += `<h4 style="margin:10px 0 2px">${fe.ix === "new" ? esc(en ? S.add[1] : S.add[0]) : (en ? "Edit" : "Editar")}</h4>`;
    for(const f of S.fields){
      let v = ed[f.k];
      if(f.k === "_updates" || f.k === "_sections") v = specialVal(key, ed);
      if(f.k === "_birthdays") v = specialVal(key, ed)[0];
      if(f.k === "_anniv") v = specialVal(key, ed)[1];
      h += fieldHTML(f, v);
    }
    h += `<div class="btnRow"><button class="btn btnNavy" data-action="content-save" data-b="${key}">${en ? "Save" : "Guardar"}</button>
      <button class="btn btnGhost" data-action="content-cancel">${en ? "Cancel" : "Cancelar"}</button></div>`;
  } else {
    h += `<div class="btnRow"><button class="btn btnNavy" data-action="content-new" data-b="${key}">${esc(en ? S.add[1] : S.add[0])}</button>
      <button class="btn btnGhost" data-action="content-reset" data-b="${key}">${en ? "Reset" : "Restablecer"}</button></div>`;
  }
  return h;
}
function linesHTML(key, lines, ph){
  const en = cbEN();
  return `<h4 style="margin:8px 0 2px">${esc(CONTENT_TITLES[key] || key)}${cOvTag(key)}</h4>
    <p class="small">${esc(en ? "One per line. They appear in the app in this order." : "Uno por línea. Salen en la app en este orden.")}</p>
    ${cui.err ? `<div class="notice">⚠️ ${esc(cui.err)}</div>` : ""}
    <textarea id="ct-lines" rows="10" placeholder="${esc(ph || "")}">${esc(lines.join("\n"))}</textarea>
    <div class="btnRow"><button class="btn btnNavy" data-action="content-linessave" data-b="${key}">${en ? "Save" : "Guardar"}</button>
    <button class="btn btnGhost" data-action="content-reset" data-b="${key}">${en ? "Reset" : "Restablecer"}</button></div>`;
}
const ART_LABELS = [["hero", "Portada (pantalla de inicio)", "Cover (home screen)"], ["desert", "Desierto (inspiración diaria)", "Desert (daily inspiration)"], ["luminarias", "Luminarias (boletín)", "Luminarias (bulletin)"], ["retablo", "Retablo (familia y mensaje del párroco)", "Retablo (family & pastor message)"]];
function artHTML(){
  const en = cbEN(), o = formObj("art", {});
  let h = `<h4 style="margin:8px 0 2px">${esc(CONTENT_TITLES.art)}${cOvTag("art")}</h4>
    <p class="small">${esc(en ? "Images of the app. Paste an image address (URL) in each box. The photo updates alone." : "Imágenes de la app. Pega la dirección (URL) de una imagen en cada casilla. La foto cambia sola.")}</p>
    ${cui.err ? `<div class="notice">⚠️ ${esc(cui.err)}</div>` : ""}`;
  for(const [k, les, len] of ART_LABELS){
    h += `<label>${esc(en ? len : les)}</label><input id="cfart-${k}" value="${esc(o[k] || "")}" inputmode="url" placeholder="https://…">
    ${o[k] ? `<img src="${esc(o[k])}" alt="" loading="lazy" style="width:100%;border-radius:10px;margin:4px 0 8px">` : ""}`;
  }
  h += `<div class="btnRow"><button class="btn btnNavy" data-action="content-artsave">${en ? "Save" : "Guardar"}</button>
    <button class="btn btnGhost" data-action="content-reset" data-b="art">${en ? "Reset" : "Restablecer"}</button></div>`;
  return h;
}
function linksHTML(){
  const en = cbEN(), o = formObj("links", { yt: "", bulletin: "" });
  return `<h4 style="margin:8px 0 2px">${esc(CONTENT_TITLES.links)}${cOvTag("links")}</h4>
    <p class="small">${esc(en ? "Addresses the app opens." : "Direcciones que abre la app.")}</p>
    ${cui.err ? `<div class="notice">⚠️ ${esc(cui.err)}</div>` : ""}
    <label>${en ? "YouTube channel" : "Canal de YouTube"}</label><input id="cfl-yt" value="${esc(o.yt || "")}" inputmode="url" placeholder="https://youtube.com/@…">
    <label>${en ? "Bulletin page" : "Página del boletín"}</label><input id="cfl-bulletin" value="${esc(o.bulletin || "")}" inputmode="url" placeholder="https://…">
    <div class="btnRow"><button class="btn btnNavy" data-action="content-linksave">${en ? "Save" : "Guardar"}</button>
    <button class="btn btnGhost" data-action="content-reset" data-b="links">${en ? "Reset" : "Restablecer"}</button></div>`;
}
function bulletinHTML(){
  const en = cbEN(), o = formObj("bulletin.fallback", {});
  return `<h4 style="margin:8px 0 2px">${esc(CONTENT_TITLES["bulletin.fallback"])}${cOvTag("bulletin.fallback")}</h4>
    <p class="small">${esc(en ? "Backup bulletin (used when there is no internet)." : "Boletín de respaldo (se usa cuando no hay internet).")}</p>
    ${cui.err ? `<div class="notice">⚠️ ${esc(cui.err)}</div>` : ""}
    <div class="grid2"><div><label>${en ? "Year" : "Año"}</label><input id="cfb-y" type="number" value="${esc(o.y ?? "")}"></div>
    <div><label>${en ? "Month (1–12)" : "Mes (1–12)"}</label><input id="cfb-mo" type="number" value="${esc(o.mo ?? "")}"></div></div>
    <div class="grid2"><div><label>${en ? "From day" : "Del día"}</label><input id="cfb-d1" type="number" value="${esc(o.d1 ?? "")}"></div>
    <div><label>${en ? "To day" : "Al día"}</label><input id="cfb-d2" type="number" value="${esc(o.d2 ?? "")}"></div></div>
    <label>PDF</label><input id="cfb-pdf" value="${esc(o.pdf || "")}" inputmode="url" placeholder="https://…">
    <label>${en ? "View online" : "Ver en línea"}</label><input id="cfb-view" value="${esc(o.view || "")}" inputmode="url" placeholder="https://…">
    <div class="btnRow"><button class="btn btnNavy" data-action="content-bulsave">${en ? "Save" : "Guardar"}</button>
    <button class="btn btnGhost" data-action="content-reset" data-b="bulletin.fallback">${en ? "Reset" : "Restablecer"}</button></div>`;
}
const WEEK_DAYS = [["sun", "Dom", "Sun"], ["mon", "Lun", "Mon"], ["tue", "Mar", "Tue"], ["wed", "Mié", "Wed"], ["thu", "Jue", "Thu"], ["fri", "Vie", "Fri"], ["sat", "Sáb", "Sat"]];
function weekHTML(){
  const en = cbEN();
  const wobj = formObj("week", null);
  const es = (wobj && wobj.es) || [];
  const enObj = (wobj && !Array.isArray(wobj) && wobj.en && !Array.isArray(wobj.en)) ? wobj.en : {};
  const d = cui.weekDay || "sun";
  const w = es.find(x => x && x.key === d) || { key: d };
  const we = enObj[d] || {};
  const cit = w.citations || {}, ver = w.verse || {};
  const sel = (id, v, opts) => `<select id="${id}">${opts.map(o => `<option value="${esc(o)}"${o === v ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  let h = `<h4 style="margin:8px 0 2px">${esc(CONTENT_TITLES.week)}${cOvTag("week")}</h4>
    <p class="small">${esc(en ? "Readings of the week, day by day, in Spanish and English." : "Lecturas de la semana, día por día, en español e inglés.")}</p>
    ${cui.err ? `<div class="notice">⚠️ ${esc(cui.err)}</div>` : ""}
    <div class="chipRow">${WEEK_DAYS.map(x => `<button class="fchip ${d === x[0] ? "active" : ""}" data-action="content-weekday" data-d="${x[0]}">${en ? x[2] : x[1]}</button>`).join("")}</div>
    <h4 style="margin:10px 0 2px">🇪🇸 Español</h4>
    <div class="grid2"><div><label>Día</label><input id="cw-weekday" value="${esc(w.weekday || "")}"></div>
    <div><label>Fiesta</label><input id="cw-feast" value="${esc(w.feast || "")}"></div></div>
    <div class="grid2"><div><label>Rango</label>${sel("cw-rank", w.rank, ["Ferial", "Memoria", "Fiesta", "Solemnidad"])}</div>
    <div><label>Color</label>${sel("cw-color", w.color, ["blanco", "verde", "rojo", "morado", "rosa"])}</div></div>
    <label>Tiempo litúrgico</label>${sel("cw-season", w.season, ["Tiempo Ordinario", "Adviento", "Navidad", "Cuaresma", "Pascua"])}
    <div class="grid2"><div><label>1ª lectura</label><input id="cw-first" value="${esc(cit.first || "")}" placeholder="Gén 1, 1–5"></div>
    <div><label>Salmo</label><input id="cw-psalm" value="${esc(cit.psalm || "")}" placeholder="Sal 104"></div></div>
    <div class="grid2"><div><label>2ª lectura (— si no hay)</label><input id="cw-second" value="${esc(cit.second || "")}" placeholder="—"></div>
    <div><label>Evangelio</label><input id="cw-gospel" value="${esc(cit.gospel || "")}" placeholder="Jn 1, 1–5"></div></div>
    <div class="grid2"><div><label>Cita del versículo</label><input id="cw-vref" value="${esc(ver.ref || "")}" placeholder="Salmo 104:30"></div>
    <div><label>Título de la reflexión</label><input id="cw-rtitle" value="${esc(w.reflectionTitle || "")}"></div></div>
    <label>Versículo</label><textarea id="cw-vtext" rows="2">${esc(ver.text || "")}</textarea>
    <label>Reflexión</label><textarea id="cw-refl" rows="3">${esc(w.reflection || "")}</textarea>
    <h4 style="margin:10px 0 2px">🇺🇸 English</h4>
    <div class="grid2"><div><label>Weekday</label><input id="cw-eweekday" value="${esc(we.weekday || "")}"></div>
    <div><label>Feast</label><input id="cw-efeast" value="${esc(we.feast || "")}"></div></div>
    <div class="grid2"><div><label>Rank</label>${sel("cw-erank", we.rank, ["Ferial", "Memorial", "Feast", "Solemnity"])}</div>
    <div><label>Season</label>${sel("cw-eseason", we.season, ["Ordinary Time", "Advent", "Christmas", "Lent", "Easter"])}</div></div>
    <label>Reflection title</label><input id="cw-ertitle" value="${esc(we.reflectionTitle || "")}">
    <label>Reflection</label><textarea id="cw-erefl" rows="3">${esc(we.reflection || "")}</textarea>
    <div class="btnRow"><button class="btn btnNavy" data-action="content-daysave">${en ? "Save day" : "Guardar día"}</button>
    <button class="btn btnGhost" data-action="content-reset" data-b="week">${en ? "Reset week" : "Restablecer semana"}</button></div>`;
  return h;
}
function inspHTML(){
  const en = cbEN(), o = formObj("inspirations", { es: [], en: [] });
  const esA = o.es || [], enA = o.en || [];
  const n = Math.max(esA.length, enA.length);
  const fe = (cui.formEdit && cui.formEdit.key === "inspirations") ? cui.formEdit : null;
  let h = `<h4 style="margin:8px 0 2px">${esc(CONTENT_TITLES.inspirations)}${cOvTag("inspirations")}</h4>
    <p class="small">${esc(en ? "Daily inspiration cards, in Spanish and English, paired." : "Tarjetas de inspiración diaria, en español e inglés, en parejas.")}</p>
    ${cui.err ? `<div class="notice">⚠️ ${esc(cui.err)}</div>` : ""}`;
  for(let i = 0; i < n; i++){
    const a = esA[i] || {}, b = enA[i] || {};
    h += `<div class="eventRow"><div style="flex:1"><b>${esc(a.title || b.title || ("#" + (i + 1)))}</b><div class="small">${esc((a.body || b.body || "").slice(0, 80))}</div></div>
      <button class="btn btnGhost" data-action="content-edit" data-b="inspirations" data-ix="${i}">${en ? "Edit" : "Editar"}</button>
      <button class="btn btnGhost" data-action="content-del" data-b="inspirations" data-ix="${i}">${en ? "Delete" : "Borrar"}</button></div>`;
  }
  if(!n) h += `<p class="small">${en ? "No cards." : "Sin tarjetas."}</p>`;
  if(fe){
    const i = fe.ix === "new" ? n : fe.ix, a = esA[i] || {}, b = enA[i] || {};
    h += `<h4 style="margin:10px 0 2px">${fe.ix === "new" ? (en ? "＋ New card" : "＋ Nueva tarjeta") : (en ? "Edit card" : "Editar tarjeta")}</h4>
      <h4 style="margin:6px 0 2px">🇪🇸 Español</h4>
      <div class="grid2"><div><label>Grupo</label><input id="ci-day" list="dl-iday" value="${esc(a.day || "Hoy")}"><datalist id="dl-iday"><option value="Hoy"><option value="Archivo"></datalist></div>
      <div><label>Etiqueta</label><input id="ci-tag" value="${esc(a.tag || "")}" placeholder="Mañana"></div></div>
      <label>Título *</label><input id="ci-title" value="${esc(a.title || "")}">
      <label>Texto *</label><textarea id="ci-body" rows="3">${esc(a.body || "")}</textarea>
      <h4 style="margin:6px 0 2px">🇺🇸 English</h4>
      <label>Title *</label><input id="ci-etitle" value="${esc(b.title || "")}">
      <label>Text *</label><textarea id="ci-ebody" rows="3">${esc(b.body || "")}</textarea>
      <div class="btnRow"><button class="btn btnNavy" data-action="content-save" data-b="inspirations">${en ? "Save" : "Guardar"}</button>
      <button class="btn btnGhost" data-action="content-cancel">${en ? "Cancel" : "Cancelar"}</button></div>`;
  } else {
    h += `<div class="btnRow"><button class="btn btnNavy" data-action="content-new" data-b="inspirations">${en ? "＋ New card" : "＋ Nueva tarjeta"}</button>
      <button class="btn btnGhost" data-action="content-reset" data-b="inspirations">${en ? "Reset" : "Restablecer"}</button></div>`;
  }
  return h;
}
function ministryHTML(){
  const en = cbEN();
  const roles = formArr("ministry.roles");
  const seed = formObj("ministry.seed", {});
  const masses = Object.keys(seed);
  let h = `<h4 style="margin:8px 0 2px">${esc(CONTENT_TITLES["ministry.seed"])}${cOvTag("ministry.seed")}</h4>
    <p class="small">${esc(en ? "Who serves at each Mass. Columns come from “Role names”. Empty = “to be assigned”. Changes reach the Mass intentions." : "Quién sirve en cada Misa. Las columnas vienen de “Nombres de roles”. Vacío = “por asignar”. Llega a las intenciones de Misa.")}</p>
    ${cui.err ? `<div class="notice">⚠️ ${esc(cui.err)}</div>` : ""}`;
  h += `<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:13px"><tr><th style="text-align:left;padding:4px">⛪</th>${roles.map(r => `<th style="text-align:left;padding:4px;min-width:110px">${esc(r)}</th>`).join("")}<th></th></tr>`;
  masses.forEach((m, ri) => {
    h += `<tr style="border-top:1px solid var(--line, #e5dcc8)"><td style="padding:4px"><b>${esc(m)}</b></td>`;
    roles.forEach((r, ci) => {
      h += `<td style="padding:4px"><input id="cmx-${ri}-${ci}" value="${esc((seed[m] || {})[r] || "")}" placeholder="—" style="width:100%;min-width:110px"></td>`;
    });
    h += `<td style="padding:4px"><button class="btn btnGhost" data-action="content-mindelmass" data-m="${esc(m)}">✕</button></td></tr>`;
  });
  h += `</table></div>
    <div class="grid2"><div><label>${en ? "New Mass (e.g. 6:00 PM)" : "Nueva Misa (ej. 6:00 PM)"}</label><input id="cm-newmass" placeholder="…"></div><div><label>&nbsp;</label><div class="btnRow"><button class="btn btnNavy" data-action="content-minaddmass">＋</button></div></div></div>
    <div class="btnRow"><button class="btn btnNavy" data-action="content-minsave">${en ? "Save table" : "Guardar tabla"}</button>
    <button class="btn btnGhost" data-action="content-reset" data-b="ministry.seed">${en ? "Reset" : "Restablecer"}</button></div>
    <p class="small">${esc(en ? "To rename or add role columns, use the “Role names” tab." : "Para renombrar o agregar columnas de roles, usa la pestaña “Nombres de roles”.")}</p>`;
  return h;
}
function contentFormHTML(key){
  if(!key || !CONTENT_TITLES[key]) key = "parishes";
  cui.block = key;
  if(key === "parishes") return "";
  if(key === "schedule" || (key && key.indexOf("events.") === 0)) return "";
  if(key === "links") return linksHTML();
  if(key === "bulletin.fallback") return bulletinHTML();
  if(key === "sacraments") return itemListHTML(key);
  if(key === "week") return weekHTML();
  if(key === "inspirations") return inspHTML();
  if(key === "ministry.seed") return ministryHTML();
  if(key === "art") return artHTML();
  if(key === "ministry.roles" || key === "fieles" || key === "categories"){
    const en = cbEN(), arr = formArr(key);
    const ph = key === "ministry.roles" ? "Sacerdote\nDiácono\nLectores" : (key === "fieles" ? "Familia Hernández\nMaría Torres" : "Misa\nAdoración\nJóvenes");
    return linesHTML(key, arr, ph);
  }
  if(SCH[key]) return itemListHTML(key);
  return `<p class="small">${esc(CONTENT_TITLES[key] || key)}</p>`;
}

// Maneja TODAS las acciones content-*. Devuelve true si la manejó.
// ctx: { ED, parishId, parishName, refresh }
export function handleContentAction(a, el, ctx){
  ctx = ctx || {};
  const refresh = ctx.refresh || (() => {});
  const scope = (el && el.closest && el.closest("section")) || document;
  const SG = (id) => { try { return scope.querySelector("#" + id); } catch(e){ return null; } };
  const SV = (id) => { const n = SG(String(id).replace(/^#/,"")); return n ? (n.value || "").trim() : ""; };
  const SC = (id) => { const n = SG(String(id).replace(/^#/,"")); return !!(n && n.checked); };
  const needEd = () => { if(!(ctx && ctx.ED)) return true; return false; };
  if(a === "content-block"){ cui.block = el.dataset.b; cui.formEdit = null; cui.err = ""; cui.evErr = "";
    if(cui.block && cui.block.indexOf("events.") === 0) cui.evList = cui.block;
    refresh(); return true; }
  if(a === "content-pedit"){ cui.pedit = el.dataset.id; refresh(); return true; }
  if(a === "content-parish-save"){ if(needEd()) return true;
    const lines = id => val("#" + id).split("\n").map(s => s.trim()).filter(Boolean);
    const arr = PARISHES.map(p => p.id === cui.pedit ? { ...p, name: val("#cp-name") || p.name, city: val("#cp-city"), address: val("#cp-address"), phone: val("#cp-phone"), web: val("#cp-web"), priest: val("#cp-priest"), greeting: val("#cp-greeting"), confession: val("#cp-conf"), adoration: val("#cp-ador"), massTimes: { Sunday: lines("cp-sun"), Saturday: lines("cp-sat"), Daily: lines("cp-daily") } } : p);
    if(!arr.find(p => p.id === cui.pedit)) return true;
    cSave(Content.save("parishes", arr), () => refresh(), ctx); return true; }
  if(a === "content-reset"){ if(needEd()) return true;
    cui.formEdit = null; cui.err = ""; cui.evErr = ""; cui.evEdit = null; cui.massEdit = null;
    cSave(Content.reset(el.dataset.b), () => refresh(), ctx); return true; }
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
  // ---- Formularios visuales (sin código) ----
  if(a === "content-lang"){ cui.formLang = el.dataset.l || "es"; cui.formEdit = null; refresh(); return true; }
  if(a === "content-new"){ if(needEd()) return true; cui.formEdit = { key: el.dataset.b, ix: "new" }; cui.err = ""; refresh(); return true; }
  if(a === "content-edit"){ if(needEd()) return true; cui.formEdit = { key: el.dataset.b, ix: +el.dataset.ix }; cui.err = ""; refresh(); return true; }
  if(a === "content-cancel"){ cui.formEdit = null; cui.err = ""; refresh(); return true; }
  if(a === "content-del"){ if(needEd()) return true;
    const key = el.dataset.b, ix = +el.dataset.ix;
    if(key === "inspirations"){
      const o = formObj(key, { es: [], en: [] });
      const esA = (o.es || []).slice(), enA = (o.en || []).slice();
      esA.splice(ix, 1); enA.splice(ix, 1);
      cSave(Content.save(key, { es: esA, en: enA }), () => refresh(), ctx); return true;
    }
    let arr;
    if(SCH[key] && SCH[key].langs){
      const lo = formObj(key, { es: [], en: [] });
      const cur = ((lo[cui.formLang] || []).slice()); cur.splice(ix, 1);
      arr = rebuildLang(key, cur);
    } else { arr = formArr(key).slice(); arr.splice(ix, 1); }
    cSave(Content.save(key, arr), () => { cui.formEdit = null; refresh(); }, ctx); return true; }
  if(a === "content-save"){ if(needEd()) return true;
    const key = el.dataset.b, S = SCH[key], en = cbEN();
    if(key === "inspirations"){
      const o = formObj(key, { es: [], en: [] });
      const esA = (o.es || []).slice(), enA = (o.en || []).slice();
      const ix = (cui.formEdit && cui.formEdit.ix === "new") ? esA.length : cui.formEdit.ix;
      const t1 = SV("#ci-title"), b1 = SV("#ci-body"), t2 = SV("#ci-etitle"), b2 = SV("#ci-ebody");
      if(!t1 || !b1 || !t2 || !b2){ cui.err = en ? "Title and text are required in both languages." : "Faltan título y texto en los dos idiomas."; refresh(); return true; }
      esA[ix] = { day: SV("#ci-day") || "Hoy", title: t1, body: b1, tag: SV("#ci-tag") };
      enA[ix] = { title: t2, body: b2 };
      cui.err = ""; cui.formEdit = null;
      cSave(Content.save(key, { es: esA, en: enA }), () => refresh(), ctx); return true;
    }
    if(!S) return true;
    const built = {};
    for(const f of S.fields){
      const id = "cf-" + f.k;
      if(f.t === "check") built[f.k] = SC(id);
      else if(f.t === "num") built[f.k] = parseFloat(SV(id)) || 0;
      else built[f.k] = SV(id);
    }
    for(const f of (S.fields || [])){
      if(f.req && !built[f.k]){ cui.err = en ? "Please fill the required fields (*)." : "Faltan campos obligatorios (*)."; refresh(); return true; }
    }
    // campos especiales (listas dentro del renglón)
    if(key === "giving"){
      built.updates = SV("#cf-_updates").split("\n").map(s => s.trim()).filter(Boolean).map(line => {
        const p = line.split("|"); return { d: (p[0] || "").trim(), t: (p[1] || "").trim() };
      }).filter(u => u.d || u.t);
      delete built._updates;
    }
    if(key === "bulletins.seed"){
      built.sections = SV("#cf-_sections").split("\n").map(s => s.trim()).filter(Boolean).map(line => {
        const p = line.split("|"); return { h: (p[0] || "").trim(), p: (p[1] || line).trim() };
      });
      delete built._sections;
    }
    if(key === "directory.seed"){
      built.birthdays = SV("#cf-_birthdays").split("\n").map(s => s.trim()).filter(Boolean).map(line => {
        const p = line.split(","); const md = (p[1] || "").trim();
        return /^\d{2}-\d{2}$/.test(md) ? { name: (p[0] || "").trim(), md } : null;
      }).filter(Boolean);
      delete built._birthdays;
      const av = SV("#cf-_anniv");
      if(av){ const p = av.split(","); const md = (p[1] || "").trim();
        built.anniversary = /^\d{2}-\d{2}$/.test(md) ? { couple: (p[0] || "").trim(), md } : null;
      } else built.anniversary = null;
      delete built._anniv;
    }
    let arr = S.langs ? null : formArr(key).slice();
    if(S.langs){
      const o = formObj(key, { es: [], en: [] });
      const cur = ((o[cui.formLang] || []).slice());
      const ix = (cui.formEdit && cui.formEdit.ix === "new") ? cur.length : cui.formEdit.ix;
      const old = cur[ix] || {};
      cur[ix] = { ...old, ...built };
      if(!cur[ix].id) cur[ix].id = "c" + Date.now();
      arr = rebuildLang(key, cur);
    } else {
      const ix = (cui.formEdit && cui.formEdit.ix === "new") ? arr.length : cui.formEdit.ix;
      const old = arr[ix] || {};
      arr[ix] = (cui.formEdit && cui.formEdit.ix === "new") ? { id: "c" + Date.now(), ...built } : { ...old, ...built };
    }
    cui.err = ""; cui.formEdit = null;
    cSave(Content.save(key, arr), () => refresh(), ctx); return true; }
  if(a === "content-linessave"){ if(needEd()) return true;
    const key = el.dataset.b, en = cbEN();
    const lines = (SG("ct-lines") ? SG("ct-lines").value : "").split("\n").map(s => s.trim()).filter(Boolean);
    if(!lines.length){ cui.err = en ? "Write at least one line." : "Escribe al menos una línea."; refresh(); return true; }
    cui.err = "";
    cSave(Content.save(key, lines), () => refresh(), ctx); return true; }
  if(a === "content-linksave"){ if(needEd()) return true;
    cui.err = "";
    cSave(Content.save("links", { yt: SV("#cfl-yt"), bulletin: SV("#cfl-bulletin") }), () => refresh(), ctx); return true; }
  if(a === "content-bulsave"){ if(needEd()) return true;
    const v = { y: parseInt(SV("#cfb-y")) || 0, mo: parseInt(SV("#cfb-mo")) || 0, d1: parseInt(SV("#cfb-d1")) || 0, d2: parseInt(SV("#cfb-d2")) || 0, pdf: SV("#cfb-pdf"), view: SV("#cfb-view") };
    cui.err = "";
    cSave(Content.save("bulletin.fallback", v), () => refresh(), ctx); return true; }
  if(a === "content-artsave"){ if(needEd()) return true;
    const cur = formObj("art", {});
    const v = { ...cur };
    for(const [k] of ART_LABELS) v[k] = SV("#cfart-" + k);
    cui.err = "";
    cSave(Content.save("art", v), () => refresh(), ctx); return true; }
  if(a === "content-weekday"){ cui.weekDay = el.dataset.d || "sun"; refresh(); return true; }
  if(a === "content-daysave"){ if(needEd()) return true;
    const en = cbEN(), d = cui.weekDay || "sun";
    const wobj = formObj("week", null);
    const es = ((wobj && wobj.es) || []).slice();
    const enObj = { ...(((wobj && !Array.isArray(wobj) && wobj.en && !Array.isArray(wobj.en)) ? wobj.en : {})) };
    if(es.length !== 7){ cui.err = en ? "Week data is incomplete; reset the week first." : "La semana está incompleta; restablécela primero."; refresh(); return true; }
    const ix = es.findIndex(x => x && x.key === d);
    if(ix < 0){ cui.err = en ? "Day not found." : "Día no encontrado."; refresh(); return true; }
    const rt = SV("#cw-rtitle"), rf = SV("#cw-refl");
    if(!rt || !rf){ cui.err = en ? "Reflection title and text are required." : "Faltan título y texto de la reflexión."; refresh(); return true; }
    es[ix] = { key: d, weekday: SV("#cw-weekday"), feast: SV("#cw-feast"), rank: SV("#cw-rank"),
      color: SV("#cw-color"), season: SV("#cw-season"),
      citations: { first: SV("#cw-first"), psalm: SV("#cw-psalm"), second: SV("#cw-second") || "—", gospel: SV("#cw-gospel") },
      verse: { ref: SV("#cw-vref"), text: SV("#cw-vtext") },
      reflectionTitle: rt, reflection: rf };
    enObj[d] = { weekday: SV("#cw-eweekday"), feast: SV("#cw-efeast"), season: SV("#cw-eseason"), rank: SV("#cw-erank"),
      reflectionTitle: SV("#cw-ertitle"), reflection: SV("#cw-erefl") };
    cui.err = "";
    cSave(Content.save("week", { es, en: enObj }), () => refresh(), ctx); return true; }
  if(a === "content-minaddmass"){ if(needEd()) return true;
    const m = SV("#cm-newmass");
    if(!m) return true;
    const seed = { ...formObj("ministry.seed", {}) };
    if(!seed[m]) seed[m] = {};
    cui.err = "";
    cSave(Content.save("ministry.seed", seed), () => refresh(), ctx); return true; }
  if(a === "content-mindelmass"){ if(needEd()) return true;
    const seed = { ...formObj("ministry.seed", {}) };
    delete seed[el.dataset.m];
    cSave(Content.save("ministry.seed", seed), () => refresh(), ctx); return true; }
  if(a === "content-minsave"){ if(needEd()) return true;
    const roles = formArr("ministry.roles");
    const seed = { ...formObj("ministry.seed", {}) };
    const masses = Object.keys(seed);
    const out = {};
    masses.forEach((m, ri) => {
      out[m] = {};
      roles.forEach((r, ci) => {
        const el2 = SG("cmx-" + ri + "-" + ci);
        const v = el2 ? (el2.value || "").trim() : "";
        out[m][r] = v || "Por asignar";
      });
    });
    cui.err = "";
    cSave(Content.save("ministry.seed", out), () => refresh(), ctx); return true; }
  return false;
}
function rebuildLang(key, curArr){
  const o = formObj(key, { es: [], en: [] });
  const out = { es: (o.es || []).slice(), en: (o.en || []).slice() };
  out[cui.formLang] = curArr;
  return out;
}
