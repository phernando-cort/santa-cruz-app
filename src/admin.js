// Página de administración SEPARADA (src/admin.html) — no enlazada desde la app.
// Solo accede quien tenga la contraseña de admin o una cuenta de editor/admin.
// Todo lo que cambia aquí se guarda en Supabase y la app lo refleja al instante.
import { Content, PARISHES } from "./content.js";
import { contentMgrHTML, handleContentAction } from "./content-ui.js";
import { Sync } from "./sync.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const val = (id) => $(id)?.value.trim() || "";
async function sha256hex(s){ const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s))); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
async function hashPw(salt, pw){ let h = salt + "::" + pw; for(let i = 0; i < 5000; i++) h = await sha256hex(h); return h; }
function newSalt(){ return [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, "0")).join(""); }
function newCode(){ const c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; const r = crypto.getRandomValues(new Uint8Array(8)); let s = ""; for(const x of r) s += c[x % c.length]; return "SC-" + s.slice(0, 4) + "-" + s.slice(4); }

const A = { tab: "contenidos", parish: "santa-cruz", session: null, msg: "", accMsg: "", codes: {} };
try { A.session = JSON.parse(localStorage.getItem("admin.session") || "null"); } catch(e){ A.session = null; }
function saveSession(){ try { localStorage.setItem("admin.session", JSON.stringify(A.session)); } catch(e){} }

Sync.getParish = () => A.parish;
Sync.getUser = () => (A.session && A.session.name) || "";

function canContent(){ return !!(A.session && (A.session.admin || A.session.role === "admin" || A.session.role === "editor")); }
function adminCtx(){
  const p = PARISHES.find(x => x.id === A.parish) || PARISHES[0] || { name: "" };
  return { ED: canContent(), parishId: A.parish, parishName: p.name, refresh: render };
}

function renderLogin(root){
  root.innerHTML = `<div class="card"><div class="adminTop"><h2 class="serif">🔐 Administración</h2></div>
    <p class="sub">Página privada de edición. Todo cambio se refleja al instante en la app. No compartas este enlace.</p>
    ${A.msg ? `<div class="notice">${esc(A.msg)}</div>` : ""}
    <h4>Contraseña maestra</h4>
    <label>Contraseña de administrador</label>
    <input id="alMaster" type="password" autocomplete="off" placeholder="••••••••">
    <div class="btnRow"><button class="btn btnNavy" data-action="adm-master">Entrar como admin</button></div>
    <h4 style="margin-top:14px">Cuenta de editor</h4>
    <label>Nombre</label><input id="alName" autocomplete="username" placeholder="Tu nombre">
    <label>Contraseña</label><input id="alPw" type="password" autocomplete="current-password" placeholder="••••••••">
    <div class="btnRow"><button class="btn btnGold" data-action="adm-user">Entrar como editor</button></div>
    <p class="small">${Sync.online ? "🟢 nube conectada" : "🟡 conectando… (sin nube solo lectura local)"}</p>
  </div>`;
}

function renderMain(root){
  const s = A.session;
  const tabs = [["contenidos", "✏️ Contenidos"], ["avisos", "🔔 Avisos"], ...(s.admin ? [["cuentas", "👥 Cuentas"]] : [])];
  let h = `<div class="card"><div class="adminTop"><h2 class="serif">🔐 Administración</h2>
    <span class="tag gold">${s.admin ? "admin" : esc(s.role || "editor")}</span><b>${esc(s.name || "")}</b>
    <span style="margin-left:auto"></span><button class="btn btnGhost" data-action="adm-logout">Salir</button></div>
    <p class="small">${Sync.online ? "🟢 nube conectada — los cambios llegan a la app al instante" : "🟡 sin nube — revisa tu conexión"}${Content.error ? " · contenido: " + esc(Content.error) : ""}</p>
    <label>Parroquia (para avisos)</label><select id="alParish">${PARISHES.map(p => `<option value="${esc(p.id)}" ${p.id === A.parish ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
    <div class="subnav" style="margin-top:10px">${tabs.map(([id, l]) => `<button class="${A.tab === id ? "active" : ""}" data-action="adm-tab" data-t="${id}">${l}</button>`).join("")}</div>
    ${A.msg ? `<div class="notice">${esc(A.msg)}</div>` : ""}
  </div>`;
  if(A.tab === "contenidos") h += contentMgrHTML(adminCtx());
  if(A.tab === "avisos") h += avisosHTML();
  if(A.tab === "cuentas" && s.admin) h += cuentasHTML();
  root.innerHTML = h;
}

function avisosHTML(){
  const list = Sync.coll("messages") || [];
  return `<div class="card" id="sec-avisos"><h3>🔔 Avisos (para toda la app)</h3>
    ${list.map(m => `<div class="eventRow"><div style="flex:1"><b>${esc(m.title)}</b><div class="small">${esc(m.from || "")} · ${esc(m.channel || "")} · ${esc(m.time || "")}</div><div class="small">${esc((m.body || "").slice(0, 160))}</div></div>
      <button class="btn btnGhost" data-action="adm-msg-del" data-id="${esc(m.id)}">Borrar</button></div>`).join("") || `<p class="small">Sin avisos.</p>`}
    <h4 style="margin:10px 0 2px">Nuevo aviso</h4>
    <label>Título</label><input id="amTitle" placeholder="Misa de 10:30 con transmisión">
    <div class="grid2"><div><label>Canal</label><select id="amChannel"><option>Aviso</option><option>Correo</option><option>SMS</option><option>Comunidad</option><option>Oficina</option></select></div>
    <div><label>De</label><input id="amFrom" value="${esc((A.session && A.session.name) || "Oficina parroquial")}"></div></div>
    <label>Mensaje</label><textarea id="amBody" rows="3"></textarea>
    <div class="btnRow"><button class="btn btnNavy" data-action="adm-msg-add">Publicar aviso</button></div>
  </div>`;
}

function cuentasHTML(){
  const users = [...(Sync.coll("users") || [])].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  return `<div class="card" id="sec-cuentas"><h3>👥 Cuentas y permisos</h3>
    <p class="sub">Crea cuentas con invitación. El código se muestra UNA vez: cópialo y envíaselo a la persona.</p>
    ${A.accMsg ? `<div class="notice">${esc(A.accMsg)}</div>` : ""}
    ${users.map(u => `<div class="eventRow"><div style="flex:1"><b>${esc(u.name)}</b> <span class="tag ${u.role === "admin" ? "gold" : "green"}">${esc(u.role)}</span>
      <div class="small">${esc(u.contact || "")} · ${u.pass ? "con contraseña" : "⚠️ sin activar"}</div>
      ${A.codes[u.id] ? `<div class="notice">Código para <b>${esc(u.name)}</b>: <b>${esc(A.codes[u.id])}</b></div>` : ""}</div>
      <select data-accrole="${esc(u.id)}" title="rol"><option value="member" ${u.role === "member" ? "selected" : ""}>member</option><option value="editor" ${u.role === "editor" ? "selected" : ""}>editor</option><option value="admin" ${u.role === "admin" ? "selected" : ""}>admin</option></select>
      <button class="btn btnGhost" data-action="adm-acc-role" data-id="${esc(u.id)}">Rol</button>
      <button class="btn btnGhost" data-action="adm-acc-reset" data-id="${esc(u.id)}">Código</button>
      <button class="btn btnGhost" data-action="adm-acc-del" data-id="${esc(u.id)}">Quitar</button></div>`).join("") || `<p class="small">Sin cuentas.</p>`}
    <h4 style="margin:10px 0 2px">Nueva cuenta</h4>
    <div class="grid2"><div><label>Nombre</label><input id="acName" placeholder="María García"></div>
    <div><label>Contacto</label><input id="acContact" placeholder="teléfono o email"></div></div>
    <label>Rol</label><select id="acRole"><option value="member">member</option><option value="editor" selected>editor</option><option value="admin">admin</option></select>
    <div class="btnRow"><button class="btn btnNavy" data-action="adm-acc-create">Crear + generar código</button></div>
  </div>`;
}

let rootEl = null;
export function render(){
  if(!rootEl) rootEl = document.getElementById("adminRoot");
  if(!rootEl) return;
  if(!A.session) renderLogin(rootEl);
  else renderMain(rootEl);
}

async function boot(){
  if(!rootEl) rootEl = document.getElementById("adminRoot");
  Sync.onUpdate = () => render();
  Content.can = () => canContent();
  Content.onChange = () => render();
  document.addEventListener("click", onClick);
  render();
  Content.load().then(() => render()).catch(() => render());
  try { await Sync.connect(); } catch(e){}
  render();
}

async function onClick(ev){
  const el = ev.target.closest("[data-action]");
  if(!el || (rootEl && !rootEl.contains(el))) return;
  const a = el.dataset.action;
  if(a.indexOf("content-") === 0){ handleContentAction(a, el, adminCtx()); return; }
  if(a === "adm-tab"){ A.tab = el.dataset.t; A.msg = ""; render(); return; }
  if(a === "adm-master"){
    const pw = val("#alMaster"); if(!pw) return;
    A.msg = "";
    if(!Sync.online){ A.msg = "Sin conexión a la nube todavía, espera unos segundos."; render(); return; }
    try { const ok = await Sync.auth(pw); if(ok){ A.session = { admin: true, name: val("#alName") || "Admin", role: "admin" }; saveSession(); A.msg = ""; } else A.msg = "Contraseña incorrecta."; }
    catch(e){ A.msg = "Error de conexión."; }
    render(); return;
  }
  if(a === "adm-user"){
    const n = val("#alName"), pw = val("#alPw");
    if(!n || !pw){ A.msg = "Escribe nombre y contraseña."; render(); return; }
    if(!Sync.online){ A.msg = "Sin conexión a la nube todavía, espera unos segundos."; render(); return; }
    try {
      const rec = (Sync.coll("users") || []).find(u => String(u.name || "").toLowerCase() === n.toLowerCase());
      if(!rec || !rec.pass){ A.msg = "Cuenta no encontrada o sin activar (pide tu código de invitación)."; render(); return; }
      const h = await hashPw(rec.salt || "", pw);
      if(h !== rec.pass){ A.msg = "Contraseña incorrecta."; render(); return; }
      if(rec.role !== "editor" && rec.role !== "admin"){ A.msg = "Esta cuenta no tiene permiso de edición."; render(); return; }
      A.session = { admin: false, name: rec.name, role: rec.role }; saveSession(); A.msg = "";
    } catch(e){ A.msg = "Error de conexión."; }
    render(); return;
  }
  if(a === "adm-logout"){ A.session = null; saveSession(); try { await Sync.logout(); } catch(e){} A.msg = ""; render(); return; }
  if(a === "adm-msg-add"){
    const t2 = val("#amTitle"), x = val("#amBody");
    if(!t2 || !x){ A.msg = "Título y mensaje son obligatorios."; render(); return; }
    A.msg = "";
    try {
      await Sync.push(2, { id: "m" + Date.now(), from: val("#amFrom") || "Oficina parroquial", time: "", channel: $("#amChannel")?.value || "Aviso", title: t2, body: x, to: "all" });
      A.msg = "Aviso publicado en la app. ✓";
    } catch(e){ A.msg = "No se pudo publicar: " + String((e && e.message) || e); }
    render(); return;
  }
  if(a === "adm-msg-del"){
    try { await Sync.del(2, el.dataset.id); A.msg = "Aviso borrado. ✓"; }
    catch(e){ A.msg = "No se pudo borrar (solo admin): " + String((e && e.message) || e); }
    render(); return;
  }
  if(a === "adm-acc-create"){
    const n = val("#acName"), contact = val("#acContact"), role = $("#acRole")?.value || "member";
    if(!n || !contact){ A.accMsg = "Nombre y contacto son obligatorios."; render(); return; }
    try {
      const id = "u" + Date.now(), code = newCode(), codeH = await sha256hex(code);
      await Sync.account({ op: "create", id, name: n, contact, role, codeH });
      A.codes[id] = code; A.accMsg = "Cuenta creada. Copia el código de abajo y envíaselo.";
    } catch(e){ A.accMsg = "Error: " + String((e && e.message) || e); }
    render(); return;
  }
  if(a === "adm-acc-role"){
    const id = el.dataset.id, sel = document.querySelector(`[data-accrole="${CSS.escape(id)}"]`);
    try { await Sync.account({ op: "setrole", id, role: sel ? sel.value : "member" }); A.accMsg = "Rol actualizado. ✓"; }
    catch(e){ A.accMsg = "Error: " + String((e && e.message) || e); }
    render(); return;
  }
  if(a === "adm-acc-reset"){
    const id = el.dataset.id;
    try {
      const code = newCode(), codeH = await sha256hex(code);
      await Sync.account({ op: "reset", id, codeH });
      A.codes[id] = code; A.accMsg = "Nuevo código generado. Cópialo y envíaselo.";
    } catch(e){ A.accMsg = "Error: " + String((e && e.message) || e); }
    render(); return;
  }
  if(a === "adm-acc-del"){
    const id = el.dataset.id;
    try { await Sync.del(15, id); A.accMsg = "Cuenta eliminada. ✓"; }
    catch(e){ A.accMsg = "Error: " + String((e && e.message) || e); }
    render(); return;
  }
  if(a === "jump"){ document.getElementById(el.dataset.to)?.scrollIntoView({ behavior: "smooth" }); return; }
}

export function bootAdmin(root){
  rootEl = root;
  return boot();
}

if(typeof window !== "undefined" && /admin\.html$/.test(location.pathname || "")){
  bootAdmin(document.getElementById("adminRoot"));
}
