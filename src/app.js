import { PARISHES, WEEK, WEEK_EN, INSPIRATIONS, INSP_EN, PRAYERS, ROSARY_MYSTERIES, mysteriesForWeekday, EVENTS, BULLETINS, GROUPS, CLERGY, MESSAGES, CATEGORIES, SAINTS, CANTOS, NEWS, MINISTRY_ROLES, MINISTRY_SEED, FIELES_SEED, MURO_SEED, INTENCIONES_SEED, ART, DIRECTORY_SEED, GIVING_PROJECTS, REAL_EVENTS, DATED_SEEDS, BULLETIN_FALLBACK, SACRAMENT_INFO, PARISH_YT, PARISH_BULLETIN_PAGE, Content, schedMasses } from "./content.js";
import { contentMgrHTML, handleContentAction } from "./content-ui.js";
import { Sync } from "./sync.js";
window.Sync = Sync; // handle de diagnóstico (consola/tests): Sync.online, Sync.data, Sync.auth(...)
import { LANGS, setLang, getLang, t, catName, recName, dayName, localeOf, PRAY_I18N, INT_ES, INT_TYPES, intTypeName } from "./i18n.js";
import { getDayData } from "./lectionary/litcal.js";
import { dailyFor } from "./daily-citations.js";
import { rankOf, saintsForDay, saintPrayerText } from "./saints.js";
import { getWeekEvents, isRoutineMass, isSpecialMass, isGroupMeeting, fmtDay, fmtTime } from "./gcal.js";
import { fetchUsccbDay, usccbWhich } from "./usccb.js";
import { ORDINARY } from "./missal.js";
import { CONFESION_EXAMS } from "./confesion.js";
import { ADVIENTO_GUIDE, REFLEX_FAMILIA, FAMILIA_ADVIENTO } from "./pastoral.js";

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {
  get(k, f){ try{ const v = localStorage.getItem(k); return v==null? f : JSON.parse(v);}catch{ return f; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
};

const MYST_I18N = {
  es: { gozosos:"Gozosos", dolorosos:"Dolorosos", gloriosos:"Gloriosos", luminosos:"Luminosos" },
  en: { gozosos:"Joyful", dolorosos:"Sorrowful", gloriosos:"Glorious", luminosos:"Luminous" },
  pt: { gozosos:"Gozosos", dolorosos:"Dolorosos", gloriosos:"Gloriosos", luminosos:"Luminosos" },
  it: { gozosos:"Gaudiosi", dolorosos:"Dolorosi", gloriosos:"Gloriosi", luminosos:"Luminosi" },
  la: { gozosos:"Gaudiosa", dolorosos:"Dolorosa", gloriosos:"Gloriosa", luminosos:"Luminosa" },
  fr: { gozosos:"Joyeux", dolorosos:"Douloureux", gloriosos:"Glorieux", luminosos:"Lumineux" },
  zh: { gozosos:"欢喜", dolorosos:"痛苦", gloriosos:"荣福", luminosos:"光明" },
  tl: { gozosos:"Tuwa", dolorosos:"Hapis", gloriosos:"Luwalhati", luminosos:"Liwanag" },
  vi: { gozosos:"Vui", dolorosos:"Thương", gloriosos:"Mừng", luminosos:"Sáng" },
  ar: { gozosos:"الفرح", dolorosos:"الحزن", gloriosos:"المجد", luminosos:"النور" },
  ko: { gozosos:"환희", dolorosos:"고통", gloriosos:"영광", luminosos:"빛" },
};
const mystName = (k) => (MYST_I18N[getLang()]||MYST_I18N.es)[k] || ROSARY_MYSTERIES[k].name;

const FATIMA = {
  es: "Oh Jesús mío, perdona nuestros pecados, líbranos del fuego del infierno, lleva al cielo a todas las almas, especialmente a las más necesitadas de tu misericordia. Amén.",
  en: "O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, especially those most in need of thy mercy. Amen.",
  pt: "Ó meu Jesus, perdoai-nos e livrai-nos do fogo do inferno, levai as almas todas para o céu, principalmente as que mais precisarem. Amém.",
  it: "Oh Gesù mio, perdona le nostre colpe, preservaci dal fuoco dell'inferno, porta in cielo tutte le anime, specialmente le più bisognose della tua misericordia. Amen.",
  la: "O Iesu mi, dimitte nobis debita nostra, libera nos ab igne inferni, perduc in caelum omnes animas, praesertim eas quae misericordia tua maxime indigent. Amen.",
  fr: "Ô mon Jésus, pardonnez-nous nos péchés, préservez-nous du feu de l'enfer, conduisez au ciel toutes les âmes, surtout celles qui ont le plus besoin de votre miséricorde. Amen."
};
const fatima = () => FATIMA[getLang()] || FATIMA.es;
const SIGN = {
  es: "Por la señal de la Santa Cruz, de nuestros enemigos líbranos, Señor, Dios nuestro. En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.",
  en: "By the sign of the holy Cross, deliver us from our enemies, Lord our God. In the name of the Father, and of the Son, and of the Holy Spirit. Amen.",
  pt: "Pelo sinal da Santa Cruz, livrai-nos, Deus nosso Senhor, dos nossos inimigos. Em nome do Pai, e do Filho, e do Espírito Santo. Amém.",
  it: "Nel nome del Padre, del Figlio e dello Spirito Santo. Amen.",
  la: "In nomine Patris, et Filii, et Spiritus Sancti. Amen.",
  fr: "Au nom du Père, et du Fils, et du Saint-Esprit. Amen."
};
const sign = () => SIGN[getLang()] || SIGN.es;
const CHAP_END = {
  es: "Oh Sangre y Agua, que brotaste del Corazón de Jesús como fuente de misericordia para nosotros: en Ti confío. Jesús, en Ti confío.",
  en: "O Blood and Water, which gushed forth from the Heart of Jesus as a fount of mercy for us: I trust in You. Jesus, I trust in You.",
  pt: "Ó Sangue e Água, que brotaste do Coração de Jesus como fonte de misericórdia para nós: eu confio em Vós. Jesus, eu confio em Vós.",
  it: "O Sangue e Acqua, che scaturisti dal Cuore di Gesù come sorgente di misericordia per noi: confido in Te. Gesù, confido in Te.",
  la: "O Sanguis et Aqua, quae ex Corde Iesu profluxisti sicut fons misericordiae nobis: in Te confido. Iesu, in Te confido.",
  fr: "Ô Sang et Eau, qui avez jailli du Cœur de Jésus comme source de miséricorde pour nous : j'ai confiance en Vous. Jésus, j'ai confiance en Vous."
};
const chapEnd = () => CHAP_END[getLang()] || CHAP_END.es;

function prayerText(id){
  const base = PRAYERS.find(p=>p.id===id)?.text || "";
  if(id==="salve") return (PRAY_I18N.salve[getLang()] || PRAY_I18N.salve.es);
  return (PRAY_I18N[id]?.[getLang()]) || base;
}
function insp(i){ return getLang()==="en" ? INSP_EN[i] : INSPIRATIONS[i]; }
function weekDay(i){ return getLang()==="en" ? WEEK_EN[WEEK[i].key] : WEEK[i]; }

const state = {
  lang: store.get("app.lang", "es"),
  parishId: store.get("parish.id", "santa-cruz"),
  tab: "home",
  readingDate: toISO(new Date()),
  usccbTexts: {},
  readingFont: store.get("readings.font", 17),
  prayMode: "oraciones",
  prayerCat: "Todas", prayerQ: "", prayerOpen: null,
  prayerFavs: store.get("prayer.favs", ["padrenuestro","avemaria","acordaos"]),
  usccbList: null, usccbLoading: false,
  customPrayers: store.get("prayers.custom", []),
  parishPrayers: store.get("prayers.parish", []),
  cantosExtra: store.get("cantos.extra", []),
  stream: store.get("media.stream", { yt: "", label: "" }),
  famPrayed: store.get("fam.prayed", []),
  rosarySet: mysteriesForWeekday(new Date().getDay()),
  rosaryStep: 0, rosaryAuto: false,
  chapletStep: 0, chapletAuto: false,
  saintQ: "",
  saintDate: toISO(new Date()),
  userName: store.get("user.name", ""),
  joinedGroups: store.get("groups.joined", ["g2"]),
  directoryExtra: store.get("directory.extra", []),
  dirQ: "", editingId: null, dirForm: false, dirGroup: "Todas", groupCat: "Todas", groupOpen: null,
  alertHorizon: store.get("alerts.horizon", 14),
  alertsDone: store.get("alerts.done", {}),
  muroExtra: store.get("muro.extra", []),
  intencionesExtra: store.get("intenciones.extra", []),
  intencionesHidden: store.get("intenciones.hidden", []),
  directoryHidden: store.get("directory.hidden", []),
  muroHidden: store.get("muro.hidden", []),
  intencionFilter: "Todas",
  customEvents: store.get("events.custom", []),
  datedEvents: store.get("events.dated", []),
  datedHidden: store.get("events.datedHidden", []),
  bulletinLive: store.get("bulletin.live", null) || { ...BULLETIN_FALLBACK, ts: 0 },
  reminders: store.get("reminders", []),
  support: store.get("support", {}),
  bulletinsExtra: store.get("bulletins.extra", []),
  documentsExtra: store.get("documents.extra", []),
  messagesExtra: store.get("messages.extra", []),
  pastoralExtra: store.get("pastoral.extra", []),
  _pastoralForm: null, _pastoralSent: "",
  openMsg: null,
  newsFilter: "Todas", newsExtra: store.get("news.extra", []),
  videosExtra: store.get("videos.extra", []),
  calView: "mes", calCursor: startMonth(new Date()), calSel: toISO(new Date()), calFilter: "Todas",
  ministry: store.get("ministry", null) || JSON.parse(JSON.stringify(MINISTRY_SEED)),
  ministryMass: "10:30 AM",
  admin: store.get("admin.auth", false),
  editors: store.get("admin.editors", []),
  _admMsg: "",
  inviteOk: store.get("invite.ok", false),
  _gateMsg: "",
  givingAmt: 25,
  giving: store.get("giving", null) || { goals: {}, gifts: [], updates: {}, monthly: null, name: "" },
  goalOpen: null,
  bulletinOpen: null,
  litcalEvent: null, litcalDate: "", dayData: null,
  gcal: {ready:false, events:[], live:false},
  modules: (()=>{ // Migración 1 vez (2026-11-08): la foto-encabezado (hero) vuelve a encenderse
    const defs = {hero:true, actions:true, inspire:true, events:true, bulletin:true, giving:true}; // aunque se hubiera apagado sin querer en "Personalizar inicio".
    const saved = store.get("home.modules", null) || {};
    const m = Object.assign({}, defs, saved);
    if(!store.get("home.modules.v2migrated", false)){ m.hero = true; store.set("home.modules", m); store.set("home.modules.v2migrated", true); }
    return m;
  })(),
  order: store.get("home.order", null) || ["hero","actions","inspire","events","bulletin","giving"],
  speaking: false,
  _chapelMsg: "",
  gateMode: "invite",
  _codes: {},
  _newInvite: null,
  _accMsg: "",
  _chpwMsg: "",
  fontScale: store.get("a11y.font", 1),
};
if(!state.giving.monthly) state.giving.monthly = null;
if(![1,1.15,1.3].includes(state.fontScale)) state.fontScale = 1;
if(!state.userName){ const s = store.get("account.session", ""); if(s) state.userName = s; }
Sync.getParish = () => state.parishId;
Sync.getUser = () => state.userName || "";
try { Sync.migrated = !!localStorage.getItem("sync.migrated.v1"); } catch(e) {}
Sync._dump = () => ({
  bulletins: state.bulletinsExtra, documents: state.documentsExtra, messages: state.messagesExtra,
  intenciones: state.intencionesExtra, directory: state.directoryExtra, news: state.newsExtra,
  parishPrayers: state.parishPrayers, cantos: state.cantosExtra, videos: state.videosExtra, muro: state.muroExtra,
  ministry: Object.entries(state.ministry).map(([mass, roles]) => ({ id: mass, roles })),
  updates: [...Object.entries(state.giving.updates).flatMap(([pid, arr]) => (arr || []).map((u, i) => ({ id: "u" + pid + i + (u.photo ? "p" : "") + (u.monthly ? "m" : ""), pid, d: u.d, t: u.t, ...(u.photo ? { photo: u.photo } : {}), ...(u.monthly ? { monthly: 1 } : {}) }))),
    ...(state.giving.monthly && state.giving.monthly.t ? [{ id: state.giving.monthly.id || "cm-local", pid: "blessed-sacrament", d: state.giving.monthly.d, t: state.giving.monthly.t, monthly: 1 }] : []),
    ...state.giving.gifts.filter(g => g.status === "received").map(g => ({ id: g.id, pid: g.pid, amt: g.amt, name: g.name, date: g.date, folio: g.folio }))],
  goals: Object.entries(state.giving.goals).map(([pid, goal]) => ({ id: pid, goal })),
  stream: (state.stream && state.stream.yt) ? { id: "stream", yt: state.stream.yt, label: state.stream.label || "" } : null,
  editors: state.editors.map(n => ({ id: n }))
});
Sync.onUpdate = () => { try { render(); renderMore(); renderCommunity(); renderHome(); renderCalendar(); renderPray(); } catch(e) {} };
// Contenidos editables (nube site_content, caché local): el editor corrige todo sin código.
Content.can = () => { try { return canEdit(); } catch(e){ return false; } };
Content.onChange = () => { try { render(); renderMore(); renderCommunity(); renderHome(); renderCalendar(); renderPray(); } catch(e) {} };
Content.load();
window.Content = Content; // diagnóstico (consola/tests)
setLang(state.lang);
if (!PARISHES.some(p=>p.id===state.parishId)) state.parishId = PARISHES[0].id;
if (!/^\d{4}-\d{2}-\d{2}$/.test(state.readingDate)) state.readingDate = toISO(new Date());
// Migración: completar programas de Misas y roles nuevos en datos guardados
for(const [k,v] of Object.entries(MINISTRY_SEED)){ state.ministry[k]=state.ministry[k]||{}; for(const r of MINISTRY_ROLES){ if(!(r in state.ministry[k])) state.ministry[k][r]=v[r]||"Por asignar"; } }
// ---------- administración: solo admin/editores modifican la información ----------
function canEdit(){ if(Sync.online){ if(Sync.isAdmin) return true; } else if(state.admin) return true;
  const mr = myRole(); if(mr === "admin" || mr === "editor") return true;
  if(!!state.userName){ if(Sync.online) return Sync.editors.includes(state.userName); return state.editors.includes(state.userName); }
  return false; }
function delOk(legacy){ return (Sync.online && (Sync.isAdmin || myRole() === "admin")) || (!Sync.online && legacy); }
// ---------- cuentas por invitación ----------
function myAccount(){ const nm = (state.userName || "").trim().toLowerCase(); if(!nm) return null;
  return Sync.coll("users").find(u => String(u.name || "").toLowerCase() === nm) || null; }
function myRole(){ if(Sync.online ? Sync.isAdmin : state.admin) return "admin";
  const a = myAccount(); if(a && a.pass) return a.role || "member"; return null; }
function isFullAdmin(){ return (Sync.online ? Sync.isAdmin : state.admin) || myRole() === "admin"; }
function roleLabel(r){ return r === "admin" ? t("roleAdminR") : r === "editor" ? t("roleEditor") : t("roleMember"); }
async function sha256hex(s){ const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s))); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
async function hashPw(salt, pw){ let h = salt + "::" + pw; for(let i = 0; i < 5000; i++) h = await sha256hex(h); return h; }
function newSalt(){ return [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, "0")).join(""); }
function newCode(){ const c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; const r = crypto.getRandomValues(new Uint8Array(8)); let s = ""; for(const x of r) s += c[x % c.length]; return "SC-" + s.slice(0, 4) + "-" + s.slice(4); }
function sessionOk(){ const s = store.get("account.session", "");
  if(s && state.userName === s){ if(!Sync.online) return true; if(!Sync._configReady) return true;
    const rec = Sync.coll("users").find(u => String(u.name || "").toLowerCase() === String(s).toLowerCase());
    return !!(rec && rec.pass); }
  return !!state.inviteOk; }
function applyFont(){ try{ const c = document.querySelector("#appCol"); if(c) c.style.zoom = state.fontScale || 1; }catch{} }
// ---------- puerta: solo con invitación personal o cuenta ----------
const APP_ICON = "src/icono-parroquia.png";
const APP_ICON_URL = "https://user.uploads.dev/file/378ea399d5f8db29ad8198499000be7d.png";
function setFavicon(){ try{ let l = document.querySelector("link[rel=icon]"); if(!l){ l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); } l.type = "image/png"; l.href = APP_ICON_URL; }catch{} }
function normCode(s){ return String(s || "").trim().toUpperCase(); }
function inviteCodeEff(){
  if(Sync.online && Sync.inviteCode) return Sync.inviteCode;
  if(Sync.online && !Sync._configReady) return null; // aún sincronizando: ningún código vale
  return store.get("invite.code", "") || "";
}
function renderGate(){
  const ov = $("#gateOverlay");
  if(!ov) return;
  if(sessionOk()){ ov.hidden = true; ov.innerHTML = ""; delete ov.dataset.m; return; }
  if(!["invite","login","admin"].includes(state.gateMode)) state.gateMode = "invite";
  if(!ov.hidden && ov.dataset.m === state._gateMsg && ov.dataset.l === state.lang && ov.dataset.g === state.gateMode) return;
  ov.hidden = false;
  ov.dataset.m = state._gateMsg; ov.dataset.l = state.lang; ov.dataset.g = state.gateMode;
  const m = state.gateMode;
  ov.innerHTML = `
    <div class="gateCard">
      <div class="gateMark"><img src="${APP_ICON}" alt="Santa Cruz de la Cañada"></div>
      <h2 class="serif">${t("gateTitle")}</h2>
      <p class="gateSub"><b>${esc(parish().name)}</b> · ${t("gateSub")}</p>
      ${state._gateMsg ? `<div class="notice">${esc(state._gateMsg)}</div>` : ""}
      <div class="chipRow" style="margin-bottom:4px">
        <button class="fchip ${m==="invite"?"active":""}" data-action="gate-mode" data-m="invite">${t("gateHasInvite")}</button>
        <button class="fchip ${m==="login"?"active":""}" data-action="gate-mode" data-m="login">${t("gateHasAccount")}</button>
      </div>
      ${m==="invite" ? `
      <label>${t("yourName")}</label>
      <input id="gateName" value="${esc(state.userName)}" placeholder="${esc(t("namePh"))}" autocomplete="name">
      <label>${t("gateCodeL")}</label>
      <input id="gateCode" class="gateCode" autocomplete="off" autocapitalize="characters" placeholder="${esc(t("gateCodePh"))}">
      <label>${t("gatePwL")}</label>
      <input id="gatePw1" type="password" autocomplete="new-password" placeholder="${esc(t("gatePwPh"))}">
      <label>${t("gatePw2L")}</label>
      <input id="gatePw2" type="password" autocomplete="new-password" placeholder="${esc(t("gatePwPh"))}">
      <div class="btnRow" style="margin-top:12px"><button class="btn btnGold" data-action="gate-redeem" style="flex:1">${t("gateCreateBtn")}</button></div>` : ""}
      ${m==="login" ? `
      <label>${t("yourName")}</label>
      <input id="gateName" value="${esc(state.userName)}" placeholder="${esc(t("namePh"))}" autocomplete="username">
      <label>${t("gatePwL")}</label>
      <input id="gatePwLogin" type="password" autocomplete="current-password" placeholder="${esc(t("gatePwPh"))}">
      <div class="btnRow" style="margin-top:12px"><button class="btn btnGold" data-action="gate-login" style="flex:1">${t("gateBtn")}</button></div>` : ""}
      ${m==="admin" ? `
      <label>${t("yourName")}</label>
      <input id="gateName" value="${esc(state.userName)}" placeholder="${esc(t("namePh"))}" autocomplete="username">
      <label>${t("adminT")}</label>
      <input id="gateAdmPw" type="password" autocomplete="off" placeholder="${esc(t("gateAdminPh"))}">
      <p class="small">${t("gateAdminHint")}</p>
      <div class="btnRow" style="margin-top:12px"><button class="btn btnNavy" data-action="gate-admin" style="flex:1">${t("adminLogin")}</button></div>` : ""}
      <div class="btnRow"><button class="btn btnGhost" data-action="gate-mode" data-m="${m==="admin"?"invite":"admin"}">${m==="admin"?t("gateHasInvite"):t("gateIAmAdmin")}</button></div>
      <div class="gateLangs">${LANGS.map(l => `<button class="fchip ${state.lang === l.id ? "active" : ""}" data-action="lang-set" data-l="${l.id}">${esc(l.native)}</button>`).join("")}</div>
    </div>`;
}
function srvOp(promise, renders){ (async()=>{ try{ await promise; renders(); }catch(e){ const m = String((e && e.message) || e || ""); alert(t(m.includes("editors") ? "srvNeedName" : m.includes("flood") ? "srvBusy" : "srvFail")); } })(); return true; }
function pubBoth(idx, rec, renders){ if(Sync.online) return srvOp(Sync.push(idx, rec), renders); return false; }
function mix(srv, local, seeds){ const seen = new Set(), out = []; for(const r of [...srv, ...local, ...seeds]){ if(!r || !r.id || seen.has(r.id)) continue; seen.add(r.id); out.push(r); } return out; }
function streamEff(){ return (Sync.online && Sync.stream && Sync.stream.yt) ? Sync.stream : state.stream; }
function editorsEff(){ return Sync.online ? Sync.editors : state.editors; }
function lockNote(){ return `<p class="small">${t("readOnlyNote")}</p>`; }
function isDif(i){ return i.type==="Defunciones"||i.type==="Exequias"; }
function massMinistersHTML(ev){
  if(!ev.mass) return "";
  const mm = { ...(state.ministry[ev.mass] || {}), ...((Sync.online && Sync.ministrySrv[ev.mass]) || {}) };
  if(!mm) return `<div class="small">🙌 <b>${esc(t("ministersL"))}:</b> ${esc(t("incompleteL"))}</div>`;
  const enc = mm["Encargado/a de Misa"];
  const filled = MINISTRY_ROLES.filter(r=>r!=="Encargado/a de Misa" && mm[r] && mm[r]!=="Por asignar");
  if(!enc || enc==="Por asignar"){ if(!filled.length) return `<div class="small">🙌 <b>${esc(t("ministersL"))}:</b> ${esc(t("incompleteL"))}</div>`; }
  return `<div class="small">🙌 <b>${esc(t("ministersL"))}:</b>${enc&&enc!=="Por asignar"?` <b>${esc(enc)}</b> (enc.)`:""}${filled.length?`<br>${filled.map(r=>`${esc(r)}: <b>${esc(mm[r])}</b>`).join(" · ")}`:""}</div>`;
}
function massIntentionsHTML(ev){
  if(!ev.mass) return "";
  const list = allIntenciones().filter(i=>i.massId && i.massId===ev.mass);
  const vivos = list.filter(i=>!isDif(i)), difs = list.filter(isDif);
  let h = `<div class="small">🕯️ <b>${esc(t("intentMassL"))}:</b></div>`;
  if(!list.length) return h + `<div class="small">— ${esc(t("noIntentL"))}</div>`;
  if(vivos.length) h += vivos.map(i=>`<div class="small">🙏 <b>${esc(i.names)}</b> <span>· ${esc(i.date)} — ${esc(i.text).slice(0,80)}</span></div>`).join("");
  if(difs.length) h += difs.map(i=>`<div class="small">✝ <b>${esc(i.names)}</b> <span>· ${esc(i.date)} — ${esc(i.text).slice(0,80)}</span></div>`).join("");
  return h;
}
function nextDateStr(ev){
  const n = nextOccurrence(ev); if(!n) return "";
  return n.toLocaleString(localeOf(), { weekday:"long", day:"numeric", month:"long" });
}

function startMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
function toISO(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function parish(){ return PARISHES.find(p=>p.id===state.parishId); }
function catColor(c){ return { Misa:"#8a6d1f", Adoración:"#7a4fa3", Formación:"#2f6db9", Jóvenes:"#c2553a", Servicio:"#3d7a52", Comunidad:"#5b6b7f", Sacramentos:"#964b6e" }[c] || "#888"; }
const DAYKEY_IDX = { sun:0, mon:1, tue:2, wed:3, thu:4, fri:5, sat:6 };
function nextDateForDayKey(day){
  const want = DAYKEY_IDX[day] ?? new Date().getDay();
  const t = new Date();
  for(let i=0;i<8;i++){ const d = new Date(t); d.setDate(d.getDate()+i); if(d.getDay()===want) return toISO(d); }
  return toISO(t);
}
const ALL_PRAYERS = () => [...PRAYERS, ...(state.usccbList||[]), ...mix(Sync.coll("parishPrayers"), state.parishPrayers, []), ...state.customPrayers];
const ALL_CANTOS = () => [...mix(Sync.coll("cantos"), state.cantosExtra, []), ...CANTOS];
function allEvents(){ return [...EVENTS, ...REAL_EVENTS, ...DATED_SEEDS, ...state.customEvents, ...state.datedEvents].filter(e=>!state.datedHidden.includes(e.id)); }
function datedAll(){ return [...DATED_SEEDS, ...state.datedEvents].filter(e=>!state.datedHidden.includes(e.id)); }
function allBulletins(){ return mix(Sync.coll("bulletins"), state.bulletinsExtra, BULLETINS); }
function allMessages(){ return mix(Sync.coll("messages"), state.messagesExtra, MESSAGES).filter(m=>!m.priv); }
function pastoralAll(){ return [...Sync.coll("messages").filter(m=>m&&m.priv), ...state.pastoralExtra]; }
function allDocuments(){ return mix(Sync.coll("documents"), state.documentsExtra, []); }
function msgToName(to){ if(to==="ministers") return t("msgMinisters"); const g=GROUPS.find(x=>x.id===to); if(g) return g.name; return t("msgToAll"); }
function parishPub(){ return mix(Sync.coll("parishPrayers"), state.parishPrayers, []); }
function allNews(){ return mix(Sync.coll("news"), state.newsExtra, NEWS); }
function allIntenciones(){ return mix(Sync.coll("intenciones"), state.intencionesExtra, INTENCIONES_SEED).filter(i=>!state.intencionesHidden.includes(i.id)); }
function muroAll(){ return mix(Sync.coll("muro"), state.muroExtra, MURO_SEED).filter(m=>!state.muroHidden.includes(m.id)); }
function fieles(){ const l=[...FIELES_SEED]; if(state.userName && !l.includes(state.userName)) l.unshift(state.userName+" ("+t("youTag")+")"); return l; }

// ---------- donativos ----------
const fmt$ = (n) => "$" + Math.round(+n || 0).toLocaleString("en-US");
function saveGiving(){ store.set("giving", state.giving); }
function gGoal(p){ if(Sync.online){ const sg = Sync.goalFor(p.id); if(sg != null) return +sg; } return +state.giving.goals[p.id] || +p.goal || 10000; }
function gReceived(pid){ const srv = Sync.coll("givingUpdates").filter(u=>u.pid===pid && u.amt != null).reduce((s,u)=>s+(+u.amt||0),0); const loc = Sync.migrated ? 0 : state.giving.gifts.filter(g=>g.pid===pid && g.status==="received").reduce((s,g)=>s+(+g.amt||0), 0); return srv + loc; }
function gRaised(p){ return (+p.raised0 || 0) + gReceived(p.id); }
function gUpdates(p){ const seen = new Set(), out = [...(p.updates || [])]; for(const u of [...Sync.coll("givingUpdates").filter(u=>u.pid===p.id && u.t), ...state.giving.updates[p.id] || []]){ const k = (u.d || "") + "|" + (u.t || ""); if(seen.has(k)) continue; seen.add(k); out.push(u); } return out; }
function gprojName(pid){ const p = GIVING_PROJECTS.find(x=>x.id===pid); return p ? p.name : pid; }
function gprojDesc(p){ return getLang()==="en" ? (p.descEn || p.desc) : p.desc; }
function giftDate(g){ try{ return new Date(g.date).toLocaleString(localeOf(), { day:"numeric", month:"short", year:"numeric" }); }catch{ return g.date || ""; } }
function thankText(g){
  return t("thankTpl")
    .replace("{parish}", parish().name)
    .replace("{name}", g.name)
    .replace("{amt}", fmt$(g.amt))
    .replace("{proj}", gprojName(g.pid))
    .replace("{date}", giftDate({ date: g.credited || g.date }))
    .replace("{folio}", g.folio);
}

// ---------- voz alta ----------
const VOICE_LANG = { es:"es", en:"en", pt:"pt", it:"it", la:"it", fr:"fr", zh:"zh", tl:"tl", vi:"vi", ar:"ar", ko:"ko" };
let speakToken = 0;
function speak(text, onend){
  stopSpeak();
  try{
    const u = new SpeechSynthesisUtterance(text);
    const want = VOICE_LANG[getLang()]||"es";
    u.lang = {es:"es-ES",en:"en-US",pt:"pt-BR",it:"it-IT",la:"it-IT",fr:"fr-FR",zh:"zh-CN",tl:"fil-PH",vi:"vi-VN",ar:"ar-SA",ko:"ko-KR"}[getLang()]||"es-ES";
    u.rate = 0.95;
    const vs = speechSynthesis.getVoices().find(v=>v.lang && v.lang.toLowerCase().startsWith(want));
    if (vs) u.voice = vs;
    u.onend = () => { state.speaking=false; onend && onend(); };
    u.onerror = () => { state.speaking=false; };
    speechSynthesis.speak(u); state.speaking = true;
  }catch{}
}
function stopSpeak(){ speakToken++; try{ speechSynthesis.cancel(); }catch{} stopMelody(); state.speaking=false; }

// ---------- melodías ----------
let audioCtx = null;
function playNotes(notes){
  stopSpeak();
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    if (audioCtx.state==="suspended") audioCtx.resume();
    let tm = audioCtx.currentTime + 0.05;
    notes.forEach((f)=>{
      const o=audioCtx.createOscillator(), g=audioCtx.createGain();
      o.type="triangle"; o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,tm); g.gain.exponentialRampToValueAtTime(0.22,tm+0.03);
      g.gain.exponentialRampToValueAtTime(0.0001,tm+0.3);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(tm); o.stop(tm+0.32); tm+=0.32;
    });
  }catch{}
}
function stopMelody(){ try{ if(audioCtx){ audioCtx.close(); audioCtx=null; } }catch{} }

// ---------- rosario y coronilla ----------
function rosarySteps(setKey){
  const set = ROSARY_MYSTERIES[setKey];
  const s = [{k:"✠", t: sign()},
    {k:"Credo", t: prayerText("credo-apostoles")},
    {k:"Pater", t: prayerText("padrenuestro")},
    {k:"Ave 1 · F", t: prayerText("avemaria")},
    {k:"Ave 2 · S", t: prayerText("avemaria")},
    {k:"Ave 3 · C", t: prayerText("avemaria")},
    {k:"Gloria", t: prayerText("gloria")}];
  set.items.forEach((m, i)=>{
    s.push({k:`${i+1}º · ${mystName(setKey)}`, t:`${m}. ${prayerText("padrenuestro")}`});
    for(let a=1;a<=10;a++) s.push({k:`${i+1}º · Ave ${a}/10`, t: prayerText("avemaria")});
    s.push({k:"Gloria", t:`${prayerText("gloria")} ${fatima()}`});
  });
  s.push({k:"Salve", t: prayerText("salve")});
  s.push({k:"✠", t: prayerText("salve")});
  return s;
}
function chapletSteps(){
  const s = [{k:"✠", t: sign()},
    {k:"Pater", t: prayerText("padrenuestro")},
    {k:"Ave", t: prayerText("avemaria")},
    {k:"Credo", t: prayerText("credo-apostoles")}];
  const eternal = { es:"Padre Eterno, te ofrezco el Cuerpo y la Sangre, el Alma y la Divinidad de tu amadísimo Hijo, nuestro Señor Jesucristo, como propiciación de nuestros pecados y los del mundo entero.", en:"Eternal Father, I offer you the Body and Blood, Soul and Divinity of your dearly beloved Son, our Lord Jesus Christ, in atonement for our sins and those of the whole world.", la:"Pater aeterne, offero tibi Corpus et Sanguinem, Animam et Divinitatem dilectissimi Filii tui, Domini nostri Iesu Christi, in propitiationem pro peccatis nostris et totius mundi." };
  const small = { es:"Por su dolorosa Pasión, ten misericordia de nosotros y del mundo entero.", en:"For the sake of his sorrowful Passion, have mercy on us and on the whole world.", la:"Per acerbam Passionem eius, miserere nobis et totius mundi." };
  const holy = { es:"Santo Dios, Santo Fuerte, Santo Inmortal, ten piedad de nosotros y del mundo entero. (3 veces)", en:"Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world. (3 times)", la:"Sanctus Deus, Sanctus Fortis, Sanctus Immortalis, miserere nobis et totius mundi. (ter)" };
  const E = eternal[getLang()]||eternal.es, S = small[getLang()]||small.es, H = holy[getLang()]||holy.es;
  for(let d=1; d<=5; d++){
    s.push({k:`${d} · Pater Aeternal`, t:E});
    for(let a=1;a<=10;a++) s.push({k:`${d} · ${a}/10`, t:S});
  }
  s.push({k:"Sanctus (3x)", t:H});
  s.push({k:"✠", t: chapEnd()});
  return s;
}
function goStep(kind, idx){
  const steps = kind==="rosary" ? rosarySteps(state.rosarySet) : chapletSteps();
  idx = Math.max(0, Math.min(steps.length-1, idx));
  if (kind==="rosary") state.rosaryStep = idx; else state.chapletStep = idx;
  renderPray();
  const auto = kind==="rosary" ? state.rosaryAuto : state.chapletAuto;
  if (auto){
    speak(steps[idx].k + ". " + steps[idx].t, ()=>{
      const cur = kind==="rosary" ? state.rosaryStep : state.chapletStep;
      const on = kind==="rosary" ? state.rosaryAuto : state.chapletAuto;
      if (on && cur < steps.length-1 && state.prayMode===(kind==="rosary"?"rosario":"coronilla")) goStep(kind, cur+1);
    });
  }
}

// ---------- calendario ----------
function weekdayDatesInMonth(cursor, weekdayIdx){
  const y=cursor.getFullYear(), m=cursor.getMonth(), out=[], d=new Date(y,m,1);
  while(d.getMonth()===m){ if(d.getDay()===weekdayIdx) out.push(new Date(d)); d.setDate(d.getDate()+1); }
  return out;
}
function eventDates(ev, cursor){
  if(ev.date){ const d=new Date(ev.date+"T12:00:00"); if(isNaN(d)) return [];
    return (d.getFullYear()===cursor.getFullYear()&&d.getMonth()===cursor.getMonth())?[d]:[]; }
  const dates = weekdayDatesInMonth(cursor, DAYKEY_IDX[ev.day]);
  if(ev.recurring==="Semanal") return dates;
  return dates.slice(0,1);
}
function nextOccurrence(ev, from=new Date()){
  if(ev.date){ const d=new Date(ev.date+"T12:00:00"); const a=new Date(from); a.setHours(0,0,0,0);
    if(!isNaN(d)&&d>=a&&(d-a)/86400000<=14) return d; return null; }
  for(let i=0;i<14;i++){ const d=new Date(from); d.setDate(d.getDate()+i);
    if(d.getDay()===DAYKEY_IDX[ev.day]) return d;
  }
  return null;
}
function daysUntil(ev){
  const n = nextOccurrence(ev); if(!n) return 99;
  const a = new Date(); a.setHours(0,0,0,0);
  return Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate())-a)/86400000);
}
function visibleEvents(filter){
  if(filter==="Todas"||filter==="All") return allEvents();
  const idx = (CATS[getLang()]||CATS.es).indexOf(filter);
  const esCat = CATEGORIES[idx] ?? filter;
  return allEvents().filter(e=>e.category===esCat);
}
function downloadICS(ev){
  const n = nextOccurrence(ev) || new Date();
  const stamp = `${n.getFullYear()}${String(n.getMonth()+1).padStart(2,"0")}${String(n.getDate()).padStart(2,"0")}`;
  const ics = ["BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT",`UID:${ev.id}@parroquia-demo`,`DTSTAMP:${stamp}T120000`,`SUMMARY:${ev.title}`,`LOCATION:${ev.location||""}`,`DESCRIPTION:${(ev.desc||"").slice(0,200)}`, "END:VEVENT","END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));
  a.download = ev.id+".ics"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
}
function ytId(url){
  const m = String(url||"").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m?m[1]:null;
}

// ---------- Lecturas por capas: Layer 1 = citas (daily-*) + en vivo (litcal) ----------

// ---------- directorio + alertas inteligentes ----------
function mdNext(md){
  const parts = String(md||"").split("-").map(Number);
  if(parts.length<2 || !parts[0] || !parts[1]) return null;
  const now = new Date();
  let dt = new Date(now.getFullYear(), parts[0]-1, parts[1]);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if(dt < today) dt = new Date(now.getFullYear()+1, parts[0]-1, parts[1]);
  return dt;
}
function daysTo(dt){
  const a = new Date(); a.setHours(0,0,0,0);
  return Math.round((new Date(dt.getFullYear(),dt.getMonth(),dt.getDate())-a)/86400000);
}
function normMD(md){
  const m = String(md||"").match(/(\d{1,2})\D(\d{1,2})/);
  if(!m) return null;
  return `${m[1].padStart(2,"0")}-${m[2].padStart(2,"0")}`;
}
function collectAlerts(h){
  const out = [];
  [...state.directoryExtra, ...DIRECTORY_SEED].forEach(m=>{
    (m.birthdays||[]).forEach(b=>{
      const dt = mdNext(b.md); if(!dt) return;
      const n = daysTo(dt);
      if(n<=h) out.push({type:"bday", mid:m.id, family:m.family, contact:m.contact, phone:m.phone, email:m.email, name:b.name, md:b.md, date:dt, in:n});
    });
    if(m.anniversary && m.anniversary.md){
      const dt = mdNext(m.anniversary.md); if(!dt) return;
      const n = daysTo(dt);
      if(n<=h) out.push({type:"anniv", mid:m.id, family:m.family, contact:m.contact, phone:m.phone, email:m.email, name:m.anniversary.couple, md:m.anniversary.md, date:dt, in:n});
    }
  });
  const year = new Date().getFullYear();
  return out.filter(a=>!state.alertsDone[`${a.mid}|${a.md}|${year}`]).sort((x,y)=>x.in-y.in);
}
function whenLabel(n){
  if(n===0) return t("todayTag");
  if(n===1) return t("tomorrowTag");
  return `${t("inDays")} ${n}${t("daysShort")}`;
}
function telHref(ph){ return "tel:" + String(ph||"").replace(/[^+\d]/g,""); }
function fireAutoAlert(){
  try{
    if(!("Notification" in window) || Notification.permission!=="granted") return;
    if(!store.get("alerts.auto", false)) return;
    const al = collectAlerts(state.alertHorizon);
    if(!al.length) return;
    new Notification("Santa Cruz de la Cañada · " + t("soonDates"), {
      body: al.slice(0,4).map(x=>`${x.name} — ${whenLabel(x.in)}`).join("\n")
    });
  }catch{}
}
function alertRow(a){
  const dstr = a.date.toLocaleString(localeOf(),{day:"numeric", month:"long"});
  const cleanPh = String(a.phone||"").replace(/[^+\d]/g,"");
  return `<div class="eventRow"><div class="avatar">${a.type==="bday"?"🎂":"💒"}</div>
    <div style="flex:1"><b>${esc(a.name)}</b> <span class="tag ${a.in===0?"red":"gold"}">${esc(whenLabel(a.in))}</span>
      <div class="small">${a.type==="bday"?t("bdayTag"):t("wedTag")} · ${esc(dstr)} · ${esc(a.family)}</div>
      <div class="btnRow">
        ${cleanPh?`<a class="btn btnGhost" href="tel:${cleanPh}">${t("callBtn")}</a><a class="btn btnGhost" href="sms:${cleanPh}">${t("kind_note")} SMS</a>`:""}
        ${a.email?`<a class="btn btnGhost" href="mailto:${esc(a.email)}?subject=${encodeURIComponent((a.type==="bday"?t("bdayTag"):t("wedTag"))+" — "+a.name)}">✉️</a>`:""}
        <button class="btn btnNavy" data-action="alert-done" data-mid="${a.mid}" data-md="${a.md}">${t("markDone")}</button>
      </div></div></div>`;
}

// ---------- calendario Google de la parroquia (semana + Misas especiales) ----------
let gcalBusy = false;
async function refreshGCal(){
  if(gcalBusy) return; gcalBusy = true;
  try {
    const { events, live } = await getWeekEvents();
    state.gcal = { ready:true, events: events || [], live: !!live };
  } catch(e) { state.gcal = { ready:true, events: [], live:false }; }
  gcalBusy = false;
  try { if(state.tab === "home") renderHome(); } catch(e) {}
}

// ---------- sheets ----------
function openSheet(id){ $("#"+id)?.classList.add("open"); }
function closeSheets(){ $$(".sheet").forEach(s=>s.classList.remove("open")); }

// ---------- render ----------
function render(){
  stopSpeak();
  applyFont();
  renderGate();
  document.documentElement.lang = getLang();
  $("#appCol").dir = (LANGS.find(l=>l.id===getLang())||{}).dir || "ltr";
  renderTop(); renderHome(); renderReadings(); renderCommunity(); renderPray(); renderCalendar(); renderMore(); loadBulletinLive();
  $$(".tabBtn").forEach(b=>b.classList.toggle("active", b.dataset.tab===state.tab));
  $$(".view").forEach(v=>v.classList.toggle("active", v.id==="view-"+state.tab));
}
function renderTop(){
  const p = parish();
  $("#parishNameEl").textContent = p.name;
  $("#parishCityEl").textContent = p.city;
  const wdi = new Date(state.readingDate+"T12:00:00").getDay();
  const w = weekDay(wdi);
  const season = getLang()==="en" ? WEEK_EN[WEEK[wdi].key].season : WEEK[wdi].season;
  const feast = getLang()==="en" ? WEEK_EN[WEEK[wdi].key].feast : WEEK[wdi].feast;
  const rank = getLang()==="en" ? WEEK_EN[WEEK[wdi].key].rank : WEEK[wdi].rank;
  $("#seasonEl").innerHTML = `<span class="pill">${esc(season)}</span><span>${esc(feast)} · ${esc(rank)}</span>`;
  $("#unreadDot").hidden = !store.get("msgs.unread", true);
  // tab labels
  const labels = {home:t("tab_home"),readings:t("tab_readings"),community:t("tab_community"),pray:t("tab_pray"),calendar:t("tab_calendar"),more:t("tab_more")};
  $$(".tabBtn").forEach(b=>{ const ic = b.querySelector(".ic")?.outerHTML||""; b.innerHTML = ic + labels[b.dataset.tab]; });
}

// ---------- INICIO ----------
// Helpers "Hoy en la parroquia": Misas de hoy (calendario real), lecturas, santo, ministros.
function celebFull(code){
  const c = String(code||"").trim();
  if(!c) return "";
  if(/^HC$/i.test(c)) return "Rev Father Hernando Cortes, SF";
  if(/^SL$/i.test(c)) return "Rev Father Sebastian Lee, SF";
  if(/^JP$/i.test(c)) return "Rev Father John Plans, SF";
  return c;
}
function ministryForTime(t){
  // t = "07:00" -> busca "7:00" en las claves del ministerio ("7:00 AM", "10:30 AM"...)
  const m = String(t||"").match(/^(\d{1,2}):(\d{2})/);
  if(!m) return null;
  let h = +m[1]; const mm = m[2];
  const h12 = ((h+11)%12)+1;
  const keys = Object.keys(state.ministry||{});
  const cand = keys.find(k=>k.startsWith(h12+":"+mm)) || keys.find(k=>k.startsWith(h12+":"));
  if(!cand) return null;
  const srv = (Sync.online && Sync.ministrySrv && Sync.ministrySrv[cand]) || {};
  return { mass:cand, roles:{ ...(state.ministry[cand]||{}), ...srv } };
}
function renderHome(){
  const p = parish();
  const w = weekDay(new Date().getDay());
  const wEs = WEEK[new Date().getDay()];
  const upcoming = [...allEvents()].sort((a,b)=>daysUntil(a)-daysUntil(b)).slice(0,4);
  const ins = insp(0);
  const b = allBulletins()[0];
  const rems = state.reminders.map(id=>allEvents().find(e=>e.id===id)).filter(Boolean)
    .sort((a,b2)=>daysUntil(a)-daysUntil(b2)).slice(0,3);
  const ints = allIntenciones().slice(0,2);
  const nw = allNews()[0];
  const hi = state.userName ? `${esc(state.userName.split(" ")[0])}` : t("hi");
  const mt = (arr) => arr.map(x=>`<span class="chip">✳ ${esc(x)}</span>`).join("");
  const cards = [];
  // ===== HOY EN LA PARROQUIA: 1 Misa (lecturas+ordinario) · 2 intenciones por Misa · 3 especiales · 4 santo · 5 próxima semana =====
  let todayHtml = "";
  try{
    const tIso = toISO(new Date());
    const tD = new Date(tIso+"T12:00:00");
    const tStr = tD.toLocaleDateString(localeOf(), {weekday:"long", day:"numeric", month:"long", year:"numeric"});
    const isEn = getLang()==="en";
    // Solo Santa Cruz y capillas (como en el boletín y el calendario de intenciones): fuera Sagrada Familia y Santuario.
    const allSched = schedMasses(tIso);
    const schedList = allSched.filter(mm=>!/sagrada familia|santuario/i.test(String(mm.pl||"")));
    const tDaily = dailyFor(tIso);
    const tDd = (state.dayData && state.litcalDate===tIso) ? state.dayData : null;
    const tFeast = (tDd&&tDd.feast)?tDd.feast:(tDaily?tDaily.feast:"");
    const tColor = (tDd&&tDd.color)?tDd.color:(tDaily?tDaily.color:"");
    let tCites = [];
    if(tDd&&tDd.citations&&(tDd.citations.first||tDd.citations.gospel)){
      const cc=tDd.citations;
      if(cc.first) tCites.push(cc.first);
      if(cc.psalm) tCites.push(cc.psalm);
      if(cc.second) tCites.push(cc.second);
      if(cc.gospel) tCites.push(cc.gospel);
    } else if(tDaily){ tCites = tDaily.readings.map(r=>r.citation); }
    const tSaint = saintsForDay(tFeast, tIso.slice(5), isEn?"en":"es")[0] || null;
    // — 1 · La Misa: solo citas + fiesta (el texto completo vive en la pestaña Lecturas) —
    const readHtml = tCites.length
      ? `<div class="readCite">📖 ${tCites.map(c=>esc(c)).join(" · ")}</div>
         ${tFeast?`<div class="small"><b>${esc(tFeast)}</b>${tColor?` · ${esc(litColorName(tColor))}`:""}</div>`:""}`
      : `<p class="small">${isEn?"See the Readings tab.":"Ver la pestaña Lecturas."}</p>`;
    // — 2 · Intenciones de cada Misa del día (celebrante + ministros) —
    const genSched = isEn
      ? "General schedule (Santa Cruz): Mon–Wed 7am & 6pm (Tue evening in Spanish) · Thu–Fri 7am · Sat 5:30pm Vigil · Sun 7am, 8:30am Spanish, 10:30am, 12:30pm, 6pm. Confessions Sat 4pm."
      : "Horario general (Santa Cruz): Lun–Mié 7am y 6pm (mar. en español) · Jue–Vie 7am · Sáb 5:30pm Vigilia · Dom 7am, 8:30am español, 10:30am, 12:30pm, 6pm. Confesiones sáb 4pm.";
    const massHtml = schedList.length ? schedList.map((mm)=>{
      const nInt = (mm.int||[]).length;
      const mins = ministryForTime(mm.t);
      const cel = String(mm.ce||"").split("·").map(s=>celebFull(s)).filter(Boolean).join(" · ");
      const ints = (mm.int||[]).slice(0,4).map(x=>`<div class="intentLine">• ${esc(x)}</div>`).join("")
        + (nInt>4?`<div class="small">+${nInt-4} ${isEn?"more":"más"}…</div>`:"");
      const minList = mins ? ["Sacerdote","Diácono","Encargado/a de Misa","Lectores","Coro"]
        .map(r=>mins.roles[r]&&mins.roles[r]!=="Por asignar"?`${esc(r)}: <b>${esc(mins.roles[r])}</b>`:"").filter(Boolean).join(" · ") : "";
      return `<details class="massToday"><summary>⏰ <b>${esc(mm.t||"")}</b> · ⛪ ${esc(mm.pl||parish().name)} · 🕯️ ${nInt||(isEn?"no intentions":"sin intenciones")}</summary>
        ${cel?`<div class="small">🙏 <b>${isEn?"Celebrant":"Celebrante"}:</b> ${esc(cel)}${mm.de?` · Diác. ${esc(mm.de)}`:""}</div>`:""}
        ${ints?`<div style="margin-top:4px">${ints}</div>`:""}
        ${mins&&minList?`<div class="small" style="margin-top:4px">🙌 <b>${esc(t("ministersL"))}:</b> ${minList}</div>`:""}</details>`;
    }).join("") : `<p class="small">${esc(genSched)}</p>`;
    // — 3 · Celebraciones especiales de hoy + próximas fechas fijas —
    const dw = tD.getDay(), dt = tD.getDate();
    const isFirstFri = dw===5 && dt<=7, isFirstSat = dw===6 && dt<=7, isThirdThu = dw===4 && dt>=15 && dt<=21;
    function nextMonthly(weekday, ord2){
      const base = new Date(tIso+"T12:00:00");
      for(let k=0;k<70;k++){ const d=new Date(base); d.setDate(d.getDate()+k);
        if(d.getDay()===weekday){ const n=d.getDate(); if(ord2===1&&n<=7) return d; if(ord2===3&&n>=15&&n<=21) return d; } }
      return null;
    }
    const fmtD = (d)=>d?d.toLocaleDateString(localeOf(),{weekday:"short",day:"numeric",month:"short"}):"—";
    const specs = [
      {t:isEn?"Exposition of the Blessed Sacrament":"Exposición del Santísimo", w:isEn?"1st Friday · 7:30am–4:00pm":"Primer viernes · 7:30am–4:00pm", today:isFirstFri, nx:nextMonthly(5,1)},
      {t:isEn?"Mass · San Pedro Chapel":"Misa · Capilla San Pedro", w:isEn?"1st Friday · 6:00pm":"Primer viernes · 6:00pm", today:isFirstFri, nx:nextMonthly(5,1)},
      {t:isEn?"Mass · Santo Niño de Atocha Chapel":"Misa · Capilla Santo Niño de Atocha", w:isEn?"1st Saturday · 7:00am":"Primer sábado · 7:00am", today:isFirstSat, nx:nextMonthly(6,1)},
      {t:isEn?"Mass · San Isidro Chapel, La Mesilla":"Misa · Capilla San Isidro, La Mesilla", w:isEn?"3rd Thursday · 6:00pm":"Tercer jueves · 6:00pm", today:isThirdThu, nx:nextMonthly(4,3)}
    ];
    const specHtml = specs.map(s=>`<div class="small">${s.today?`<span class="tag red">${esc(t("todayTag"))}</span> `:""}🕯️ <b>${esc(s.t)}</b> · ${esc(s.w)}${s.today?"":` · ${isEn?"Next":"Próx"}: <b>${esc(fmtD(s.nx))}</b>`}</div>`).join("");
    // — 4 · Santo del día —
    const saintHtml = tSaint
      ? `<div class="saintToday">${tSaint.image?`<img class="saintImg" src="${esc(tSaint.image)}" alt="${esc(tSaint.name.slice(0,1))}" loading="lazy">`:`<div class="avatar">${esc(tSaint.name.slice(0,1))}</div>`}
          <div style="flex:1"><b style="font-size:17px">${esc(tSaint.name)}</b>
          ${tSaint.era?`<div class="small">· ${esc(tSaint.era)}</div>`:""}
          <div style="font-size:14.5px;line-height:1.55;margin-top:4px">${esc(String(tSaint.bio||"").slice(0,140))}${String(tSaint.bio||"").length>140?"…":""}</div></div></div>`
      : `<p class="small">${esc(t("ferialNote"))}</p>`;
    // — 4b · Nos unimos en oración: intención de los Hijos (manyanet-us.org) + celebraciones del día + TODAS las intenciones de la gente —
    const SONS_INTENTION = isEn
      ? "For vocations to the Sons of the Holy Family and the perseverance of their seminarians, brothers and priests — and for families, that they may grow as true domestic churches."
      : "Por las vocaciones a los Hijos de la Sagrada Familia y la perseverancia de sus seminaristas, hermanos y sacerdotes — y por las familias, para que crezcan como verdaderas iglesias domésticas.";
    const SONS_PRAYER = isEn
      ? "Lord Jesus, who wished to spend thirty years of your mortal life in the family of Nazareth, we ask you to call many young men to follow more closely your way of life in our religious family, that desires to perpetuate and realize in our time your virtues and examples of domestic sanctity. Grant us the grace, in our entire ministry, to help families grow in natural and spiritual virtue, according to your will, so that, becoming true domestic churches, they may welcome and accompany, as a true gift, the grace of religious and priestly vocation for their children. Make of us, for young people, joyful witnesses of the Gospel of Nazareth, so that they also feel personally challenged by the urgent needs of the family institution and the present reality of the youth. Mary Most Holy and Saint Joseph, most loving parents and first teachers of Jesus, look upon each one of us with your benevolence and upon all who come to experience our way of life; grant us all the grace to be called brothers of Jesus in this your family. Jesus, Mary, and Joseph, community of faith, hope, and charity, of praise and service, school of the Gospel, norm of consecrated life and model of family living, make us participants in your life and images of your holiness, so that, like Saint Joseph Manyanet, and through his intercession, we may be, in the Church and for the Church, sons, witnesses, and apostles of the mystery of Nazareth. Amen."
      : "Señor Jesús, que quisiste pasar treinta años de tu vida mortal en la familia de Nazaret, te pedimos que llames a muchos jóvenes a seguir más de cerca tu modo de vida en nuestra familia religiosa, que desea perpetuar y hacer realidad en nuestro tiempo tus virtudes y ejemplos de santidad doméstica. Concédenos la gracia, en todo nuestro ministerio, de ayudar a las familias a crecer en virtud natural y espiritual, según tu voluntad, para que, convertidas en verdaderas iglesias domésticas, acojan y acompañen, como verdadero don, la gracia de la vocación religiosa y sacerdotal de sus hijos. Haz de nosotros, para los jóvenes, testigos gozosos del Evangelio de Nazaret, para que también ellos se sientan interpelados por las necesidades urgentes de la familia y la realidad actual de la juventud. María Santísima y san José, padres amantísimos y primeros maestros de Jesús, mirad con benevolencia a cada uno de nosotros y a todos los que vienen a conocer nuestro modo de vida; concedednos a todos la gracia de ser llamados hermanos de Jesús en esta tu familia. Jesús, María y José, comunidad de fe, esperanza y caridad, de alabanza y servicio, escuela del Evangelio, norma de la vida consagrada y modelo de la vida familiar, hacednos partícipes de vuestra vida e imágenes de vuestra santidad, para que, como san José Manyanet, y por su intercesión, seamos, en la Iglesia y para la Iglesia, hijos, testigos y apóstoles del misterio de Nazaret. Amén.";
    const sonsHtml = `<div class="massToday"><div class="massPlace">🕊️ ${isEn?"Intention of the Sons of the Holy Family":"Intención de los Hijos de la Sagrada Familia"}</div>
      <div class="intentLine">• <b>${esc(SONS_INTENTION)}</b></div>
      <div class="small">manyanet-us.org · ${isEn?"Spiritual advocacy for vocations":"Apoyo espiritual por las vocaciones"}</div>
      <details class="ordDet"><summary>📜 ${isEn?"Prayer for our Congregation":"Oración por nuestra Congregación"}</summary>
        <div class="small" style="white-space:pre-line">${esc(SONS_PRAYER)}</div>
        <div class="btnRow"><button class="btn btnGhost" data-action="ext" data-url="https://www.manyanet-us.org/vocations-support-prayer">manyanet-us.org ↗</button></div>
      </details></div>`;
    const bdayToday = collectAlerts(0);
    const intAll = allIntenciones();
    const gEv = (state.gcal && state.gcal.events) || [];
    // Las Misas especiales ya se listan abajo en "Esta semana" (🕯️): aquí solo el resumen para no duplicar.
    const nSpec = gEv.filter(e=>isSpecialMass(e.t)).length;
    const rezHtml = sonsHtml
      + (bdayToday.length?bdayToday.map(a=>`<div class="small">${a.type==="bday"?"🎂":"💒"} <b>${esc(a.name)}</b> · ${esc(a.date.toLocaleDateString(localeOf(),{day:"numeric",month:"long"}))}</div>`).join(""):"")
      + (intAll.length?`<div class="small" style="margin-top:6px"><b>🙏 ${isEn?`Intentions from our people (${intAll.length})`:`Intenciones de nuestra gente (${intAll.length})`}:</b></div>`+intAll.slice(0,2).map(intRowHTML).join("")+(intAll.length>2?`<div class="small">+${intAll.length-2} ${isEn?"more in Intentions →":"más en Intenciones →"}</div>`:"")+ (nSpec?`<div class="small">🕯️ +${nSpec} ${isEn?"special Masses listed below":"misas especiales listadas abajo"}</div>`:""):`<p class="small">${isEn?"No intentions yet. Add yours in More → Intentions.":"Aún no hay intenciones. Añade la tuya en Más → Intenciones."}</p>`);
    // — 5 · Esta semana: resumen (5 próximos + resto en Calendario) —
    const wkList = gEv.filter(e=>!isRoutineMass(e.t));
    const wkIcon = (e)=> isSpecialMass(e.t) ? "🕯️" : (isGroupMeeting(e.t) ? "👥" : "📌");
    const wkHtml = !state.gcal.ready
      ? `<p class="small">⏳ ${isEn?"Loading parish calendar…":"Cargando el calendario parroquial…"}</p>`
      : (wkList.length ? wkList.slice(0,5).map(e=>`<div class="small">${wkIcon(e)} <b>${esc(e.t)}</b> · ${esc(fmtDay(e.date, isEn))}${e.s.length>10?` · ${esc(fmtTime(e.s))}`:""}${e.l?` · ${esc(e.l)}`:""}</div>`).join("")
        + (wkList.length>5?`<div class="small">+${wkList.length-5} ${isEn?"more in Calendar →":"más en Calendario →"}</div>`:"")
      : `<p class="small">${isEn?"Nothing else coming up this week.":"Nada más próximo esta semana."}</p>`);
    todayHtml = `
    <section class="card" style="border-color:var(--terra)">
      <h3>☀️ ${isEn?"TODAY AT THE PARISH":"HOY EN LA PARROQUIA"}<span class="sub2" style="text-transform:capitalize">${esc(tStr)}</span></h3>
      <div class="todayBlock"><h4>⛪ ${isEn?"Today's Mass: readings":"La Misa de hoy: lecturas"}</h4>${readHtml}
        <div class="btnRow"><button class="btn btnNavy" data-action="home-readings">${isEn?"Read today's readings":"Leer las lecturas"}</button></div></div>
      <div class="todayBlock"><h4>🕯️ ${isEn?"Today's Masses":"Misas de hoy"} (${schedList.length||"—"})</h4>${massHtml}
        <div class="btnRow"><button class="btn btnGhost" data-action="tab" data-tab="calendar">${isEn?"Full calendar":"Calendario completo"}</button></div></div>
      <div class="todayBlock"><h4>⭐ ${isEn?"Special celebrations":"Celebraciones especiales"}</h4>${specHtml}</div>
      <div class="todayBlock"><h4>✨ ${esc(t("saintDay"))}</h4>${saintHtml}
        <div class="btnRow"><button class="btn btnGhost" data-action="home-saint">${isEn?"Saint of the day":"Ver santoral"}</button></div></div>
      <div class="todayBlock"><h4>🙏 ${isEn?"We join in prayer for the following intentions":"Nos unimos en oración por las siguientes intenciones"}</h4>${rezHtml}
        <div class="btnRow"><button class="btn btnGhost" data-action="more-focus" data-focus="sec-intenciones">${isEn?"Intentions":"Intenciones"}</button></div></div>
      <div class="todayBlock"><h4>📅 ${isEn?"This week at the parish":"Esta semana en la parroquia"}</h4>${wkHtml}
        <div class="btnRow"><button class="btn btnGhost" data-action="tab" data-tab="calendar">${isEn?"Full calendar":"Calendario completo"}</button><button class="btn btnGhost" data-action="ext" data-url="https://www.hcccsantacruz.org/events">${isEn?"Parish site ↗":"Sitio parroquial ↗"}</button></div></div>
    </section>`;
    if(todayHtml) cards.push({id:"today", html: todayHtml});
  }catch(e2){}
  if(state.modules.hero!==false) cards.push({id:"hero", html:`
    <section class="hero">
      <div class="heroTop">
        <img class="heroImg" src="${esc(ART.hero)}" alt="Iglesia histórica de Santa Cruz de la Cañada">
        <img class="heroSeal" src="${APP_ICON}" alt="Sello de Santa Cruz de la Cañada">
        <span class="heroKicker">✠ ${esc(getLang()==="en"?WEEK_EN[wEs.key].weekday:wEs.weekday)} · ${esc(getLang()==="en"?WEEK_EN[wEs.key].feast:wEs.feast)}</span>
        <div class="heroTitle"><h2>${esc(p.name)}</h2></div>
      </div>
      <div class="heroBody"><p>${esc(p.greeting)}</p>
      <div class="massRow">${mt(p.massTimes.Sunday)}</div>
      <div class="btnRow">
        <button class="btn btnGold" data-action="tab" data-tab="calendar">${t("massAndEvents")}</button>
        <button class="btn btnGhost" data-action="tab" data-tab="readings">${t("todayReadings")}</button>
      </div>
      <div class="btnRow">
        ${p.web?`<button class="btn btnGhost" data-action="ext" data-url="${esc(p.web)}">${t("livestream")}</button>`:""}
        ${p.phone?`<button class="btn btnGhost" data-action="ext" data-url="tel:${esc(p.phone.replace(/[^+\d]/g,""))}">${t("callOffice")} ${esc(p.phone)}</button>`:""}
      </div></div>
    </section>`});
  // 💌 Mensaje de bienvenida del P. Hernando (fijo en el Inicio, después del encabezado).
  const pIsEn = getLang()==="en";
  const padreBody = pIsEn
    ? `Welcome home, Holy Cross family!\nI am Father Hernando, and it fills me with joy that you are here. I have created this digital space so that we may be closer to one another and, above all, closer to Jesus, Mary, and Joseph.\nIn this app you will find Mass times, the readings of the day, prayers, and news from our parish in La Cañada. Know that this is your space.\nEach day, in my prayers, I especially remember our sick, our elderly, families going through difficult times, and our faithful departed. I also invite you to join me in praying each week for vocations to the priesthood and to religious life, especially for our beloved Congregation of the Sons of the Holy Family.\nMay this app be a small help to carry the peace of Christ in your pocket and in your heart. God bless you!`
    : `¡Bienvenidos a casa, familia de Holy Cross!\nSoy el Padre Hernando, y me llena de alegría que estés aquí. He creado este espacio digital para que estemos más cerca unos de otros y, sobre todo, más cerca de Jesús, María y San José.\nEn esta aplicación encontrarás los horarios de Misa, las lecturas del día, oraciones y las noticias de nuestra parroquia en La Cañada. Quiero que sepas que este es tu espacio.\nCada día, en mis oraciones, recuerdo especialmente a nuestros enfermos, a nuestros ancianos, a las familias que pasan por momentos difíciles y a nuestros fieles difuntos. También te invito a unirte a mí para orar cada semana por las vocaciones al sacerdocio y a la vida religiosa, especialmente por nuestra querida Congregación de los Hijos de la Sagrada Familia.\nQue esta aplicación sea una pequeña ayuda para llevar la paz de Cristo a tu bolsillo y a tu corazón. ¡Dios te bendiga!`;
  if(state.modules.hero!==false) cards.push({id:"padre", html:`
    <section class="card" style="border-color:var(--gold)"><img class="artBanner" src="${ART.retablo}" alt="Sagrada Familia" loading="lazy">
      <h3>${t("padreMsgT")}</h3>
      <p style="font-size:14.5px;line-height:1.65;white-space:pre-line">${esc(padreBody)}</p>
      <p style="font-size:14px;margin:6px 0 0"><b>— ${pIsEn?"Fr. Hernando Cortés, SF":"P. Hernando Cortés, SF"}</b></p>
    </section>`});
  if(state.modules.actions!==false) cards.push({id:"actions", html:`
    <section class="card"><h3>${hi}, ${t("famParish")}</h3>
      <p class="sub">${t("confessionT")}: ${esc(p.confession)} · ${t("adorationT")}: ${esc(p.adoration)}</p>
      <div class="grid2">
        <button class="quickBtn" data-action="pray-mode" data-mode="rosario"><div class="ic">📿</div><div class="t">${t("prayRosary")}</div><div class="d">${t("prayRosarySub")}</div></button>
        <button class="quickBtn" data-action="tab" data-tab="calendar"><div class="ic">📅</div><div class="t">${t("thisWeek")}</div><div class="d">${((state.gcal&&state.gcal.events)||[]).filter(e=>!isRoutineMass(e.t)).length||allEvents().length} ${t("activitiesCount")}</div></button>
        <button class="quickBtn" data-action="more-focus" data-focus="sec-donativos"><div class="ic">💛</div><div class="t">${t("give")}</div><div class="d">${t("giveSub")}</div></button>
        <button class="quickBtn" data-action="pray-mode" data-mode="santos"><div class="ic">✨</div><div class="t">${t("saintDay")}</div><div class="d">${SAINTS.length} ${t("saintsCount")}</div></button>
      </div></section>`});
  if(state.modules.inspire!==false) cards.push({id:"inspire", html:`
    <section class="inspire"><span class="badge">✦ ${t("inspireDaily")}</span>
      <img class="artBanner" src="${ART.desert}" alt="Nuevo México" loading="lazy">
      <h3 class="serif">${esc(ins.title)}</h3><p>${esc(ins.body)}</p>
      <div class="btnRow"><button class="btn btnNavy" data-action="tab" data-tab="readings">${t("reflectScripture")}</button></div>
    </section>`});
  if(rems.length) cards.push({id:"rems", html:`
    <section class="card"><h3>⏰ ${t("myReminders")}</h3>
      ${rems.map(ev=>{const d=daysUntil(ev); return `<div class="eventRow"><div class="dateBox"><div class="dw">${esc(dayName(ev.day).slice(0,3).toUpperCase())}</div><div class="dn">${d===0?"¡HOY":d+"d"}</div></div>
        <div style="flex:1"><b>${esc(ev.title)}</b><div class="small">${esc(ev.time)} · ${esc(ev.location||"")}</div></div>
        <button class="btn btnGhost" data-action="rem-toggle" data-id="${ev.id}">✓</button></div>`;}).join("")}
    </section>`});
  // "Próximas actividades" se eliminó del Inicio: duplicaba "Esta semana en la parroquia" (arriba).
  // El detalle completo vive en la pestaña Calendario.
  const homeAlerts = collectAlerts(14).slice(0,3);
  if(homeAlerts.length) cards.push({id:"alerts", html:`
    <section class="card"><h3>🔔 ${t("soonDates")} <span class="tag gold">${homeAlerts.length}</span></h3>
      ${homeAlerts.map(a=>`<div class="eventRow"><div class="avatar">${a.type==="bday"?"🎂":"💒"}</div>
        <div style="flex:1"><b>${esc(a.name)}</b> <span class="tag ${a.in===0?"red":""}">${esc(whenLabel(a.in))}</span>
        <div class="small">${a.type==="bday"?t("bdayTag"):t("wedTag")} · ${esc(a.date.toLocaleString(localeOf(),{day:"numeric",month:"long"}))}</div></div></div>`).join("")}
      <div class="btnRow"><button class="btn btnGhost" data-action="more-focus" data-focus="sec-alertas">${t("viewPublish").replace("→","").trim()} →</button></div>
    </section>`});
  cards.push({id:"ints", html:`
    <section class="card"><h3>🎉 ${t("commIntentions")}</h3><p class="sub">${t("commIntentionsSub")}</p>
      ${ints.map(i=>`<div class="eventRow"><div style="flex:1"><span class="tag ${(i.type==="Defunciones"||i.type==="Exequias")?"red":(i.type==="Cumpleaños"||i.type==="Nacimientos"||i.type==="Quinceañeras")?"gold":"green"}">${esc(intTypeName(i.type))}</span>
        <div><b>${esc(i.names)}</b> <span class="small">· ${esc(i.date)}</span></div>${i.mass?`<div class="small">⛪ ${esc(i.mass)}${i.place?` · ${esc(i.place)}`:""}</div>`:""}<div class="small">${esc(i.text)}</div></div></div>`).join("")}
      <div class="btnRow"><button class="btn btnGhost" data-action="more-focus" data-focus="sec-intenciones">${t("viewPublish")}</button></div>
    </section>`});
  if(nw) cards.push({id:"news", html:`
    <section class="card"><h3>📰 ${esc(nw.title)}</h3><p class="sub">${esc(nw.cat)} · ${esc(nw.date)}</p>
      <p style="font-size:14px">${esc(nw.body.slice(0,150))}…</p>
      <div class="btnRow"><button class="btn btnGhost" data-action="more-focus" data-focus="sec-noticias">${t("viewPublish")}</button></div>
    </section>`});
  if(state.modules.bulletin!==false){ const bl = state.bulletinLive||{...BULLETIN_FALLBACK, ts:0};
    cards.push({id:"bulletin", html:`
    <section class="card"><img class="artBanner" src="${ART.luminarias}" alt="Luminarias" loading="lazy"><h3>📄 ${t("bulLiveT")}</h3><p class="sub">${esc(bulletinLabel(bl))} · ${t("bulLiveSub")}</p>
      <div class="btnRow">${bl.view?`<button class="btn btnNavy" data-action="ext" data-url="${esc(bl.view)}">${t("bulView")}</button>`:""}
      ${bl.pdf?`<button class="btn btnGhost" data-action="ext" data-url="${esc(bl.pdf)}">${t("bulPdf")} 📕</button>`:""}</div>
    </section>`}); }
  if(state.modules.giving!==false) cards.push({id:"giving", html:`
    <section class="card"><h3>💛 ${t("weekendOff")}</h3><p class="sub">${t("weekendOffSub")}</p>
      <div class="btnRow">
        ${[10,25,50].map(a=>`<button class="btn ${state.givingAmt===a?"btnNavy":"btnGhost"}" data-action="giving-amount" data-amt="${a}">$${a}</button>`).join("")}
        <button class="btn btnGold" data-action="more-focus" data-focus="sec-donativos">${t("donateTo")} $${state.givingAmt}</button>
      </div></section>`});
  cards.push({id:"tail", html:`<div class="notice">${t("demoNotice")} <button class="backLink" data-action="builder-open">${t("customizeHome")} →</button></div>`});
  // — Pastoral en casa: confesión, oración y comunión (siempre visibles, en este orden) —
  const hEn = getLang()==="en";
  const confessCard = `<section class="card" id="sec-home-confess" style="border-color:var(--gold)"><h3>🕊️ ${hEn?"Prepare your next confession":"Prepara tu próxima confesión"}</h3>
    <p class="sub">⛪ ${hEn?"Confessions":"Confesiones"}: ${esc(p.confession)}</p>
    <h4 style="margin:8px 0 2px">💜 ${hEn?"Act of Contrition":"Acto de contrición"}</h4>
    <p class="prayerText">${esc(prayerText("acto-contricion"))}</p>
    <div class="btnRow"><button class="btn btnGhost" data-action="pray-aloud" data-id="acto-contricion">${esc(t("listen"))}</button></div>
    <h4 style="margin:10px 0 2px">🔍 ${hEn?`Examinations of conscience (USCCB, ${CONFESION_EXAMS.length})`:`Exámenes de conciencia (USCCB, ${CONFESION_EXAMS.length})`}</h4>
    ${CONFESION_EXAMS.map(e=>`<details class="ordDet"><summary>${esc(hEn?e.ten:e.tes)} <span class="tag">${esc(e.lang==="es"?"ES":"EN")}</span></summary>
      <div class="ordSec"><p class="prayerText" style="font-size:15px">${esc(e.text)}</p></div></details>`).join("")}
    <div class="btnRow"><button class="btn btnNavy" data-action="pray-mode" data-mode="confesion">${hEn?"Full confession guide":"Guía completa de confesión"} →</button></div>
  </section>`;
  const prayCard = `<section class="card" id="sec-home-pray"><h3>🙏 ${hEn?"Need us to pray for you?":"¿Necesitas que oremos por ti?"}</h3>
    <p class="sub">${hEn?"Write your intention here. The office and the pastoral team receive it (private).":"Escribe tu intención aquí. La oficina y el equipo pastoral la reciben (privado)."}</p>
    ${state._homePrayerSent?`<div class="notice">${esc(state._homePrayerSent)}</div>`:""}
    <label>${t("pvNamesL")}</label><textarea id="hpNames" placeholder="…"></textarea>
    <label>${t("pvKindL")}</label><select id="hpKind"><option value="enfermos">${t("pvSick")}</option><option value="difuntos">${t("pvDep")}</option></select>
    <div class="btnRow"><button class="btn btnGold" data-action="home-prayer-add">${t("sendMsg")}</button></div>
  </section>`;
  const visitCard = `<section class="card" id="sec-home-visit"><h3>🏠 ${hEn?"Need Communion brought to your home?":"¿Necesitas que lleven la comunión a tu casa?"}</h3>
    <p class="sub">${hEn?"Write to us and our ministers will bring Communion to your home.":"Escríbenos y nuestros ministros llevarán la comunión a tu casa."}</p>
    ${state._homeVisitSent?`<div class="notice">${esc(state._homeVisitSent)}</div>`:""}
    <label>${hEn?"Name of the sick person":"Nombre de la persona enferma"}</label><input id="hcSick" placeholder="…">
    <label>${hEn?"Home address":"Dirección de la casa"}</label><input id="hcAddr" placeholder="…">
    <div class="grid2"><div><label>${t("yourName")}</label><input id="hcContact" value="${esc(state.userName||"")}" placeholder="…"></div>
    <div><label>${t("phoneL")}</label><input id="hcPhone" inputmode="tel" placeholder="(505) …"></div></div>
    <label>${t("messageL")}</label><textarea id="hcNotes" placeholder="…"></textarea>
    <div class="btnRow"><button class="btn btnGold bigBtn" data-action="home-visit-add">${t("sendMsg")}</button></div>
    <div class="small">✉️ <a href="mailto:holycross.admoffice@gmail.com">holycross.admoffice@gmail.com</a> · ☎ <a href="tel:+15057533345">(505) 753-3345</a></div>
  </section>`;
  const rank = Object.fromEntries(state.order.map((id,i)=>[id,i]));
  const heroCard = cards.find(c=>c.id==="hero");
  const todayCard = cards.find(c=>c.id==="today");
  const padreCard = cards.find(c=>c.id==="padre");
  const rest = cards.filter(c=>c.id!=="hero"&&c.id!=="today"&&c.id!=="padre");
  rest.sort((a,b2)=>(rank[a.id]??99)-(rank[b2.id]??99));
  $("#view-home").innerHTML = (heroCard?heroCard.html:"") + (todayCard?todayCard.html:"") + (padreCard?padreCard.html:"") + confessCard + prayCard + visitCard + rest.map(c=>c.html).join("");
}

// ---------- LECTURAS ----------
function clampReadingDate(iso){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||"")) return toISO(new Date());
  if(iso < "2023-01-01") return "2023-01-01";
  if(iso > "2032-12-31") return "2032-12-31";
  return iso;
}
function ensureLitCal(){
  const iso = toISO(new Date());
  if(state.litcalDate === iso) return;
  state.litcalDate = iso;
  getDayData(new Date(), "US", getLang()).then(dd=>{
    if(dd){ state.dayData = dd; if(state.tab==="readings") renderReadings(); }
  }).catch(()=>{});
}
// Unified readings for one date: live Layer 1 when it's today, else offline daily data.
function readingDayData(){
  const iso = state.readingDate;
  const isToday = iso === toISO(new Date());
  const dd = (isToday && state.dayData) ? state.dayData : null;
  const daily = dailyFor(iso);
  let list = [];
  if(dd && dd.citations && (dd.citations.first || dd.citations.gospel)){
    const c = dd.citations;
    if(c.first) list.push({type:"first", citation:c.first});
    if(c.psalm) list.push({type:"psalm", citation:c.psalm});
    if(c.second) list.push({type:"second", citation:c.second});
    if(c.gospel) list.push({type:"gospel", citation:c.gospel});
  } else if(daily){
    const keep = {first:1, psalm:1, second:1, gospel:1, alleluia:1};
    list = daily.readings.filter(r=>keep[r.type]);
  }
  const feast = (dd && dd.feast) ? dd.feast : (daily ? daily.feast : "");
  const color = (dd && dd.color) ? dd.color : (daily ? daily.color : "");
  const rank = feast ? rankOf(feast) : "";
  return {iso, isToday, dd, daily, feast, color, rank, list};
}
// ---------- Lecturas: SOLO texto oficial USCCB dentro de la app ----------
// Condiciones vigentes (instalación limpia 2026-11-09):
// - Rango 2023-01-01..2032-12-31 (daily-citations 2023-2027 + daily-extra 2027-2032).
// - Sin textos de dominio público (getbible/RVR/KJV) ni botones externos: el texto
//   oficial USCCB se carga solo al abrir la pestaña y se lee/escucha in-app.
// - Citas (Layer 1) + fiesta/rango/color por rankOf(); santo único por saintsForDay().
// - Texto USCCB © USCCB, solo caché local personal/parroquial, con atribución.
// (El antiguo bloque getbible readingRowsHTML/readPassage se eliminó aquí.)
// ---------- Texto oficial USCCB dentro de la app + santos del día ----------
function usccbKey(iso){ return iso+"|"+usccbWhich(getLang()); }
function saintsDayList(R){
  const mmdd = String(R.iso||"").slice(5);
  try{ return saintsForDay(R.feast, mmdd, getLang()) || []; }catch{ return []; }
}
function saintsDayHTML(R){
  const en = getLang()==="en";
  const list = saintsDayList(R);
  if(!list.length) return "";
  const cards = list.map(s=>`
    <div class="saintCard">
      ${s.image?`<img class="saintImg" src="${esc(s.image)}" alt="${esc(String(s.name||"?").slice(0,1))}" loading="lazy">`:`<div class="avatar">${esc(String(s.name||"?").slice(0,1))}</div>`}
      <div style="flex:1;min-width:0">
        <b style="font-size:16px">${esc(s.name)}</b>
        ${s.era?`<span class="small"> · ${esc(s.era)}</span>`:""}
        ${s.bio?`<div style="font-size:14.5px;line-height:1.55;margin-top:4px">${esc(String(s.bio).slice(0,280))}${String(s.bio).length>280?"…":""}</div>`:""}
        ${(s.patron&&s.patron.length)?`<div class="small" style="margin-top:4px">🛡️ ${esc(s.patron.slice(0,4).join(" · "))}</div>`:""}
        <div class="btnRow" style="margin-top:6px">
          <button class="btn btnGhost" data-action="saint-pray" data-name="${esc(s.name)}">🙏 ${esc(en?"Prayer":"Oración")}</button>
          ${s.wiki?`<button class="btn btnGhost" data-action="ext" data-url="${esc(s.wiki)}">Wikipedia ↗</button>`:""}
        </div>
      </div>
    </div>`).join("");
  return `<div class="todayBlock"><h4>✨ ${esc(en?"Saints of the day":"Santos del día")} (${list.length})</h4>${cards}</div>`;
}
function usccbPaneHTML(R){
  const en = getLang()==="en";
  const key = usccbKey(R.iso);
  const saved = state.usccbTexts[key];
  if(saved && saved.loading) return `<div class="todayBlock"><h4>📖 ${esc(en?"Official text (USCCB)":"Texto oficial (USCCB)")}</h4><p class="small">⏳ ${esc(en?"Loading official text…":"Cargando texto oficial…")}</p></div>`;
  if(saved && saved.error) return `<div class="todayBlock"><h4>📖 ${esc(en?"Official text (USCCB)":"Texto oficial (USCCB)")}</h4>
    <div class="notice">${esc(en?"No connection. Try again when you have internet.":"Sin conexión. Reintenta cuando tengas internet.")}</div>
    <div class="btnRow"><button class="btn btnGhost" data-action="usccb-load">↻ ${esc(en?"Retry":"Reintentar")}</button></div></div>`;
  if(saved && saved.sections){
    const secs = saved.sections.map(s=>`
      <div class="massSec"><div class="massHead">${esc(String(s.title||"").replace(/:\s*$/,""))}${s.citation?` <span class="massCite">· ${esc(s.citation)}</span>`:""}</div>
      ${String(s.text||"").split(/\n\n+/).map(p=>`<p>${esc(p)}</p>`).join("")}</div>`).join("");
    return `<div class="todayBlock"><h4>📖 ${esc(en?"Official text of the Mass (USCCB)":"Texto oficial de la Misa (USCCB)")}</h4>
      <div class="massText" style="font-size:${state.readingFont}px">${secs}</div>
      <div class="btnRow"><button class="btn btnNavy" data-action="usccb-listen">🔊 ${esc(en?"Listen":"Escuchar")}</button>
      ${state.speaking?`<button class="btn btnGhost" data-action="stop-voice">${esc(en?"Stop":"Detener")}</button>`:""}
      <button class="btn btnGhost" data-action="font-dec" aria-label="A-">A−</button>
      <button class="btn btnGhost" data-action="font-inc" aria-label="A+">A+</button></div>
      <p class="small">© United States Conference of Catholic Bishops — ${esc(en?"shown from bible.usccb.org":"mostrado desde bible.usccb.org")}.</p></div>`;
  }
  return `<div class="todayBlock"><h4>📖 ${esc(en?"Official text of the Mass (USCCB)":"Texto oficial de la Misa (USCCB)")}</h4>
    <p class="small">${esc(en?"Read and listen to the official readings here, without leaving the app.":"Lee y escucha aquí mismo las lecturas oficiales, sin salir de la app.")}</p>
    <div class="btnRow"><button class="btn btnGold" data-action="usccb-load">📖 ${esc(en?"Read official text":"Leer texto oficial")}</button></div></div>`;
}
async function loadUsccbDay(){
  const iso = state.readingDate, key = usccbKey(iso);
  if(state.usccbTexts[key] && (state.usccbTexts[key].sections || state.usccbTexts[key].loading)) { if(state.tab==="readings") renderReadings(); return; }
  state.usccbTexts[key] = {loading:true};
  if(state.tab==="readings") renderReadings();
  const r = await fetchUsccbDay(iso, getLang());
  state.usccbTexts[key] = r.data ? {sections:r.data.sections, feast:r.data.title, url:r.data.url} : {error:r.error||"net"};
  if(state.tab==="readings" && state.readingDate===iso) renderReadings();
}
function speakUsccb(){
  const saved = state.usccbTexts[usccbKey(state.readingDate)];
  if(!saved || !saved.sections) return;
  const text = saved.sections.map(s=>`${s.title}. ${s.citation}. ${s.text}`).join("\n\n");
  speak(text);
  if(state.tab==="readings") renderReadings();
}
function renderReadings(){
  if(state.tab==="readings") ensureLitCal();
  state.readingDate = clampReadingDate(state.readingDate);
  // El texto oficial USCCB carga solo, dentro de la app (sin botón previo).
  if(state.tab==="readings"){
    const uk = usccbKey(state.readingDate);
    if(!state.usccbTexts[uk]){ loadUsccbDay(); return; }
  }
  const R = readingDayData();
  const d = new Date(R.iso+"T12:00:00");
  const wdIdx = d.getDay();
  const wM = getLang()==="en" ? WEEK_EN[WEEK[wdIdx].key] : WEEK[wdIdx];
  const dateStr = d.toLocaleDateString(localeOf(), { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  const prevD = new Date(d); prevD.setDate(prevD.getDate()-1);
  const nextD = new Date(d); nextD.setDate(nextD.getDate()+1);
  const prevISO = toISO(prevD), nextISO = toISO(nextD);
  $("#view-readings").innerHTML = `
    <h2 class="serif" style="margin:4px 0">${t("readingsTitle")}</h2>
    <p class="small">${t("readingsSub")} · ${esc(t("readingsRange"))}</p>
    <section class="card">
      <div class="btnRow" style="margin:0 0 8px">
        <button class="btn btnGhost" data-action="reading-move" data-iso="${prevISO}" ${prevISO<"2023-01-01"?"disabled":""}>${esc(t("prev"))}</button>
        <button class="btn btnGhost" data-action="reading-today">${esc(t("today"))}</button>
        <button class="btn btnGhost" data-action="reading-move" data-iso="${nextISO}" ${nextISO>"2032-12-31"?"disabled":""}>${esc(t("next"))}</button>
      </div>
      <input type="date" id="readingDate" value="${R.iso}" min="2023-01-01" max="2032-12-31" aria-label="${esc(t("readingsTitle"))}" style="width:100%">
      ${R.feast ? `
      <div class="small" style="margin-top:8px;text-transform:capitalize">${esc(dateStr)}</div>
      <h3 class="serif" style="margin:4px 0">${esc(R.feast)}</h3>
      <div class="chipRow"><span class="tag ${R.rank==="solemnity"||R.rank==="sunday"?"gold":""}">${esc(saintRankLabel(R.rank))}</span>
        ${R.color?`<span class="tag"><span class="catDot" style="background:${LIT_DOT[String(R.color).toLowerCase()]||"#888"}"></span>${esc(litColorName(R.color))}</span>`:""}
        ${R.isToday&&R.dd?`<span class="tag">🟢 ${esc(R.dd.source==="cpbjr"?"USCCB":"live")}</span>`:""}
        ${R.daily&&R.daily.lectionary?`<span class="tag">#${R.daily.lectionary}</span>`:""}</div>
      ${R.list.length?`<div class="readCite" style="margin-top:8px">📖 ${R.list.map(r=>esc(r.citation)).join(" · ")}</div>`:""}
      ${saintsDayHTML(R)}
      ${usccbPaneHTML(R)}
      ${R.list.length?`
      ${(R.isToday&&R.dd&&R.dd.quote)?`<div class="verseBox">“${esc(R.dd.quote)}”<br><span class="small">— ${esc(R.feast)}</span></div>`:""}`
      :`<p class="small">${esc(t("noResults"))}</p>`}`
      :`<p class="small">${esc(t("readingsRange"))}</p>`}
    </section>
    <section class="card"><div class="small"><b>${esc(t("meditation"))}</b> · ${esc(wM.weekday)}</div>
      <h3 class="serif" style="font-size:19px">${esc(wM.reflectionTitle)}</h3>
      <div class="verseBox">“${esc(WEEK[wdIdx].verse.text)}”<br><span class="small">— ${esc(WEEK[wdIdx].verse.ref)}</span></div>
      <p style="line-height:1.6">${esc(getLang()==="en"?wM.reflection:wM.reflection)}</p>
      <div class="btnRow"><button class="btn btnGhost" data-action="read-aloud">${t("listen")}</button>
      ${state.speaking?`<button class="btn btnGhost" data-action="stop-voice">${esc(t("stop"))}</button>`:""}</div>
    </section>`;
  $("#readingDate")?.addEventListener("change", e=>{ state.readingDate = clampReadingDate(e.target.value); renderReadings(); });
}
// (Instalación limpia: sin ruta getbible/dominio público. Solo USCCB vía fetchUsccbDay + speakUsccb.)

// ---------- ORACIÓN ----------
function renderPray(){
  if(!state.usccbList && !state.usccbLoading){ state.usccbLoading = true;
    import("./usccb-prayers.js").then(m=>{ state.usccbList = m.USCCB_PRAYERS.map(p=>({...p, usccb:true})); state.usccbLoading=false; if(state.tab==="pray") renderPray(); }).catch(()=>{ state.usccbLoading=false; }); }
  const modes = [["confesion",t("m_confesion")],["oraciones",t("m_oraciones")],["rosario",t("m_rosario")],["coronilla",t("m_coronilla")],["vocaciones",t("m_vocaciones")],["santos",t("m_santos")],["familia",t("m_familia")],["mias",t("m_mias")]];
  let body = `<h2 class="serif" style="margin:4px 0">${t("prayTitle")}</h2>
    <div class="subnav">${modes.map(([m,l])=>`<button class="${state.prayMode===m?"active":""}" data-action="pray-mode" data-mode="${m}">${l}</button>`).join("")}</div>`;
  if (state.prayMode==="oraciones") body += prayListHTML();
  else if (state.prayMode==="confesion") body += confessionHTML();
  else if (state.prayMode==="vocaciones") body += vocacionesHTML();
  else if (state.prayMode==="familia") body += familiaHTML();
  else if (state.prayMode==="mias") body += myPrayersHTML();
  else if (state.prayMode==="rosario") body += rosaryHTML();
  else if (state.prayMode==="coronilla") body += chapletHTML();
  else if (state.prayMode==="santos") body += saintsHTML();
  $("#view-pray").innerHTML = body;
  const qi = $("#prayerQ");
  qi?.addEventListener("input", e=>{ state.prayerQ = e.target.value; const pos=e.target.selectionStart; renderPray(); const n=$("#prayerQ"); n?.focus(); n?.setSelectionRange(pos,pos); });
  const sq = $("#saintQ");
  sq?.addEventListener("input", e=>{ state.saintQ = e.target.value; const pos=e.target.selectionStart; renderPray(); const n=$("#saintQ"); n?.focus(); n?.setSelectionRange(pos,pos); });
  const sd = $("#saintDate");
  sd?.addEventListener("change", e=>{ state.saintDate = clampSaintDate(e.target.value); renderPray(); });
}
function prayCats(){
  const base = ["Todas","Favoritas","Esenciales","María","Santos","Credos","Liturgia","Coronillas","Diaria","Misericordia","Vocaciones","Sagrada Familia","USCCB"];
  return base;
}
function prayListHTML(){
  const q = state.prayerQ.toLowerCase();
  if(state.prayerOpen){
    const pr = ALL_PRAYERS().find(p=>p.id===state.prayerOpen);
    if(!pr){ state.prayerOpen=null; }
    else {
      const fav = state.prayerFavs.includes(pr.id);
      return `<button class="backLink" data-action="prayer-back">${t("back")}</button>
      <h2 class="serif" style="margin:0">${esc(pr.name)} ${fav?"★":""}</h2>
      <p class="small">${esc(pr.category)}${pr.latin?` · ${esc(pr.latin)}`:""} · ${t("latinTraditional")}</p>
      <section class="card"><p class="prayerText">${esc(prayerText(pr.id)||pr.text)}</p>
        ${pr.usccb&&pr.src?`<p class="small">Fuente/Source: USCCB</p><div class="btnRow"><button class="btn btnGhost" data-action="ext" data-url="${esc(pr.src)}">USCCB ↗</button></div>`:""}
        <div class="btnRow">
          <button class="btn ${fav?"btnGhost":"btnGold"}" data-action="prayer-fav" data-id="${pr.id}">${fav?t("savedFav"):t("saveFav")}</button>
          <button class="btn btnNavy" data-action="pray-aloud" data-id="${pr.id}">${t("voiceOff")}</button>
          ${state.speaking?`<button class="btn btnGhost" data-action="stop-voice">${t("stopVoice")}</button>`:""}
          <button class="btn btnGhost" data-action="prayer-back">${t("backAll")}</button>
        </div>
        <p class="small">${t("prayerLangNote")}</p></section>`;
    }
  }
  const list = ALL_PRAYERS().filter(p =>
    (state.prayerCat==="Todas" || (state.prayerCat==="Favoritas" ? state.prayerFavs.includes(p.id) : state.prayerCat==="USCCB" ? p.usccb : p.category===state.prayerCat)) &&
    (!q || (p.name+" "+(prayerText(p.id)||p.text)).toLowerCase().includes(q)));
  if(!state.usccbList) return `
    <p class="small">${ALL_PRAYERS().length} ${t("prayersCount")}</p>
    <div class="searchRow"><input id="prayerQ" placeholder="${esc(t("searchPrayers"))}" value="${esc(state.prayerQ)}"></div>
    <div class="notice">⏳ ${getLang()==="en"?"Loading the USCCB prayers…":"Cargando las oraciones de USCCB…"}</div>
    <section class="card" style="margin-top:10px">
      ${list.length? list.map(p=>`<div class="prayerItem"><div><div><b>${esc(p.name)}</b></div><div class="small">${esc(p.category)} · ${esc((prayerText(p.id)||p.text).slice(0,60))}…</div></div>
        <button class="starBtn" data-action="prayer-fav" data-id="${p.id}" aria-label="favorita">${state.prayerFavs.includes(p.id)?"★":"☆"}</button>
        <button class="btn btnGhost" data-action="prayer-open" data-id="${p.id}">${t("open")}</button></div>`).join("")
      : `<p>${t("noResults")}</p>`}
    </section>`;
  return `
    <p class="small">${ALL_PRAYERS().length} ${t("prayersCount")}</p>
    <div class="searchRow"><input id="prayerQ" placeholder="${esc(t("searchPrayers"))}" value="${esc(state.prayerQ)}"></div>
    <div class="chipRow">${prayCats().map(c=>`<button class="fchip ${state.prayerCat===c?"active":""}" data-action="prayer-cat" data-cat="${c}">${c==="Favoritas"?`★ (${state.prayerFavs.length})`:c==="Todas"?t("backAll"):c}</button>`).join("")}</div>
    <section class="card" style="margin-top:10px">
      ${list.length? list.map(p=>`<div class="prayerItem"><div><div><b>${esc(p.name)}</b></div><div class="small">${esc(p.category)} · ${esc((prayerText(p.id)||p.text).slice(0,60))}…</div></div>
        <button class="starBtn" data-action="prayer-fav" data-id="${p.id}" aria-label="favorita">${state.prayerFavs.includes(p.id)?"★":"☆"}</button>
        <button class="btn btnGhost" data-action="prayer-open" data-id="${p.id}">${t("open")}</button></div>`).join("")
      : `<p>${t("noResults")}</p>`}
    </section>
    ${canEdit()?parishPublishHTML():""}`;
}
function familiaHTML(){
  const isEn = getLang()==="en";
  const cong = PRAYERS.find(p=>p.id==="oracion-congregacion");
  const voc = PRAYERS.find(p=>p.id==="oracion-vocaciones");
  const today = toISO(new Date());
  const prayed = state.famPrayed.includes(today);
  return `
  <section class="card"><img class="artBanner" src="${ART.retablo}" alt="Retablo" loading="lazy">
    <h3 class="serif">${esc(t("famTitle"))}</h3><p>${esc(t("famAbout"))}</p></section>
  <section class="card"><h3>🙏 ${esc(t("prayForUsT"))}</h3><p class="sub">${esc(t("prayForUsSub"))}</p>
    ${cong?`<div class="verseBox">“${esc((prayerText(cong.id)||cong.text).slice(0,220))}…”</div>
    <div class="btnRow"><button class="btn btnGhost" data-action="prayer-open" data-id="${cong.id}">${t("open")}</button>
    <button class="btn btnNavy" data-action="pray-aloud" data-id="${cong.id}">${t("voiceBtn")}</button></div>`:""}
    <p class="small">📿 ${esc(t("prayedDays"))}: <b>${state.famPrayed.length}</b></p>
    <div class="btnRow"><button class="btn ${prayed?"btnGhost":"btnGold"}" data-action="fam-prayed" ${prayed?"disabled":""}>${prayed?esc(t("prayedThanks")):esc(t("prayedBtn"))}</button></div></section>
  <section class="card"><h3>🕊️ ${esc(t("vocT"))}</h3><p class="sub">${esc(t("vocSub"))}</p>
    ${voc?`<div class="verseBox">“${esc((prayerText(voc.id)||voc.text).slice(0,220))}…”</div>
    <div class="btnRow"><button class="btn btnGhost" data-action="prayer-open" data-id="${voc.id}">${t("open")}</button>
    <button class="btn btnNavy" data-action="pray-aloud" data-id="${voc.id}">${t("voiceBtn")}</button></div>`:""}
    <div class="btnRow"><button class="btn btnGold" data-action="more-focus" data-focus="sec-donativos">${t("supportT")} 💛</button></div></section>
  <section class="card"><h3>🌍 ${esc(t("universalT"))}</h3><p class="sub">${esc(t("universalSub"))}</p>
    <div class="btnRow"><button class="btn btnGhost" data-action="ext" data-url="https://www.vatican.va/content/francesco/es.html">${esc(t("vaticanL"))} ↗</button>
    <button class="btn btnGhost" data-action="ext" data-url="https://www.clicktopray.org">${esc(t("ctpL"))} ↗</button></div>
    <div class="btnRow"><button class="btn btnGhost" data-action="ext" data-url="https://archdiosf.org">${esc(t("archL"))} ↗</button>
    <button class="btn btnGhost" data-action="ext" data-url="https://www.usccb.org">${esc(t("usccbL"))} ↗</button></div>
    <div class="btnRow"><button class="btn btnGhost" data-action="ext" data-url="https://www.youtube.com/@Vatican">${esc(t("vaticanYTL"))} ↗</button></div></section>
  <section class="card"><h3>${t("rinconT")}</h3><p class="sub">${t("rinconSub")}</p>
    <p style="font-size:14.5px;line-height:1.6">${esc((isEn?REFLEX_FAMILIA.en:REFLEX_FAMILIA.es).split("\n").slice(0,3).join(" "))}…</p>
    <div class="btnRow"><button class="btn btnNavy bigBtn" data-action="pray-aloud" data-id="avemaria">${t("aveBtn")}</button>
      <button class="btn btnNavy bigBtn" data-action="pray-aloud" data-id="padrenuestro">${t("patBtn")}</button></div>
    <div class="btnRow"><button class="btn btnGold" data-action="more-focus" data-focus="sec-pastoral">${t("rinconBtn")} →</button></div></section>`;
}
function parishPublishHTML(){
  const cats = prayCats().filter(c=>!["Todas","Favoritas"].includes(c));
  return `<section class="card"><h3>📢 ${esc(t("publishPrayer"))}</h3>
    <label>${t("npTitle")}</label><input id="ppTitle" placeholder="${esc(t("npTitlePh"))}">
    <label>${t("npText")}</label><textarea id="ppText" placeholder="${esc(t("npTextPh"))}"></textarea>
    <label>${t("sectionL")}</label><select id="ppCat">${cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>
    <div class="btnRow"><button class="btn btnNavy" data-action="pp-add">${t("publish")}</button></div>
    <h4 style="margin:10px 0 2px">${esc(t("bulkT"))}</h4>
    <textarea id="ppBulk" placeholder="${esc(t("bulkPh"))}"></textarea>
    <div class="btnRow"><button class="btn btnGhost" data-action="pp-bulk">${t("publish")}</button></div>
    ${parishPub().length?parishPub().map(p=>`<div class="prayerItem"><div style="flex:1"><b>${esc(p.name)}</b><div class="small">${esc((p.text||"").slice(0,70))}…</div></div>
      ${delOk(true)?`<button class="btn btnGhost" data-action="pp-del" data-id="${p.id}">${t("delete")}</button>`:""}</div>`).join(""):""}
  </section>`;
}
function myPrayersHTML(){
  return `
    <p class="small">${t("prayerLangNote")}</p>
    <section class="card"><h3>${t("newPrayer")}</h3>
      <label>${t("npTitle")}</label><input id="npTitle" placeholder="${esc(t("npTitlePh"))}">
      <label>${t("npText")}</label><textarea id="npText" placeholder="${esc(t("npTextPh"))}"></textarea>
      <div class="btnRow"><button class="btn btnGold" data-action="custom-prayer-add">${t("saveMyPrayer")}</button></div>
    </section>
    <section class="card"><h3>${t("myPrayers")} (${state.customPrayers.length})</h3>
      ${state.customPrayers.length? state.customPrayers.map(p=>`<div class="prayerItem"><div style="flex:1"><b>${esc(p.name)}</b><div class="small">${esc(p.text.slice(0,70))}…</div></div>
        <button class="btn btnGhost" data-action="prayer-open" data-id="${p.id}">${t("open")}</button>
        <button class="btn btnGhost" data-action="custom-prayer-del" data-id="${p.id}">${t("delete")}</button></div>`).join("")
      : `<p class="small">${t("noneYet")}</p>`}
    </section>`;
}
const MANYANET_IMG = {
  crest: "https://user.uploads.dev/file/153eccefd096f7c77d9af9b44d2e3106.png",
  holyFam: "https://user.uploads.dev/file/1bd8fde7c2dda083420acf95a7b00f15.png",
  founder: "https://user.uploads.dev/file/be4cfe0b9f4150254e7daa18ae664f29.png",
  community: "https://user.uploads.dev/file/1683593db883eac2a3cf9b6691af73bb.jpg"
};
function confessionHTML(){
  const isEn = getLang()==="en";
  const p = parish();
  const actUS = (state.usccbList||[]).find(x=>/act of contrition/i.test(x.name||""));
  const steps = isEn ? [
    ["1 · Examination", "Pray with one of the examinations below. Be honest, be calm: name your sins."],
    ["2 · Contrition", "Pray the Act of Contrition with all your heart (below)."],
    ["3 · Confession", "Make the Sign of the Cross. Say how long since your last confession, then confess your sins simply. Listen to the priest's counsel, receive your penance and absolution."],
    ["4 · Penance & thanks", "Do your penance soon and thank God for his mercy."]
  ] : [
    ["1 · Examen", "Reza con calma uno de los exámenes de abajo. Con verdad: ponle nombre a tus pecados."],
    ["2 · Contrición", "Reza de corazón el Acto de contrición (abajo)."],
    ["3 · Confesión", "Persígnate. Di cuánto hace de tu última confesión y confiesa tus pecados con sencillez. Escucha el consejo del sacerdote, recibe la penitencia y la absolución."],
    ["4 · Penitencia y gracias", "Cumple pronto tu penitencia y da gracias a Dios por su misericordia."]
  ];
  return `
  <section class="card"><h3>🕊️ ${isEn?"Confession: schedule & guide":"Confesión: horario y guía"}</h3>
    <div class="kv"><span>⛪ ${isEn?"Confessions":"Confesiones"}</span><b>${esc(p.confession)}</b></div>
    ${steps.map(([h,d])=>`<div class="ordSec"><b>${esc(h)}</b><div class="ordLine">${esc(d)}</div></div>`).join("")}
    <p class="small">${isEn?"Examinations from the USCCB (link below each title).":"Exámenes de la USCCB (enlace bajo cada título)."}</p></section>
  <section class="card"><h3>💜 ${isEn?"Act of Contrition (part of your confession)":"Acto de contrición (parte de tu confesión)"}</h3>
    <p class="prayerText">${esc(prayerText("acto-contricion"))}</p>
    ${actUS?`<p class="prayerText" style="margin-top:8px">${esc(actUS.text)}</p>
    <div class="btnRow"><button class="btn btnGhost" data-action="prayer-open" data-id="${actUS.id}">${t("open")} · EN</button>
    <button class="btn btnNavy" data-action="pray-aloud" data-id="${actUS.id}">${t("voiceBtn")}</button></div>`:""}
  </section>
  <section class="card"><h3>🔍 ${isEn?"Examinations of conscience (USCCB)":"Exámenes de conciencia (USCCB)"}</h3>
    ${CONFESION_EXAMS.map(e=>`<details class="ordDet"><summary>${esc(isEn?e.ten:e.tes)} <span class="tag">${esc(e.lang==="es"?"ES":"EN")}</span></summary>
      <div class="ordSec"><p class="prayerText" style="font-size:15px">${esc(e.text)}</p>
      <p class="small">USCCB · https://www.usccb.org/prayer-and-worship/sacraments-and-sacramentals/penance/examinations-of-conscience</p></div></details>`).join("")}
  </section>`;
}
function vocacionesHTML(){
  const isEn = getLang()==="en";
  const vocPrayer = (state.usccbList||[]).find(x=>/short prayer for vocations/i.test(x.name||""));
  const cong = PRAYERS.find(x=>x.id==="oracion-vocaciones");
  return `
  <section class="card"><img class="artBanner" src="${MANYANET_IMG.crest}" alt="Hijos de la Sagrada Familia" loading="lazy" style="object-fit:contain;background:#fff">
    <h3>🌱 ${isEn?"Pray for vocations to the Sons of the Holy Family":"Oremos por las vocaciones a los Hijos de la Sagrada Familia"}</h3>
    <p>${isEn?"Nazareth is family life lived in community and in families — a life of fraternity. The Sons of the Holy Family were founded by Saint Joseph Manyanet to make every family a reflection of Nazareth.":"Nazaret es la vida de familia vivida en comunidad y en las familias: una vida de fraternidad. Los Hijos de la Sagrada Familia fueron fundados por san José Manyanet para hacer de cada familia un reflejo de Nazaret."}</p>
    <div class="btnRow"><button class="btn btnGold" data-action="ext" data-url="https://www.manyanet-us.org/">manyanet-us.org ↗</button></div></section>
  <section class="card"><img class="artBanner" src="${MANYANET_IMG.holyFam}" alt="Sagrada Familia" loading="lazy">
    <h3>🙏 ${isEn?"Vocation prayer":"Oración por las vocaciones"}</h3>
    ${vocPrayer?`<p class="prayerText">${esc(vocPrayer.text)}</p>
    <div class="btnRow"><button class="btn btnNavy" data-action="pray-aloud" data-id="${vocPrayer.id}">${t("voiceBtn")}</button></div>`:""}
    ${cong?`<div class="verseBox">“${esc(String(prayerText(cong.id)||cong.text).slice(0,220))}…”</div>
    <div class="btnRow"><button class="btn btnGhost" data-action="prayer-open" data-id="${cong.id}">${t("open")}</button>
    <button class="btn btnNavy" data-action="pray-aloud" data-id="${cong.id}">${t("voiceBtn")}</button></div>`:""}
    <div class="notice">“${isEn?"A true apostle of the family and a prophet of the family for our times.":"Un verdadero apóstol de la familia y un profeta de la familia para nuestros tiempos."}” — ${isEn?"Pope St. John Paul II on Saint Joseph Manyanet":"San Juan Pablo II sobre san José Manyanet"}</div></section>
  <section class="card"><img class="artBanner" src="${MANYANET_IMG.founder}" alt="San José Manyanet" loading="lazy"><h3>✨ ${isEn?"Founder & call":"Fundador y llamada"}</h3>
    <p style="font-size:14.5px;line-height:1.6">${isEn?"Founder: Saint Joseph Manyanet. The Sons welcome Catholic men (18–35) with a sincere desire to serve God and the family. “Come and See” visits welcome — come experience community life and prayer.":"Fundador: san José Manyanet. Los Hijos acogen a jóvenes católicos (18–35 años) con deseo sincero de servir a Dios y a la familia. Visitas «Ven y verás»: ven a conocer la vida de comunidad y oración."}</p>
    <img class="artBanner" src="${MANYANET_IMG.community}" alt="Hijos de la Sagrada Familia" loading="lazy">
    <div class="btnRow"><button class="btn btnGold" data-action="ext" data-url="https://www.manyanet-us.org/">🌱 ${isEn?"Discern your vocation":"Discierne tu vocación"} ↗</button></div></section>
  <section class="card"><h3>💛 ${isEn?"Support the Sons of the Holy Family":"Apoya a los Hijos de la Sagrada Familia"}</h3>
    <p class="sub">${isEn?"Your gifts directly support the formation of our seminarians, the formation houses and the mission works. Together we help new vocations grow and serve the Church.":"Tus aportaciones sostienen directamente la formación de nuestros seminaristas, las casas de formación y las obras misioneras. Juntos ayudamos a que nuevas vocaciones crezcan y sirvan a la Iglesia."}</p>
    <div class="btnRow"><button class="btn btnGold" data-action="ext" data-url="${SF_DONATE_URL}">💛 ${isEn?"Donate at manyanet-us.org":"Donar en manyanet-us.org"} ↗</button></div></section>`;
}
function playerHTML(kind, steps, idx, auto){
  const s = steps[idx];
  const pct = Math.round(((idx+1)/steps.length)*100);
  return `
    <div class="beads">${steps.map((_,i)=>`<span class="bead ${i<idx?"done":i===idx?"now":""}"></span>`).join("")}</div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <p class="small">${t("stepOf")} ${idx+1} ${t("ofTotal")} ${steps.length}</p>
    <div class="stepBox"><div class="k">${esc(s.k).toUpperCase()}</div><div class="t serif">${esc(s.t)}</div></div>
    <div class="btnRow">
      <button class="btn btnGhost bigBtn" data-action="${kind}-go" data-i="${idx-1}" ${idx===0?"disabled":""}>←</button>
      <button class="btn btnNavy bigBtn" data-action="${kind}-go" data-i="${idx+1}" ${idx===steps.length-1?"disabled":""}>${t("next")}</button>
    </div>
    <div class="btnRow">
      <button class="btn ${auto?"btnGold":"btnGhost"}" data-action="${kind}-auto">${auto?t("voiceOn"):t("voiceOff")}</button>
      ${state.speaking?`<button class="btn btnGhost" data-action="stop-voice">${t("stopVoice")}</button>`:""}
      <button class="btn btnGhost" data-action="${kind}-reset">${t("restart")}</button>
    </div>
    <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" style="width:auto" data-action-check="${kind}-autoadv" ${auto?"checked":""}> ${t("autoAdvance")}</label>`;
}
function rosaryHTML(){
  const steps = rosarySteps(state.rosarySet);
  const set = ROSARY_MYSTERIES[state.rosarySet];
  if(state.rosaryStep>steps.length-1) state.rosaryStep=0;
  const todaySet = mysteriesForWeekday(new Date().getDay());
  return `
    <p class="small">${t("todayMysteries")} <b>${mystName(todaySet)}</b>. ${t("canChange")}</p>
    <div class="subnav">${Object.keys(ROSARY_MYSTERIES).map(k=>`<button class="${state.rosarySet===k?"active":""}" data-action="rosary-set" data-set="${k}">${mystName(k)}</button>`).join("")}</div>
    <section class="card"><div class="artRow"><img class="artThumb" src="${ART.retablo}" alt="Retablo" loading="lazy"><div><h3 class="serif" style="margin:0">📿 Rosario · ${t("m_rosario").replace("📿 ","")} ${mystName(state.rosarySet)}</h3>
      <p class="small" style="margin:4px 0 0">${set.items.map((m,i)=>`${i+1}. ${m}`).join(" · ")}</p></div></div>
      ${playerHTML("rosary", steps, state.rosaryStep, state.rosaryAuto)}
    </section>
    <p class="small">${t("rosaryIdeal")}</p>`;
}
function chapletHTML(){
  const steps = chapletSteps();
  if(state.chapletStep>steps.length-1) state.chapletStep=0;
  return `
    <p class="small">${t("chapletIdeal")}</p>
    <section class="card"><h3 class="serif">${t("m_coronilla")}</h3>
      ${playerHTML("chaplet", steps, state.chapletStep, state.chapletAuto)}
    </section>`;
}
const RANK_LABEL = { solemnity:"rankSolemnity", feast:"rankFeast", memorial:"rankMemorial", optional:"rankOptional", sunday:"rankSunday" };
function saintRankLabel(r){ return t(RANK_LABEL[r] || "rankFerial"); }
const LIT_DOT = { white:"#e8e4d8", green:"#3d7a52", red:"#a33", violet:"#7a4fa3", purple:"#7a4fa3", rose:"#d8a", blue:"#2f6db9", black:"#333", gold:"#c9a227" };
const LIT_COLOR_W = {
  white:{es:"blanco",en:"white"}, green:{es:"verde",en:"green"}, red:{es:"rojo",en:"red"},
  violet:{es:"morado",en:"violet"}, purple:{es:"morado",en:"purple"}, rose:{es:"rosa",en:"rose"},
  blue:{es:"azul",en:"blue"}, black:{es:"negro",en:"black"}, gold:{es:"dorado",en:"gold"},
};
function litColorName(c){
  const m = LIT_COLOR_W[String(c||"").toLowerCase()];
  if(!m) return c || "—";
  const L = getLang();
  return (L==="es"||L==="en") ? m[L] : m.en;
}
function clampSaintDate(iso){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||"")) return toISO(new Date());
  if(iso < "2023-01-01") return "2023-01-01";
  if(iso > "2032-12-31") return "2032-12-31";
  return iso;
}
function saintDayHTML(){
  state.saintDate = clampSaintDate(state.saintDate);
  const iso = state.saintDate;
  const d = new Date(iso+"T12:00:00");
  const isToday = iso === toISO(new Date());
  const dd = (isToday && state.dayData) ? state.dayData : null;
  const daily = dailyFor(iso);
  const feast = (dd && dd.feast) ? dd.feast : (daily ? daily.feast : "");
  const color = (dd && dd.color) ? dd.color : (daily ? daily.color : "");
  const rank = feast ? rankOf(feast) : "";
  const saint = saintsForDay(feast, iso.slice(5), getLang()==="en"?"en":"es")[0] || null;
  let cites = [];
  if(dd && dd.citations && (dd.citations.first || dd.citations.gospel)){
    const c = dd.citations;
    if(c.first) cites.push([t("first"), c.first]);
    if(c.psalm) cites.push([t("psalm"), c.psalm]);
    if(c.second) cites.push([t("second"), c.second]);
    if(c.gospel) cites.push([t("gospel"), c.gospel]);
  } else if(daily){
    const lab = { first:t("first"), psalm:t("psalm"), second:t("second"), gospel:t("gospel") };
    for(const r of daily.readings){ if(lab[r.type]) cites.push([lab[r.type], r.citation]); }
  }
  const dateStr = d.toLocaleDateString(localeOf(), { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  const prevD = new Date(d); prevD.setDate(prevD.getDate()-1);
  const nextD = new Date(d); nextD.setDate(nextD.getDate()+1);
  const prevISO = toISO(prevD), nextISO = toISO(nextD);
  const sImg = saint && saint.image ? `<img src="${esc(saint.image)}" alt="" loading="lazy" style="flex:none;width:52px;height:52px;border-radius:50%;object-fit:cover">`
    : `<div class="avatar">${esc((saint?saint.name:feast).replace(/^(San|Santa|Santo|Beato|Beata|The|A)\s*/i,"").slice(0,1))}</div>`;
  return `
    <section class="card">
      <div class="small">${esc(t("saintDay"))} · ${esc(t("santoralRange"))}</div>
      <div class="btnRow" style="margin:8px 0">
        <button class="btn btnGhost" data-action="saint-move" data-iso="${prevISO}" ${prevISO<"2023-01-01"?"disabled":""}>${esc(t("prev"))}</button>
        <button class="btn btnGhost" data-action="saint-today">${esc(t("today"))}</button>
        <button class="btn btnGhost" data-action="saint-move" data-iso="${nextISO}" ${nextISO>"2032-12-31"?"disabled":""}>${esc(t("next"))}</button>
      </div>
      <input type="date" id="saintDate" value="${iso}" min="2023-01-01" max="2032-12-31" aria-label="${esc(t("saintDay"))}" style="width:100%">
      ${feast ? `
      <div class="small" style="text-transform:capitalize">${esc(dateStr)}</div>
      <h3 class="serif" style="margin:4px 0">${esc(feast)}</h3>
      <div class="chipRow"><span class="tag ${rank==="solemnity"||rank==="sunday"?"gold":""}">${esc(saintRankLabel(rank))}</span>
        ${color?`<span class="tag"><span class="catDot" style="background:${LIT_DOT[String(color).toLowerCase()]||"#888"}"></span>${esc(litColorName(color))}</span>`:""}
        ${daily&&daily.lectionary?`<span class="tag">#${daily.lectionary}</span>`:""}</div>
      ${saint ? `
      <div class="eventRow"><div style="flex:1;display:flex;gap:10px;align-items:flex-start">${sImg}
        <div style="flex:1"><b>${esc(saint.name)}</b>${saint.era?` <span class="small">· ${esc(saint.era)}</span>`:""}
        ${saint.patron&&saint.patron.length?`<div class="small">${esc(t("patronage"))}: ${esc(saint.patron.join(", "))}</div>`:""}
        <div>${esc(saint.bio)}</div>
        ${saint.wiki?`<div class="btnRow" style="margin-top:6px"><button class="btn btnGhost" data-action="ext" data-url="${esc(saint.wiki)}">Wikipedia ↗</button></div>`:""}</div></div></div>`
      : `<p class="small" style="margin:8px 0">${esc(t("ferialNote"))}</p>`}
      ${cites.length?`<div class="citeGrid"><div class="small" style="margin-bottom:4px"><b>${esc(t("properReadings"))}</b></div>
        ${cites.map(([l,c2])=>`<div><b>${esc(l)}:</b> ${esc(c2)}</div>`).join("")}</div>`:""}
      ${(dd&&dd.quote)?`<div class="verseBox">“${esc(dd.quote)}”<br><span class="small">— ${esc(feast)}</span></div>`:""}`
      : `<p class="small">${esc(t("santoralRange"))}</p>`}
    </section>`;
}
function saintsHTML(){
  const q = state.saintQ.toLowerCase();
  const list = SAINTS.filter(s=>!q || (s.name+" "+s.patron+" "+s.bio).toLowerCase().includes(q));
  return saintDayHTML() + `
    <p class="small" style="margin-top:12px">${SAINTS.length} ${t("saintsCount")} · ${t("saintsSub")}</p>
    <div class="searchRow"><input id="saintQ" placeholder="${esc(t("searchSaints"))}" value="${esc(state.saintQ)}"></div>
    <section class="card">
      ${list.map(s=>`<div class="eventRow"><div class="avatar">${esc(s.name.replace(/^(San|Santa|Santo|Beato|Beata|Nuestra Señora)\s*/,"").slice(0,1))}</div>
        <div style="flex:1"><b>${esc(s.name)}</b> <span class="tag gold">${esc(s.feast)}</span>
        <div class="small">${t("patronage")}: ${esc(s.patron)}</div><div class="small">${esc(s.bio)}</div></div></div>`).join("") || `<p>${t("noSaint")}</p>`}
    </section>`;
}

// ---------- CALENDARIO ----------
const MON_ES=["","enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MON_EN=["","January","February","March","April","May","June","July","August","September","October","November","December"];
function bulletinLabel(b){ const isEn=getLang()==="en"; if(!b||!b.y) return "";
  return isEn?`Week of ${MON_EN[b.mo]} ${b.d1}–${b.d2}, ${b.y}`:`Semana del ${b.d1} al ${b.d2} de ${MON_ES[b.mo]} de ${b.y}`; }
async function loadBulletinLive(){
  try{
    const c = state.bulletinLive;
    const okCache = c && /\/hccc_santa-cruz-catholic-church_bulletin_\d{4}_/i.test(c.pdf||"") && Date.now()-c.ts < 24*3600*1000;
    if(okCache) return;
    if(typeof root==="undefined"||!root.superFetch) return;
    const html = await root.superFetch(PARISH_BULLETIN_PAGE).then(r=>r.text());
    const pdfs = [...html.matchAll(/https:\/\/irp\.cdn-website\.com\/ba39fac3\/files\/uploaded\/hccc_santa-cruz-catholic-church_bulletin_[^"'\s<>]+\.pdf/gi)].map(m=>m[0]);
    const first = pdfs[0];
    if(!first) return;
    const views = [...html.matchAll(/https?:\/\/(?:www\.)?bulletins\.jcpress\.com\/books\/[^"'\s<>#]+/gi)].map(m=>m[0]);
    const dm = first.match(/bulletin_(\d{4})_(\d{2})_(\d{2})[_-](\d{2})/);
    let nb;
    if(dm){ nb = { ts: Date.now(), y:+dm[1], mo:+dm[2], d1:+dm[3], d2:+dm[4], pdf:first, view:views[0]||"" }; }
    else { const t=new Date(), s=new Date(t); s.setDate(t.getDate()-t.getDay());
      const e=new Date(s); e.setDate(s.getDate()+6);
      nb = { ts: Date.now(), y:s.getFullYear(), mo:s.getMonth()+1, d1:s.getDate(), d2:e.getDate(), pdf:first, view:views[0]||"" }; }
    state.bulletinLive = nb; store.set("bulletin.live", nb); renderHome();
  }catch(e){}
}
function renderCalendar(){
  const cur = state.calCursor;
  const isEn = getLang()==="en";
  const ED = canEdit();
  const monthName = cur.toLocaleString(localeOf(),{month:"long", year:"numeric"});
  const allF = getLang()==="en" ? "All" : "Todas";
  const views = [["mes",t("v_month")],["semana",t("v_week")],["dia",t("v_day")]];
  let cal = `<h2 class="serif" style="margin:4px 0">${t("calTitle")}</h2>
    <p class="small">${esc(parish().name)} · ${t("calSub")}</p>
    <div class="subnav">${views.map(([v,l])=>`<button class="${state.calView===v?"active":""}" data-action="cal-view" data-v="${v}">${l}</button>`).join("")}</div>
    <div class="chipRow"><button class="fchip ${state.calFilter==="Todas"?"active":""}" data-action="cal-filter" data-cat="Todas">${t("allCats")}</button>
      ${CATEGORIES.map(c=>`<button class="fchip ${state.calFilter===c?"active":""}" data-action="cal-filter" data-cat="${c}"><span class="catDot" style="background:${catColor(c)}"></span>${catName(c)}</button>`).join("")}</div>`;
  cal += `<section class="card"><h3>${t("specialT")}</h3><p class="sub">${t("specialSub")}</p>
    ${allEvents().filter(e=>e.special).map(ev=>`<div class="eventRow"><div class="dateBox"><div class="dw">⭐</div><div class="dn">✦</div></div>
      <div style="flex:1"><div><span class="catDot" style="background:${catColor(ev.category)}"></span><b>${esc(ev.title)}</b></div>
      <div class="small">${esc(nextDateStr(ev))} · ${esc(ev.time)} · ${esc(ev.location||"")}</div>
      <div class="small">${esc(ev.desc||"")}</div></div>
      <button class="btn ${state.reminders.includes(ev.id)?"btnNavy":"btnGhost"}" data-action="rem-toggle" data-id="${ev.id}">${state.reminders.includes(ev.id)?t("reminderOn"):t("remindMe")}</button></div>`).join("")}
  </section>`;
  if(state.calView==="mes") cal += monthHTML(cur, monthName);
  else if(state.calView==="semana") cal += weekHTML();
  else cal += dayHTML();
  cal += `<section class="card"><h3>📋 ${state.calFilter==="Todas"?t("allEventsT"):t("eventsCat")+": "+catName(state.calFilter)}</h3>${eventListHTML(visibleEvents(state.calFilter))}</section>`;
  cal += `<section class="card"><h3>${t("sacrT")}</h3><p class="sub">${t("sacrSub")}</p>
    ${(isEn?SACRAMENT_INFO.en:SACRAMENT_INFO.es).map(s=>`<div class="eventRow"><div style="flex:1"><b>${esc(s.h)}</b><div class="small">${esc(s.p)}</div></div></div>`).join("")}
    <div class="btnRow"><button class="btn btnGhost" data-action="ext" data-url="https://www.hcccsantacruz.org/sacraments">hcccsantacruz.org ↗</button></div></section>`;
  cal += celebrationHTML();
  $("#view-calendar").innerHTML = cal;
}
function celebrationHTML(){
  const ED = canEdit();
  const list = datedAll().filter(e=>!e.date || e.date>=toISO(new Date())).sort((a,b)=>(a.date||"")<(b.date||"")?-1:1);
  return `<section class="card" id="sec-celebraciones"><h3>⭐ ${t("celebT")}</h3><p class="sub">${t("celebSub")}</p>
    ${list.length?eventListHTML(list, ED):`<p class="small">${t("celebEmpty")}</p>`}
    ${ED?`<h4 style="margin:10px 0 2px">${t("celebT")}</h4>
    <label>${t("celebNameL")}</label><input id="cbTitle" placeholder="…">
    <div class="grid2"><div><label>${t("sectionL")}</label><select id="cbCat"><option>Sacramentos</option><option>Misa</option><option>Comunidad</option><option>Servicio</option></select></div>
    <div><label>${t("celebDateL")}</label><input id="cbDate" type="date"></div></div>
    <div class="grid2"><div><label>${t("timeL")}</label><input id="cbTime" placeholder="6:00 PM"></div>
    <div><label>${t("placeL")}</label><input id="cbPlace" placeholder="Templo histórico"></div></div>
    <label>${t("celebrantL")}</label><input id="cbCel" placeholder="Rev Father Hernando Cortes, SF">
    <label>${t("messageL")}</label><textarea id="cbDesc" placeholder="…"></textarea>
    <div class="btnRow"><button class="btn btnGold" data-action="celeb-add">${t("publish")}</button></div>`:`<p class="small">${t("readOnlyNote")}</p>`}
  </section>`;
}
function eventListHTML(list, showDel){
  if(!list.length) return `<p class="small">${t("noEvents")}</p>`;
  return list.map(ev=>{
    const sup = state.support[ev.id];
    return `<div class="eventRow"><div class="dateBox"><div class="dw">${esc(dayName(ev.day).slice(0,3).toUpperCase())}</div><div class="dn">✦</div></div>
    <div style="flex:1"><div><span class="catDot" style="background:${catColor(ev.category)}"></span><b>${esc(ev.title)}</b>${ev.group?` <span class="tag">${esc(ev.group)}</span>`:""}${ev.special?` <span class="tag gold">⭐</span>`:""}</div>
    <div class="small">${esc(ev.time)} · ${esc(ev.location||"")}${ev.cel?` · ${esc(t("celebrantL"))}: ${esc(ev.cel)}`:""} · ${esc(recName(ev.recurring))}</div>
    <div class="small">${esc(ev.desc||"")}</div>
    ${ev.category==="Misa"?massMinistersHTML(ev):""}
    ${ev.category==="Misa"?massIntentionsHTML(ev):""}
    ${sup?`<div class="small">💛 ${sup.vol} ${t("vols")} · $${sup.monto} ${t("inSupport")}</div>`:""}
    <div class="btnRow">
      ${ev.category==="Misa"?`<button class="btn btnGhost" data-action="mass-readings" data-day="${ev.day}">${t("readingsThatDay")}</button>`:""}
      ${ev.mass?`<button class="btn btnGhost" data-action="ministry-goto" data-m="${esc(ev.mass)}">${t("viewMinistries")}</button>`:""}
      <button class="btn btnGhost" data-action="ics" data-id="${ev.id}">${t("toCalendar")}</button>
      <button class="btn ${state.reminders.includes(ev.id)?"btnNavy":"btnGhost"}" data-action="rem-toggle" data-id="${ev.id}">${state.reminders.includes(ev.id)?t("reminderOn"):t("remindMe")}</button>
      <button class="btn btnGhost" data-action="support-open" data-id="${ev.id}">${t("support")}</button>
      ${showDel?`<button class="btn btnGhost" data-action="celeb-del" data-id="${ev.id}">${t("delete")}</button>`:""}
    </div>
    <div class="supportForm" ${state._supportOpen===ev.id?"":"hidden"} id="sup-${ev.id}">
      <div class="btnRow">
        ${[5,10,25].map(a=>`<button class="btn btnGhost" data-action="support-give" data-id="${ev.id}" data-amt="${a}">$${a}</button>`).join("")}
        <button class="btn btnNavy" data-action="support-vol" data-id="${ev.id}">${t("beVolunteer")}</button>
      </div>
    </div></div></div>`;
  }).join("");
}
function monthHTML(cur, monthName){
  const y=cur.getFullYear(), m=cur.getMonth();
  const firstDow=(new Date(y,m,1).getDay()+6)%7;
  const days=new Date(y,m+1,0).getDate();
  const byISO={};
  visibleEvents(state.calFilter).forEach(ev=>{ eventDates(ev,cur).forEach(d=>{ const k=toISO(d); (byISO[k]=byISO[k]||[]).push(ev); }); });
  const dows = getLang()==="zh" ? ["一","二","三","四","五","六","日"] : ["L","M","X","J","V","S","D"];
  let cells=dows.map(d=>`<div class="dow">${d}</div>`).join("");
  for(let i=0;i<firstDow;i++) cells+=`<div></div>`;
  for(let d=1;d<=days;d++){
    const iso=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const evs=byISO[iso]||[];
    cells+=`<div class="calDay ${evs.length?"has":""} ${iso===state.calSel?"sel":""}" data-action="cal-day" data-iso="${iso}">
      <div class="n">${d}</div>${evs.slice(0,2).map(e=>`<div class="ev">• ${esc(e.title.split("·")[0].slice(0,14))}</div>`).join("")}${evs.length>2?`<div class="ev">+${evs.length-2}</div>`:""}</div>`;
  }
  const selEvs=(byISO[state.calSel]||[]);
  return `<section class="card"><div style="display:flex;align-items:center;gap:8px">
      <button class="btn btnGhost" data-action="cal-move" data-dir="-1">←</button>
      <h3 style="margin:0 auto;text-transform:capitalize">${esc(monthName)}</h3>
      <button class="btn btnGhost" data-action="cal-move" data-dir="1">→</button>
      <button class="btn btnGhost" data-action="cal-today">${t("today")}</button></div>
      <div class="calGrid">${cells}</div></section>
    <section class="card"><h3>${t("selDay")} (${state.calSel})</h3>
      ${selEvs.length? eventListHTML(selEvs): `<p class="small">${t("noDayEvents")}</p>`}
    </section>`;
}
function weekHTML(){
  const sel=new Date(state.calSel+"T12:00:00"); if(isNaN(sel)) return "";
  const dow=(sel.getDay()+6)%7; const mon=new Date(sel); mon.setDate(mon.getDate()-dow);
  const days=[...Array(7)].map((_,i)=>{ const d=new Date(mon); d.setDate(d.getDate()+i); return d; });
  return `<section class="card"><div style="display:flex;align-items:center;gap:8px">
      <button class="btn btnGhost" data-action="cal-weekmove" data-dir="-1">←</button>
      <h3 style="margin:0 auto">${t("weekOf")} ${days[0].getDate()} ${t("toW")} ${days[6].getDate()} ${t("ofMonth")} ${esc(days[0].toLocaleString(localeOf(),{month:"long"}))}</h3>
      <button class="btn btnGhost" data-action="cal-weekmove" data-dir="1">→</button></div>
      ${days.map(d=>{
        const iso=toISO(d);
        const evs=visibleEvents(state.calFilter).filter(ev=>ev.date?ev.date===iso:(DAYKEY_IDX[ev.day]===d.getDay() && (ev.recurring==="Semanal" || d>=new Date(new Date().setHours(0,0,0,0)))));
        return `<div class="eventRow"><div class="dateBox"><div class="dw">${esc(d.toLocaleString(localeOf(),{weekday:"short"}).toUpperCase())}</div><div class="dn">${d.getDate()}</div></div>
          <div style="flex:1">${evs.length? evs.map(ev=>`<div><span class="catDot" style="background:${catColor(ev.category)}"></span><b>${esc(ev.title)}</b> <span class="small">${esc(ev.time)}</span></div>`).join("") : `<span class="small">${t("noEvents")}</span>`}</div>
          <button class="btn btnGhost" data-action="cal-dayjump" data-iso="${iso}">${t("seeBtn")}</button></div>`;
      }).join("")}
    </section>`;
}
function dayHTML(){
  const d=new Date(state.calSel+"T12:00:00");
  const iso=toISO(d);
  const evs=visibleEvents(state.calFilter).filter(ev=>ev.date?ev.date===iso:DAYKEY_IDX[ev.day]===d.getDay());
  const title = isNaN(d) ? state.calSel : d.toLocaleString(localeOf(),{weekday:"long", day:"numeric", month:"long"});
  return `<section class="card"><div style="display:flex;align-items:center;gap:8px">
      <button class="btn btnGhost" data-action="cal-daymove" data-dir="-1">←</button>
      <h3 style="margin:0 auto;text-transform:capitalize">${esc(title)}</h3>
      <button class="btn btnGhost" data-action="cal-daymove" data-dir="1">→</button></div>
      ${evs.length? eventListHTML(evs): `<p class="small">${t("nothingDay")}</p>`}
    </section>`;
}

function dirFormOpen(){ return state.dirForm || state.editingId; }
function dirAll(){ return mix(Sync.coll("directory"), state.directoryExtra, DIRECTORY_SEED).filter(m=>!state.directoryHidden.includes(m.id)); }
function gname(id){ const g = GROUPS.find(x=>x.id===id); return g ? g.name : id; }
function gdesc(g){ return (getLang()==="en" && g.descEn) ? g.descEn : (g.desc||""); }
function gcatLabel(c){ const k = t("gcat_"+c); return k === ("gcat_"+c) ? c : k; }
function clergyRoleName(r){ return t("role_"+r); }
function dirListHTML(){
  const q = state.dirQ.toLowerCase();
  const list = dirAll().filter(m=>
    (state.dirGroup==="Todas" || (m.groups||[]).includes(state.dirGroup)) &&
    (!q || (m.family+" "+(m.contact||"")+" "+(m.last||"")+" "+((m.members||[]).map(x=>x.name).join(" "))+((m.birthdays||[]).map(b=>b.name).join(" "))).toLowerCase().includes(q)));
  if(!list.length) return `<p class="small">${t("noResults")}</p>`;
  return list.map(m=>`<div class="eventRow"><div class="avatar">${esc((m.family||"?").replace(/^(Familia|D\.|Dña\.)\s*/,"").slice(0,1))}</div>
    <div style="flex:1"><b>${esc(m.family)}</b>${m.mine?` <span class="tag">✍️</span>`:""}
      ${m.clergy?` <span class="tag gold">${esc(clergyRoleName(m.clergy))}</span>`:""}
      ${m.homebound?` <span class="tag red">${esc(t("homeboundTag"))}</span>`:""}
      <div class="small">${esc(m.contact||"")}${m.phone?` · <a href="${telHref(m.phone)}">${esc(m.phone)}</a>`:""}${m.email?` · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a>`:""}</div>
      ${m.address?`<div class="small">📍 ${esc(m.address)}</div>`:""}
      ${(m.members&&m.members.length)?`<div class="small">👥 ${esc(t("dirMembers"))}: ${m.members.map(x=>esc(x.name)+(x.group?` (${esc(gname(x.group))})`:"")).join(" · ")}</div>`:""}
      ${(m.groups&&m.groups.length)?`<div class="chipRow">${m.groups.map(g=>`<span class="tag green">${esc(gname(g))}</span>`).join("")}</div>`:""}
      ${(m.birthdays||[]).map(b=>`<div class="small">🎂 ${esc(b.name)} — ${esc(b.md)}</div>`).join("")}
      ${m.anniversary?`<div class="small">💒 ${esc(m.anniversary.couple)} — ${esc(m.anniversary.md)}</div>`:""}
      ${m.notes?`<div class="small" style="font-style:italic">📝 ${esc(m.notes)}</div>`:""}
      <div class="btnRow">${canEdit()?`<button class="btn btnGhost" data-action="dir-edit" data-id="${m.id}">${t("editMember")}</button>`:""}
      ${(delOk(canEdit()||m.mine))?`<button class="btn btnGhost" data-action="dir-del" data-id="${m.id}">${t("delete")}</button>`:""}</div>
    </div></div>`).join("");
}
function intRowHTML(i){
  const ED = canEdit();
  const mz = i.massId || i.mass;
  return `<div class="eventRow"><div style="flex:1"><span class="tag ${(i.type==="Defunciones"||i.type==="Exequias")?"red":(i.type==="Cumpleaños"||i.type==="Nacimientos"||i.type==="Quinceañeras")?"gold":"green"}">${esc(intTypeName(i.type))}</span>
    <div><b>${esc(i.names)}</b> <span class="small">· ${esc(i.date)}</span></div>${mz?`<div class="small">⛪ ${esc(mz)}${i.place?` · ${esc(i.place)}`:""}</div>`:""}<div class="small">${esc(i.text)}</div></div>
    ${delOk(ED||i.mine)?`<button class="btn btnGhost" data-action="int-del" data-id="${i.id}">${t("delete")}</button>`:`<button class="btn btnGhost" data-action="int-greet" data-id="${i.id}">${t("greetBtn")}</button>`}</div>`;
}
function dirFormHTML(){
  const m = state.editingId ? dirAll().find(x=>x.id===state.editingId) : null;
  const bdayLines = (m?.birthdays||[]).map(b=>`${b.name}, ${b.md}`).join("\n");
    return `<h4 style="margin:10px 0 2px">${m?t("editMember"):t("addMember")}</h4>
    <label>${t("famNameL")}</label><input id="dmFam" value="${esc(m?.family||"")}" placeholder="${esc(t("famNamePh"))}">
    <div class="grid2"><div><label>${t("contactL")}</label><input id="dmContact" value="${esc(m?.contact||"")}"></div>
    <div><label>${t("phoneL")}</label><input id="dmPhone" value="${esc(m?.phone||"")}" placeholder="(505) 555-0000"></div></div>
    <div class="grid2"><div><label>${t("emailL")}</label><input id="dmEmail" value="${esc(m?.email||"")}" placeholder="correo@ejemplo.org"></div>
    <div><label>${t("addressL2")}</label><input id="dmAddr" value="${esc(m?.address||"")}"></div></div>
    <div class="grid2"><div><label>${t("dirClergy")}</label><select id="dmClergy">
      <option value="">${esc(t("optLay"))}</option>
      <option value="parroco" ${m?.clergy==="parroco"?"selected":""}>${esc(t("role_parroco"))}</option>
      <option value="vicario" ${m?.clergy==="vicario"?"selected":""}>${esc(t("role_vicario"))}</option>
      <option value="diacono" ${m?.clergy==="diacono"?"selected":""}>${esc(t("role_diacono"))}</option>
      <option value="religiosa" ${m?.clergy==="religiosa"?"selected":""}>${esc(t("role_religiosa"))}</option>
    </select></div>
    <div><label> </label><label style="font-weight:400"><input type="checkbox" id="dmHome" ${m?.homebound?"checked":""}> ${esc(t("homeboundTag"))}</label></div></div>
    <label>${t("dirGroups")}</label><div class="chipRow">${GROUPS.map(g=>`<label class="fchip" style="font-weight:400;cursor:pointer"><input type="checkbox" data-dmgroup="${g.id}" ${((m?.groups)||[]).includes(g.id)?"checked":""}> ${esc(g.name)}</label>`).join("")}</div>
    <label>${t("dirMembers")}</label><textarea id="dmMembers" placeholder="Sofía (g2)&#10;María">${esc((m?.members||[]).map(x=>x.name+(x.group?` (${x.group})`:"")).join("\n"))}</textarea>
    <label>${t("bdaysL")}</label><textarea id="dmBdays" placeholder="Sofía, 06-08&#10;José, 11-02">${esc(bdayLines)}</textarea>
    <div class="grid2"><div><label>${t("annivL")}</label><input id="dmCouple" value="${esc(m?.anniversary?.couple||"")}" placeholder="${esc(t("couplePh"))}"></div>
    <div><label>${t("dateL")} (MM-DD)</label><input id="dmAnniv" value="${esc(m?.anniversary?.md||"")}" placeholder="06-14"></div></div>
    <label>${t("notesL2")}</label><textarea id="dmNotes" placeholder="${esc(t("notesPh"))}">${esc(m?.notes||"")}</textarea>
    <div class="btnRow"><button class="btn btnGold" data-action="dir-save">${t("saveMember")}</button>
    <button class="btn btnGhost" data-action="dir-cancel">${t("cancelBtn")}</button></div>`;

}

// ---------- MÁS ----------
// ---------- donativos: proyectos, metas, avances, agradecimientos ----------
// Sitio seguro de donaciones en línea de la parroquia (instrucciones de hcccsantacruz.org/giving).
const OSV_FUNDS_URL = "https://osvhub.com/hcccsantacruz/funds";
const SF_DONATE_URL = "https://www.manyanet-us.org/vocations-support-prayer";
function chapelPhotos(){
  const srv = Sync.coll("givingUpdates").filter(u=>u.pid==="blessed-sacrament" && u.photo);
  const loc = (state.giving.updates["blessed-sacrament"] || []).filter(u=>u.photo);
  const seen = new Set(), out = [];
  for(const u of [...srv, ...loc]){ const k = u.photo || ""; if(!k || seen.has(k)) continue; seen.add(k); out.push(u); }
  out.sort((a,b)=>String(a.ts || a.id || a.d || "").localeCompare(String(b.ts || b.id || b.d || "")));
  return out;
}
function chapelMonthly(){
  const srv = Sync.coll("givingUpdates").filter(u=>u.pid==="blessed-sacrament" && u.monthly && u.t);
  let best = null;
  for(const u of srv){ if(!best || String(u.id || "") >= String(best.id || "")) best = u; }
  const loc = state.giving.monthly;
  if(loc && loc.t && (!best || String(loc.id || "") >= String(best.id || ""))) best = loc;
  return best;
}
function chapelHTML(){
  const m = chapelMonthly(), photos = chapelPhotos(), ED = canEdit();
  let h = `<h4 style="margin:10px 0 2px">${t("chapelMsgT")}</h4>`;
  if(m) h += `<div class="notice" style="border-color:var(--gold)">📬 <b>${esc(m.d || "")}</b><br>${esc(m.t)}${ED && m.id ? ` <button class="btn btnGhost" data-action="chapel-msg-del" data-id="${esc(m.id)}">✕</button>` : ""}</div>`;
  else h += `<p class="small">${t("chapelMsgEmpty")}</p>`;
  if(ED) h += `<textarea id="chapel-msg-inp" placeholder="${esc(t("chapelMsgPh"))}" style="margin-top:6px"></textarea>
    <div class="btnRow"><button class="btn btnGhost" data-action="chapel-msg-save">${t("publish")}</button></div>`;
  h += `<h4 style="margin:10px 0 2px">${t("chapelGalleryT")}</h4>`;
  h += photos.length ? `<div class="galGrid">` + photos.map(p=>`<div class="galItem"><a href="${esc(p.photo)}" target="_blank" rel="noopener"><img src="${esc(p.photo)}" alt="${esc(p.t || "")}" loading="lazy"></a><div class="small">• ${esc(p.d || "")} — ${esc(p.t || "")}</div>${ED ? `<button class="btn btnGhost" data-action="chapel-photo-del" data-id="${esc(p.id || "")}" data-url="${esc(p.photo || "")}">✕</button>` : ""}</div>`).join("") + `</div>`
    : `<p class="small">${t("chapelGalleryEmpty")}</p>`;
  if(ED) h += `<div class="btnRow"><input id="chapel-photo-file" type="file" accept="image/*" style="flex:1"><input id="chapel-photo-cap" placeholder="${esc(t("chapelCapPh"))}" style="flex:2"></div>
    <div class="btnRow"><button class="btn btnGhost" data-action="chapel-photo-add">${t("chapelPhotoBtn")}</button></div>`;
  if(state._chapelMsg) h += `<div class="notice">${esc(state._chapelMsg)}</div>`;
  h += `<h4 style="margin:10px 0 2px">${t("chapelPrayT")}</h4>
    <div class="verseBox">“${esc((prayerText("oracion-capilla")||"").slice(0,220))}…”</div>
    <div class="btnRow"><button class="btn btnGhost" data-action="chapel-prayer-open">${t("open")}</button>
      <button class="btn btnNavy" data-action="pray-aloud" data-id="oracion-capilla">${t("voiceBtn")}</button>
      <button class="btn btnNavy bigBtn" data-action="pray-aloud" data-id="avemaria">${t("aveBtn")}</button></div>`;
  return h;
}
function givingHTML(){
  const p = parish();
  const myGifts = [...state.giving.gifts].reverse();
  const donor = esc(state.giving.name || state.userName || "");
  let h = `<section class="card" id="sec-donativos"><h3>${t("givTitle")}</h3><p class="sub">${t("givSub")}</p>
    <div class="notice" style="border-color:var(--gold)"><b>${t("givOnlineT")}</b><br><span class="small">${t("givOnlineSub")}</span>
      <div class="small" style="margin-top:6px">• ${t("givStep1")}<br>• ${t("givStep2")}<br>• ${t("givStep3")}</div>
      <div class="btnRow"><button class="btn btnGold" data-action="ext" data-url="${OSV_FUNDS_URL}">${t("givOnlineBtn")}</button></div>
      <div class="small">💰 ${t("givTax")}</div></div>
    <div class="eventRow"><div style="flex:1"><b>${t("givAltT")}</b><div class="small">${t("givAltBody")}</div></div></div>
    <label>${t("donorL")}</label><input id="giveName" value="${donor}" placeholder="${esc(t("donorL"))}">
    <h4 style="margin:12px 0 2px">${t("givProjects")}</h4><p class="sub">${t("givProjectsSub")}</p>`;
  h += GIVING_PROJECTS.map(pr=>{
    const goal = gGoal(pr), raised = gRaised(pr), rest = Math.max(0, goal - raised);
    const pct = goal > 0 ? Math.min(100, Math.round(raised / goal * 100)) : 0;
    const ups = gUpdates(pr);
    const editing = state.goalOpen === pr.id;
    return `<div class="eventRow"><div style="flex:1"><b>${esc(pr.name)}</b><div class="small">${esc(gprojDesc(pr))}</div>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <div class="small"><b>${t("raisedL")} ${fmt$(raised)}</b> / ${t("goalL")} ${fmt$(goal)} · ${pct}%${rest > 0 ? ` · ${t("toGoL")} ${fmt$(rest)}` : ` · <span class="tag gold">${t("reachedL")}</span>`}</div>
      <div class="btnRow">${[10,25,50,100].map(a=>`<button class="btn ${state.givingAmt===a?"btnNavy":"btnGhost"}" data-action="giving-amount" data-amt="${a}">$${a}</button>`).join("")}
        <input id="give-amt-${pr.id}" type="number" min="1" style="width:110px" placeholder="${esc(t("customAmtL"))}" value="${state.givingAmt}"></div>
      <div class="btnRow"><button class="btn btnGold" data-action="give-donate" data-id="${pr.id}">${t("giveProjBtn")} · ${fmt$(state.givingAmt)}</button>
        ${canEdit()?`<button class="btn btnGhost" data-action="goal-edit" data-id="${pr.id}">${t("editGoalL")}</button>`:""}</div>
      <div class="small">🔒 ${t("givSecureNote")}</div>
      ${editing ? `<div class="btnRow"><input id="goal-inp-${pr.id}" type="number" min="1" style="width:140px" value="${goal}">
        <button class="btn btnNavy" data-action="goal-save" data-id="${pr.id}">✓</button>
        <button class="btn btnGhost" data-action="goal-edit" data-id="${pr.id}">${t("cancelBtn")}</button></div>` : ""}
      ${pr.id === "blessed-sacrament" ? chapelHTML() : ""}
      <h4 style="margin:10px 0 2px">📈 ${t("updTitle")}</h4>
      ${ups.length ? ups.map(u=>`<div class="small">• <b>${esc(u.d || "")}</b> — ${esc(u.t)}</div>`).join("") : `<p class="small">${t("noUpd")}</p>`}
      ${canEdit()?`<textarea id="upd-${pr.id}" placeholder="${esc(t("updPh"))}" style="margin-top:6px"></textarea>
      <div class="btnRow"><button class="btn btnGhost" data-action="upd-add" data-id="${pr.id}">${t("publish")}</button></div>`:""}
    </div></div>`;
  }).join("");
  h += `<h4 style="margin:12px 0 2px">💛 ${t("myGiftsL")}</h4>`;
  h += myGifts.length ? myGifts.map(g=>{
    if(g.status === "received") return `<div class="notice" style="border-color:var(--gold)">💛 <b>${t("thankTitle")}</b><br>${esc(thankText(g))}
      <div class="btnRow"><button class="btn btnGhost" data-action="give-del" data-id="${g.id}">${t("delete")}</button></div></div>`;
    return `<div class="eventRow"><div style="flex:1"><span class="tag gold">⏳ ${t("pendingL")}</span> <b>${fmt$(g.amt)}</b> · ${esc(gprojName(g.pid))}<div class="small">${esc(g.name)} · ${esc(giftDate(g))} · Folio ${esc(g.folio)}</div>
      <p class="small">${t("pendingMsg")}</p>
      <div class="btnRow"><button class="btn btnNavy" data-action="give-credit" data-id="${g.id}">${t("creditBtn")}</button>
      <button class="btn btnGhost" data-action="give-del" data-id="${g.id}">${t("delete")}</button></div></div></div>`;
  }).join("") : `<p class="small">${t("noGifts")}</p>`;
  h += `<div class="kv"><span>${t("parishL")}</span><b>${esc(p.name)}</b></div>
    <div class="kv"><span>${t("addressL")}</span><span>${esc(p.address)}</span></div>
    <div class="kv"><span>${t("pastorL")}</span><span>${esc(p.priest)}</span></div></section>`;
  return h;
}
const TURNOS = [["f1","Vie 1–2 PM","Fri 1–2 PM"],["f2","Vie 2–3 PM","Fri 2–3 PM"],["f3","Vie 3–4 PM","Fri 3–4 PM"],["f4","Vie 4–5 PM","Fri 4–5 PM"],["f5","Vie 5–6 PM","Fri 5–6 PM"],["pv","Primer viernes 7:30 AM–4 PM","First Friday 7:30 AM–4 PM"],["otro","Otro horario","Another time"]];
function pastoralHTML(){
  const isEn = getLang()==="en";
  const ED = canEdit();
  const F = state._pastoralForm;
  const team = pastoralAll();
  const refl = isEn?REFLEX_FAMILIA.en:REFLEX_FAMILIA.es;
  const adv = isEn?ADVIENTO_GUIDE.en:ADVIENTO_GUIDE.es;
  const advFam = isEn?FAMILIA_ADVIENTO.en:FAMILIA_ADVIENTO.es;
  return `<section class="card" id="sec-pastoral"><h3>${t("pastT")}</h3><p class="sub">${t("pastSub")}</p>
    ${state._pastoralSent?`<div class="notice">${esc(state._pastoralSent)}</div>`:""}
    <h4 style="margin:10px 0 2px">${t("adorT")}</h4><p class="small">${t("adorSub")}</p>
    ${F==="adoracion"
      ? `<label>${t("yourName")}</label><input id="paName" value="${esc(state.userName||"")}" placeholder="${esc(t("namePh"))}">
        <label>${t("phoneL")}</label><input id="paPhone" inputmode="tel" placeholder="(505) …">
        <label>${t("turnoL")}</label><select id="paTurno">${TURNOS.map(o=>`<option value="${esc(isEn?o[2]:o[1])}">${esc(isEn?o[2]:o[1])}</option>`).join("")}</select>
        <div class="btnRow"><button class="btn btnGold" data-action="pastoral-adorar">${t("sendMsg")}</button>
        <button class="btn btnGhost" data-action="pastoral-form" data-f="adoracion">${t("cancelBtn")}</button></div>`
      : `<div class="btnRow"><button class="btn btnGold" data-action="pastoral-form" data-f="adoracion">🕯️ ${t("adorBtn")}</button></div>`}
    <h4 style="margin:12px 0 2px">${t("visitT")}</h4><p class="small">${t("visitSub")}</p>
    ${F==="visita"
      ? `<label>${t("sickNameL")}</label><input id="pvSick" placeholder="${esc(t("namePh"))}">
        <label>${t("visitTypeL")}</label><select id="pvType"><option value="visita">${t("visitVisit")}</option><option value="comunion">${t("visitCom")}</option></select>
        <label>${t("yourName")} · ${t("phoneL")}</label><input id="pvContact" value="${esc(state.userName||"")}" placeholder="(505) …">
        <label>${t("addressL2")}</label><input id="pvAddr" placeholder="…">
        <label>${t("messageL")}</label><textarea id="pvNotes" placeholder="…"></textarea>
        <div class="btnRow"><button class="btn btnGold bigBtn" data-action="pastoral-visita">${t("visitBtn")}</button>
        <button class="btn btnGhost" data-action="pastoral-form" data-f="visita">${t("cancelBtn")}</button></div>`
      : `<div class="btnRow"><button class="btn btnGold bigBtn" data-action="pastoral-form" data-f="visita">🏠 ${t("visitBtn")}</button></div>`}
    <h4 style="margin:12px 0 2px">${t("privT")}</h4><p class="small">🔒 ${t("privSub")}</p>
    <label>${t("pvNamesL")}</label><textarea id="ppNames" placeholder="…"></textarea>
    <label>${t("pvKindL")}</label><select id="ppKind"><option value="enfermos">${t("pvSick")}</option><option value="difuntos">${t("pvDep")}</option></select>
    <div class="btnRow"><button class="btn btnNavy" data-action="pastoral-privada">${t("sendMsg")}</button></div>
    <h4 style="margin:12px 0 2px">${t("rinconT")}</h4><p class="small">${t("rinconSub")}</p>
    <p style="font-size:14.5px;line-height:1.6;white-space:pre-line">${esc(refl)}</p>
    <details class="ordDet"><summary>🕯️ ${esc(t("advT"))}</summary>
      <div class="ordSec"><p class="prayerText" style="font-size:15px;white-space:pre-line">${esc(adv)}</p></div></details>
    <details class="ordDet"><summary>👨‍👩‍👧 ${esc(isEn?"Preparing the heart as a family: Advent guide":"Preparando el corazón en familia: guía de Adviento")}</summary>
      <div class="ordSec"><p class="prayerText" style="font-size:15px;white-space:pre-line">${esc(advFam)}</p></div></details>
    <div class="btnRow"><button class="btn btnNavy bigBtn" data-action="pray-aloud" data-id="avemaria">${t("aveBtn")}</button>
      <button class="btn btnNavy bigBtn" data-action="pray-aloud" data-id="padrenuestro">${t("patBtn")}</button></div>
    ${ED?`<h4 style="margin:12px 0 2px">🤲 ${t("teamT")} (${team.length})</h4>
      ${team.length?team.map(m=>`<div class="eventRow"><div style="flex:1"><b>${esc(m.title||"—")}</b> <span class="tag">${esc(m.channel||"")}</span>
        <div class="small">${esc(m.from||"")} · ${esc(m.time||"")}</div>
        <div class="small" style="white-space:pre-line">${esc(m.body||"")}</div></div>
        <button class="btn btnGhost" data-action="pastoral-del" data-id="${esc(m.id)}">${t("delete")}</button></div>`).join(""):`<p class="small">${t("teamEmpty")}</p>`}`:""}
  </section>`;
}
function renderCommunity(){
  const ED = canEdit();
  const muro = muroAll().slice(0,6);
  const massOpts = Object.keys(state.ministry);
  if(!massOpts.includes(state.ministryMass)) state.ministryMass = massOpts[0];
  const mm = { ...(state.ministry[state.ministryMass] || {}), ...((Sync.online && Sync.ministrySrv[state.ministryMass]) || {}) };
  const acc = myAccount();
  $("#view-community").innerHTML = `
    <h2 class="serif" style="margin:4px 0">${t("communityTitle")}</h2>
    <p class="small" style="margin:2px 0 6px">${t("communitySub")}</p>
    <div class="subnav">${[["sec-perfil","👤"],["sec-directorio","🗂️"],["sec-grupos","👥"],["sec-ministerios","🙌"],["sec-mensajes","✉️"],["sec-muro","💬"],["sec-medios","🎶"]].map(([id,l])=>`<button data-action="jump" data-to="${id}">${l}</button>`).join("")}</div>

    <section class="card" id="sec-perfil"><h3>${t("regTitle")}</h3>
      <p class="sub">${fieles().length} ${t("regSub")}</p>
      ${state.userName?`<div class="kv"><span>${t("myAccT")}</span><b>${esc(state.userName)}</b></div>
        ${myRole()?`<div class="kv"><span>${t("accRoleIs")}</span><b>${esc(roleLabel(myRole()))}</b></div>`:""}
        ${state._chpwMsg?`<div class="notice">${esc(state._chpwMsg)}</div>`:""}
        ${acc&&acc.pass?`<h4 style="margin:10px 0 2px">${t("chPwT")}</h4>
        <label>${t("pwCurL")}</label><input id="chPwCur" type="password" autocomplete="current-password">
        <label>${t("pwNewL")}</label><input id="chPwNew" type="password" autocomplete="new-password">
        <div class="btnRow"><button class="btn btnNavy" data-action="chpw-save">${t("pwChangeBtn")}</button></div>`:""}
        <div class="chipRow">${fieles().slice(0,10).map(f=>`<span class="tag">${esc(f)}</span>`).join("")}</div>
        <div class="btnRow"><button class="btn btnGhost" data-action="acc-logout">${t("accLogoutBtn")}</button></div>`
      :`<label>${t("yourName")}</label><input id="regName" placeholder="${esc(t("namePh"))}">
        <div class="btnRow"><button class="btn btnGold" data-action="register">${t("register")}</button></div>`}
    </section>

    <section class="card" id="sec-directorio">
<h3>${t("dirTitle")}</h3><p class="sub">${t("dirSub")}</p>
      <div class="searchRow"><input id="dirQ" placeholder="${esc(t("searchDir"))}" value="${esc(state.dirQ)}"></div>
      <div class="searchRow"><select id="dirGroupSel" style="flex:1"><option value="Todas">${esc(t("allCats"))}</option>${GROUPS.map(g=>`<option value="${g.id}" ${state.dirGroup===g.id?"selected":""}>${esc(g.name)}</option>`).join("")}</select></div>
      ${dirListHTML()}
      ${dirFormOpen()? dirFormHTML() : (ED?`<div class="btnRow"><button class="btn btnNavy" data-action="dir-form">${t("addMember")}</button></div>`:lockNote())}
    </section>

    <section class="card" id="sec-grupos"><h3>${t("groupsTitle")}</h3><p class="sub">${t("groupsSub")}</p>
      <div class="chipRow"><button class="fchip ${state.groupCat==="Todas"?"active":""}" data-action="group-cat" data-c="Todas">${t("allCats")}</button>
        ${["liturgia","caridad","formacion","devocion","jovenes","familia","comunidad"].map(c=>`<button class="fchip ${state.groupCat===c?"active":""}" data-action="group-cat" data-c="${c}">${esc(gcatLabel(c))}</button>`).join("")}</div>
      ${GROUPS.filter(g=>state.groupCat==="Todas"||g.cat===state.groupCat).map(g=>{ const j = state.joinedGroups.includes(g.id);
        const regs = dirAll().filter(m=>(m.groups||[]).includes(g.id));
        const open = state.groupOpen===g.id;
        return `<div class="eventRow"><div style="flex:1"><b>${esc(g.name)}</b> <span class="small">· ${g.members+(j?1:0)} ${t("members")}</span>
        <div><span class="tag">${esc(gcatLabel(g.cat||"comunidad"))}</span> <span class="small">${esc(g.meets||"")} · ${esc(g.lang==="ambos"?"ES/EN":g.lang.toUpperCase())}</span></div>
        <div class="small">${esc(gdesc(g))}</div>
        ${open?`<div class="small" style="margin-top:4px">👥 <b>${esc(t("membersOf"))} (${regs.length}):</b> ${regs.length?regs.map(m=>esc(m.contact||m.family)).join(" · "):"—"}</div>`:""}
        <div class="btnRow"><button class="btn btnGhost" data-action="group-members" data-id="${g.id}">${open?"▲":`▼ ${esc(t("membersOf"))}`}</button>
        ${(g.open||j)?`<button class="btn ${j?"btnGhost":"btnNavy"}" data-action="group-join" data-id="${g.id}">${j?t("leave"):t("join")}</button>`:`<span class="small">${t("askOffice")}</span>`}
        ${g.id==="g16"?`<button class="btn btnGold" data-action="pastoral-focus" data-f="adoracion">🕯️ ${esc(t("adorBtn"))}</button>`:""}${g.id==="g10"?`<button class="btn btnGold" data-action="pastoral-focus" data-f="visita">🏠 ${esc(t("visitBtn"))}</button>`:""}${g.id==="g20"?`<button class="btn btnGhost" data-action="pastoral-focus" data-f="">${esc(t("rinconBtn"))} →</button>`:""}</div></div></div>`;}).join("")}
      ${ED?`<h4 style="margin:10px 0 2px">${t("pubGroupAct")}</h4>
      <label>${t("groupL")}</label><select id="geGroup">${GROUPS.filter(g=>state.joinedGroups.includes(g.id)).map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("") || `<option value="">${t("joinFirst")}</option>`}</select>
      <label>${t("titleL")}</label><input id="geTitle" placeholder="${esc(t("geTitlePh"))}">
      <div class="grid2"><div><label>${t("dayL")}</label><select id="geDay">${["sun","mon","tue","wed","thu","fri","sat"].map(k=>`<option value="${k}">${dayName(k)}</option>`).join("")}</select></div>
      <div><label>${t("timeL")}</label><input id="geTime" placeholder="${esc(t("timePh"))}"></div></div>
      <label>${t("placeL")}</label><input id="gePlace" placeholder="${esc(t("placePh"))}">
      <div class="btnRow"><button class="btn btnNavy" data-action="group-event-add">${t("publish")}</button></div>`:`<p class="small">${t("readOnlyNote")}</p>`}
    </section>

    <section class="card" id="sec-ministerios"><h3>${t("minTitle")}</h3><p class="sub">${t("minSub")}</p>
      <div class="subnav">${massOpts.map(m=>`<button class="${state.ministryMass===m?"active":""}" data-action="ministry-mass" data-m="${esc(m)}">${esc(m)}</button>`).join("")}</div>
      <table class="minTable">${MINISTRY_ROLES.map(r=>`<tr><td>${esc(r)}</td><td>${ED?`<input data-minrole="${esc(r)}" value="${esc(mm[r]||"")}" placeholder="${esc(t("unassigned"))}">`:`<span>${esc(mm[r]||"—")}</span>`}</td></tr>`).join("")}</table>
      ${ED?`<div class="btnRow"><button class="btn btnGold" data-action="ministry-save">${t("saveProgram")}</button></div>
      <p class="small">${t("savedLocal")}</p>`:lockNote()}
    </section>

    <section class="card" id="sec-mensajes"><h3>${t("msgTitle")}</h3><p class="sub">${t("msgSub")}</p>
      ${canEdit()&&pastoralAll().length?`<div class="notice">🤲 ${t("teamHint")} <button class="backLink" data-action="jump" data-to="sec-pastoral">→</button></div>`:""}
      ${allMessages().map(m=>`<div class="eventRow"><div style="flex:1"><div class="small">${esc(m.from)} · ${esc(m.time)} · ${esc(m.channel)}${m.to&&m.to!=="all"?` · 👥 ${esc(msgToName(m.to))}`:""}</div><b>${esc(m.title)}</b>
        ${state.openMsg===m.id?`<p class="small" style="color:inherit">${esc(m.body)}</p>`:""}
        </div><button class="btn btnGhost" data-action="msg-open" data-id="${m.id}">${state.openMsg===m.id?t("hideBtn"):t("open")}</button></div>`).join("")}
      <h4 style="margin:10px 0 2px">${t("writeMsg")}</h4>
      <label>${t("npTitle")}</label><input id="msgTitle" placeholder="${esc(t("msgTitlePh"))}">
      <label>${t("messageL")}</label><textarea id="msgBody" placeholder="${esc(t("msgBodyPh"))}"></textarea>
      <label>${t("msgToL")}</label><select id="msgTo"><option value="all">${esc(t("msgToAll"))}</option><option value="ministers">🙌 ${esc(t("msgMinisters"))}</option>${GROUPS.map(g=>`<option value="${g.id}">👥 ${esc(g.name)}</option>`).join("")}</select>
      <div class="btnRow"><button class="btn btnNavy" data-action="msg-add">${t("sendMsg")}</button></div>
    </section>

    <section class="card" id="sec-muro"><h3>${t("muroTitle")}</h3><p class="sub">${t("muroSub")}</p>
      ${muro.map(m=>`<div class="eventRow"><div class="avatar">${esc((m.name||"F").slice(0,1))}</div>
        <div style="flex:1"><b>${esc(m.name)}</b> <span class="tag">${esc(m.kind)}</span> <span class="small">· ${esc(m.when||"")}</span><div>${esc(m.text)}</div></div>
        ${(delOk(ED&&m.id))?`<button class="btn btnGhost" data-action="muro-del" data-id="${m.id}">${t("delete")}</button>`:""}</div>`).join("")}
      <label>${t("yourMsg")}</label><textarea id="muroText" placeholder="${esc(t("muroPh"))}"></textarea>
      <div class="btnRow"><select id="muroKind" style="flex:1"><option>${t("kind_greet")}</option><option>${t("kind_note")}</option><option>${t("kind_prayer")}</option></select>
      <button class="btn btnNavy" data-action="muro-add">${t("send")}</button></div>
    </section>

    <section class="card" id="sec-medios"><h3>${t("mediaTitle")}</h3><p class="sub">${t("mediaSub")}</p>
      <h4 style="margin:8px 0 2px">${t("streamT")}</h4>
      ${streamEff().yt?`<p class="small">${esc(streamEff().label||t("streamSub"))}</p>
        <div style="position:relative;padding-top:56.25%;margin-top:4px"><iframe style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px" src="https://www.youtube.com/embed/${esc(streamEff().yt)}" allowfullscreen loading="lazy"></iframe></div>
        ${delOk(ED)?`<div class="btnRow"><button class="btn btnGhost" data-action="stream-clear">${t("remove")}</button></div>`:""}`
      :`<p class="small">${t("noStream")}</p>
        <div class="btnRow"><button class="btn btnGhost" data-action="ext" data-url="${PARISH_YT}">${t("streamChan")} ↗</button></div>
        <p class="small">📻 ${t("radioNote")}</p>
        ${ED?`<label>${t("streamT")}</label><input id="streamUrl" placeholder="${esc(t("streamPh"))}">
        <div class="btnRow"><button class="btn btnNavy" data-action="stream-save">${t("streamSave")}</button></div>`:""}`}
      <div class="btnRow"><button class="btn btnGhost" data-action="ext" data-url="https://www.youtube.com/@Vatican">${esc(t("vaticanYTL"))} ↗</button></div>
      ${ALL_CANTOS().map(c=>`<div class="eventRow"><div style="flex:1"><b>${esc(c.title)}</b><div class="small">${esc(c.origin||"")}</div>
        <div class="small" style="font-style:italic">“${esc(c.lyrics)}”</div>
        <div class="btnRow">${c.notes?`<button class="btn btnGhost" data-action="canto-play" data-id="${c.id}">${t("melody")}</button>`:""}
        <button class="btn btnGhost" data-action="canto-sing" data-id="${c.id}">${t("voiceBtn")}</button>
        <button class="btn btnGhost" data-action="stop-voice">${t("stop")}</button>
        ${delOk(ED&&c.mine)?`<button class="btn btnGhost" data-action="canto-del" data-id="${c.id}">${t("delete")}</button>`:""}</div></div></div>`).join("")}
      ${ED?`<h4 style="margin:10px 0 2px">${t("addCanto")}</h4>
      <label>${t("npTitle")}</label><input id="ctTitle" placeholder="${esc(t("npTitlePh"))}">
      <label>${t("cantoLyricsL")}</label><textarea id="ctLyrics" placeholder="${esc(t("muroPh"))}"></textarea>
      <div class="btnRow"><button class="btn btnNavy" data-action="canto-add">${t("publish")}</button></div>`:`<p class="small">${t("readOnlyNote")}</p>`}
      <h4 style="margin:10px 0 2px">${t("videosT")}</h4>
      <p class="small">${t("videosSub")}</p>
      <div id="videoList">${mix(Sync.coll("videos"), state.videosExtra, []).length? mix(Sync.coll("videos"), state.videosExtra, []).map(v=>`<div style="margin-top:8px"><b>${esc(v.title)}</b>
        <div style="position:relative;padding-top:56.25%;margin-top:4px"><iframe style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px" src="https://www.youtube.com/embed/${v.yt}" allowfullscreen loading="lazy"></iframe></div>
        ${delOk(ED)?`<div class="btnRow"><button class="btn btnGhost" data-action="video-del" data-id="${v.id}">${t("remove")}</button></div>`:""}</div>`).join("")
        : `<p class="small">${t("noVideos")}</p>`}</div>
      ${ED?`<label>${t("npTitle")}</label><input id="vdTitle" placeholder="${esc(t("vdTitlePh"))}">
      <label>${t("vdUrlPh")}</label><input id="vdUrl" placeholder="https://youtube.com/watch?v=…">
      <div class="btnRow"><button class="btn btnNavy" data-action="video-add">${t("addVideo")}</button></div>`:`<p class="small">${t("readOnlyNote")}</p>`}
    </section>`;
  const dq = $("#dirQ");
  dq?.addEventListener("input", e=>{ state.dirQ = e.target.value; const pos=e.target.selectionStart; renderCommunity(); const n=$("#dirQ"); n?.focus(); n?.setSelectionRange(pos,pos); });
  $("#dirGroupSel")?.addEventListener("change", e=>{ state.dirGroup = e.target.value; renderCommunity(); });
}

function inviteMsgText(u, code){
  const link = "https://perchance.org/" + (window.generatorName || "");
  return t("invMsgTpl").replace("{name}", u.name).replace("{parish}", parish().name).replace("{link}", link).replace("{code}", code);
}
function accountMgrHTML(){
  if(!isFullAdmin()) return `<p class="small">${t("readOnlyNote")}</p>`;
  const me = (state.userName || "").toLowerCase();
  const users = [...Sync.coll("users")].sort((a,b)=>((a.pass?1:0)-(b.pass?1:0)) || String(a.name||"").localeCompare(String(b.name||"")));
  let h = `<h4 style="margin:12px 0 2px">${t("accMgrT")}</h4><p class="small">${t("accMgrSub")}</p>`;
  if(Sync.online ? Sync.isAdmin : state.admin) h += `<p class="small">🔐 ${t("accAdminNote")}</p>`;
  if(state._accMsg) h += `<div class="notice">${esc(state._accMsg)}</div>`;
  h += `<label>${t("accNameL")}</label><input id="accName" placeholder="${esc(t("accNamePh"))}" autocomplete="off">
    <label>${t("accContactL")}</label><input id="accContact" placeholder="${esc(t("accContactPh"))}" autocomplete="off">
    <label>${t("accRoleL")}</label><select id="accRole"><option value="member">${esc(t("roleMember"))}</option><option value="editor">${esc(t("roleEditor"))}</option><option value="admin">${esc(t("roleAdminR"))}</option></select>
    <div class="btnRow"><button class="btn btnNavy" data-action="acc-create">${t("accCreateBtn")}</button></div>`;
  h += users.length ? users.map(u=>{
    const isMe = String(u.name||"").toLowerCase() === me;
    const code = (state._codes[u.id]||{}).code || "";
    return `<div class="eventRow"><div style="flex:1"><b>${esc(u.name)}</b> <span class="tag ${u.pass?"green":"gold"}">${u.pass?esc(t("accActive")):esc(t("accPending"))}</span>
      <div class="small">${esc(u.contact||"")}</div>
      ${isMe?`<div class="small">${esc(roleLabel(u.role))}</div>`
      :`<div class="chipRow">${["member","editor","admin"].map(r=>`<button class="fchip ${u.role===r?"active":""}" data-action="acc-role" data-id="${esc(u.id)}" data-r="${r}">${esc(roleLabel(r))}</button>`).join("")}</div>`}
      ${(!u.pass && code)?`<div class="notice">🔑 <b style="letter-spacing:.06em">${esc(code)}</b>
        <div class="btnRow"><button class="btn btnGhost" data-action="acc-mail" data-id="${esc(u.id)}">${t("accMailBtn")}</button>
        <button class="btn btnGhost" data-action="acc-sms" data-id="${esc(u.id)}">${t("accSmsBtn")}</button>
        <button class="btn btnGhost" data-action="acc-copy" data-id="${esc(u.id)}">${t("accCopyBtn")}</button></div></div>`:""}
      ${isMe?"":`<div class="btnRow">${u.pass?"":`<button class="btn btnGhost" data-action="acc-reset" data-id="${esc(u.id)}">${t("accReset")}</button>`}
      <button class="btn btnGhost" data-action="acc-revoke" data-id="${esc(u.id)}">${t("accRevoke")}</button></div>`}
    </div></div>`; }).join("") : `<p class="small">${t("accEmpty")}</p>`;
  return h;
}
function appCtx(){ return { ED: canEdit(), parishId: state.parishId, parishName: parish().name, refresh: ()=>{ try { render(); renderMore(); renderCommunity(); renderHome(); renderCalendar(); renderPray(); } catch(e){} } }; }
function renderMore(){
  const p = parish();
  const ED = canEdit();
  const bOpen = allBulletins().find(b=>b.id===state.bulletinOpen);
  const muro = muroAll().slice(0,6);
  const intTypes = INT_ES;
  const ints = allIntenciones().filter(i=>state.intencionFilter==="Todas"||i.type===state.intencionFilter);
  const newsCats = ["Todas","Diócesis","País","Iglesia"];
  const news = allNews().filter(n=>state.newsFilter==="Todas"||n.cat===state.newsFilter);
  const massOpts = Object.keys(state.ministry);
  if(!massOpts.includes(state.ministryMass)) state.ministryMass = massOpts[0];
  const mm = { ...(state.ministry[state.ministryMass] || {}), ...((Sync.online && Sync.ministrySrv[state.ministryMass]) || {}) };
  $("#view-more").innerHTML = `
    <h2 class="serif" style="margin:4px 0">${t("moreTitle")}</h2>
    <div class="subnav">${[["sec-idioma","🌐"],["sec-admin","🔐"],["sec-contenido","✏️"],["sec-clero","⛪"],["sec-alertas","🔔"],["sec-intenciones","🎉"],["sec-pastoral","🤲"],["sec-boletines","📄"],["sec-documentos","📁"],["sec-noticias","🌎"],["sec-donativos","💛"]].map(([id,l])=>`<button data-action="jump" data-to="${id}">${l}</button>`).join("")}</div>

    <section class="card" id="sec-idioma"><h3>🌐 ${t("language")}</h3><p class="sub">${t("languageSub")}</p>
      <div class="chipRow">${LANGS.map(l=>`<button class="fchip ${state.lang===l.id?"active":""}" data-action="lang-set" data-l="${l.id}">${l.native}</button>`).join("")}</div>
    </section>

    <section class="card" id="sec-admin"><h3>${t("adminT")}</h3><p class="sub">${t("adminSub")}</p>
      <p class="small">${Sync.online?esc(t("srvOn")):esc(t("srvOff"))}</p>
      ${(Sync.online?Sync.isAdmin:state.admin)?`<p><span class="tag gold">🔐 ${esc(t("adminMode"))}</span></p>`:ED?`<p><span class="tag green">✍️ ${esc(t("editorMode"))} · ${esc(state.userName)}</span></p>`:""}
      ${state._admMsg?`<div class="notice">${esc(state._admMsg)}</div>`:""}
      ${!((Sync.online?Sync.isAdmin:state.admin)||ED)?(Sync.online
        ?`<label>${t("srvPassPh")}</label><input id="admSrvPass" type="password" autocomplete="off" placeholder="••••••••">
      <div class="btnRow"><button class="btn btnNavy" data-action="admin-login">${t("adminLogin")}</button></div>`
        :`<label>PIN</label><input id="admPin" type="password" inputmode="numeric" placeholder="••••">
      <div class="btnRow"><button class="btn btnNavy" data-action="admin-login">${t("adminLogin")}</button></div>`):""}
      ${(Sync.online?Sync.isAdmin:state.admin)?`${Sync.online?"":`<label>${t("newPinL")}</label><div class="btnRow"><input id="admNewPin" type="password" inputmode="numeric" style="flex:1"><button class="btn btnGhost" data-action="pin-save">${t("changePin")}</button></div>`}
      <h4 style="margin:10px 0 2px">${t("editorsL")}</h4>
      ${editorsEff().length?editorsEff().map(n=>`<div class="eventRow"><div style="flex:1"><b>${esc(n)}</b></div><button class="btn btnGhost" data-action="editor-del" data-n="${esc(n)}">${t("delete")}</button></div>`).join(""):`<p class="small">—</p>`}
      <div class="btnRow"><input id="admEditor" placeholder="${esc(t("editorPh"))}" style="flex:1"><button class="btn btnNavy" data-action="editor-add">${t("addEditorBtn")}</button></div>
      <div class="btnRow"><button class="btn btnGhost" data-action="admin-logout">${t("adminLogout")}</button></div>`:""}
      ${ED? accountMgrHTML():""}
    </section>

    ${contentMgrHTML(appCtx())}

    <section class="card" id="sec-clero"><h3>${t("clergyTitle")}</h3><p class="sub">${t("clergySub")}</p>
      ${CLERGY.map(c=>`<div class="eventRow"><div class="avatar">${esc(c.name.replace(/^(P\.|Diác\.|Hna\.)\s*/,"").slice(0,1))}</div>
        <div style="flex:1"><b>${esc(c.name)}</b> <span class="tag gold">${esc(clergyRoleName(c.role))}</span>
        <div class="small">${esc(c.bio||"")}</div>
        <div class="small">🕰️ ${esc(c.office||"")}${c.phone?` · <a href="tel:${c.phone.replace(/[^+\d]/g,"")}">${esc(c.phone)}</a>`:""}${c.email?` · <a href="mailto:${esc(c.email)}">✉️</a>`:""}</div></div></div>`).join("")}
    </section>

    <section class="card" id="sec-alertas"><h3>${t("upcomingT")}</h3><p class="sub">${t("upcomingSub")}</p>
      <div class="chipRow"><span class="small">${t("horizonL")}:</span>${[7,14,30].map(n=>`<button class="fchip ${state.alertHorizon===n?"active":""}" data-action="horizon-set" data-n="${n}">${n} ${t("daysL")}</button>`).join("")}</div>
      ${(()=>{ const al=collectAlerts(state.alertHorizon); return al.length? al.map(alertRow).join("") : `<p class="small">${t("noAlerts")}</p>`; })()}
      <div class="btnRow">
        <button class="btn btnGold" data-action="notify-office">${t("notifyOffice")}</button>
        ${store.get("alerts.auto",false)?`<span class="tag green">${t("alertsOn")}</span>`:`<button class="btn btnGhost" data-action="alerts-enable">${t("enableAlerts")}</button>`}
      </div>
      ${state._officeSent?`<div class="notice">${t("notifSent")}</div>`:""}
    </section>

    <section class="card" id="sec-intenciones"><h3>${t("intTitle")}</h3>
      <div class="chipRow"><button class="fchip ${state.intencionFilter==="Todas"?"active":""}" data-action="int-filter" data-t="Todas">${t("allCats")}</button>
      ${intTypes.map(ty=>`<button class="fchip ${state.intencionFilter===ty?"active":""}" data-action="int-filter" data-t="${ty}">${esc(intTypeName(ty))}</button>`).join("")}</div>
      ${state.intencionFilter==="Todas"
        ? `<h4 style="margin:8px 0 2px">🙏 ${t("vivosL")} (${ints.filter(i=>!isDif(i)).length})</h4>${ints.filter(i=>!isDif(i)).map(intRowHTML).join("") || `<p class="small">${t("noEvents")}</p>`}
           <h4 style="margin:8px 0 2px">✝ ${t("difuntosL")} (${ints.filter(isDif).length})</h4>${ints.filter(isDif).map(intRowHTML).join("") || `<p class="small">${t("noEvents")}</p>`}`
        : (ints.map(intRowHTML).join("") || `<p class="small">${t("noEvents")}</p>`)}
      ${ED?`<h4 style="margin:10px 0 2px">${t("publishInt")}</h4>
      <label>${t("typeL")}</label><select id="inType">${intTypes.map(ty=>`<option value="${ty}">${esc(intTypeName(ty))}</option>`).join("")}</select>
      <label>${t("namesL")}</label><input id="inNames" placeholder="${esc(t("namesPh"))}">
      <label>${t("dateL")}</label><input id="inDate" placeholder="${esc(t("datePh"))}">
      <label>${t("intentMassL")}</label><select id="inMassId"><option value="">${esc(t("noMassL"))}</option>${massOpts.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join("")}</select>
      <div class="grid2"><div><label>${t("massL")}</label><input id="inMass" placeholder="${esc(t("massPh"))}"></div>
      <div><label>${t("placeL")}</label><input id="inPlace" placeholder="${esc(t("placePh"))}"></div></div>
      <label>${t("messageL")}</label><textarea id="inText" placeholder="${esc(t("intTextPh"))}"></textarea>
      <div class="btnRow"><button class="btn btnNavy" data-action="int-add">${t("publish")}</button></div>`
      : lockNote()}
    </section>

    ${pastoralHTML()}

    <section class="card" id="sec-boletines"><img class="artBanner" src="${ART.luminarias}" alt="Luminarias" loading="lazy"><h3>${t("bulTitle")}</h3><p class="sub">${t("bulSub")}</p>
      ${bOpen? `<button class="backLink" data-action="bulletin-back">${t("allBuls")}</button>
        <h3 class="serif">${esc(bOpen.title)}</h3><p class="small">${esc(bOpen.date)}${bOpen.cover?` · ${t("bulCover")}: ${esc(bOpen.cover)}`:""}</p>
        ${bOpen.pdf?`<div class="btnRow"><a class="btn btnNavy" href="${esc(bOpen.pdf)}" target="_blank" rel="noopener">${t("bulOpenPdf")}</a></div>`:""}
        ${(bOpen.sections||[]).map(s=>`<h4 style="margin:10px 0 2px">${esc(s.h)}</h4><p style="margin:0;line-height:1.6;font-size:14px">${esc(s.p)}</p>`).join("")}`
      : allBulletins().map(b=>{ const isExtra = state.bulletinsExtra.some(e=>e.id===b.id);
        return `<div class="eventRow"><div style="flex:1"><b>${esc(b.title)}</b>${b.pdf?` <span class="tag">📕 PDF</span>`:""}<div class="small">${esc(b.date)}</div></div>
        <button class="btn btnGhost" data-action="bulletin-open" data-id="${b.id}">${t("read")}</button>
        ${delOk(ED&&isExtra)?`<button class="btn btnGhost" data-action="bulletin-del" data-id="${b.id}">${t("delete")}</button>`:""}</div>`; }).join("")}
      ${ED?`<h4 style="margin:10px 0 2px">${t("pubBul")}</h4>
      <label>${t("npTitle")}</label><input id="bulTitle" placeholder="${esc(t("bulTitlePh"))}">
      <label>${t("messageL")}</label><textarea id="bulBody" placeholder="${esc(t("bulBodyPh"))}"></textarea>
      <label>${t("bulPdfL")}</label><div class="small">${t("bulPdfHint")}</div>
      <input type="file" id="bulFile" accept="application/pdf,.pdf">
      <input id="bulUrl" placeholder="${esc(t("bulUrlPh"))}" inputmode="url" autocomplete="off">
      <div class="btnRow"><button class="btn btnGhost" data-action="bulletin-add">${t("pubBul")}</button></div>`:`<p class="small">${t("readOnlyNote")}</p>`}
    </section>

        <section class="card" id="sec-documentos"><h3>${t("docTitle")}</h3><p class="sub">${t("docSub")}</p>
      ${(allDocuments().map(d=>`<div class="eventRow"><div style="flex:1"><b>${esc(d.title)}</b>${d.note?`<div class="small">${esc(d.note)}</div>`:""}<div class="small">${esc(d.date||"")}</div></div>
        <a class="btn btnNavy" href="${esc(d.url)}" target="_blank" rel="noopener">${t("docOpen")}</a>
        ${delOk(ED)?`<button class="btn btnGhost" data-action="doc-del" data-id="${d.id}">${t("delete")}</button>`:""}</div>`).join("")||`<p class="small">${t("docEmpty")}</p>`)}
      ${ED?`<h4 style="margin:10px 0 2px">${t("docTitle")}</h4>
      <label>${t("npTitle")}</label><input id="docTitle" placeholder="${esc(t("docTitle"))}">
      <label>${t("docNoteL")}</label><input id="docNote" placeholder="${esc(t("docNoteL"))}">
      <label>${t("docFileL")}</label><div class="small">${t("docHint")}</div>
      <input type="file" id="docFile" accept="application/pdf,image/*,.pdf,.doc,.docx">
      <input id="docUrl" placeholder="${esc(t("docUrlPh"))}" inputmode="url" autocomplete="off">
      <div class="btnRow"><button class="btn btnNavy" data-action="doc-add">${t("publish")}</button></div>`:`<p class="small">${t("readOnlyNote")}</p>`}
    </section>

    <section class="card" id="sec-noticias"><h3>${t("newsTitle")}</h3>
      <div class="chipRow">${newsCats.map(c=>`<button class="fchip ${state.newsFilter===c?"active":""}" data-action="news-filter" data-c="${c}">${c==="Todas"?t("allCats"):c}</button>`).join("")}</div>
      ${news.map(n=>`<div class="eventRow"><div style="flex:1"><span class="tag ${n.cat==="Iglesia"?"gold":n.cat==="País"?"green":""}">${esc(n.cat)}</span> <span class="small">· ${esc(n.date)}</span>
        <div><b>${esc(n.title)}</b></div><div class="small">${esc(n.body)}</div></div></div>`).join("") || `<p class="small">${t("noEvents")}</p>`}
      ${ED?`<h4 style="margin:10px 0 2px">${t("pubNews")}</h4>
      <div class="grid2"><div><label>${t("sectionL")}</label><select id="nwCat"><option>Diócesis</option><option>País</option><option>Iglesia</option></select></div>
      <div><label>${t("npTitle")}</label><input id="nwTitle" placeholder="${esc(t("nwTitlePh"))}"></div></div>
      <label>${t("messageL")}</label><textarea id="nwBody" placeholder="${esc(t("nwBodyPh"))}"></textarea>
      <div class="btnRow"><button class="btn btnGhost" data-action="news-add">${t("pubNews")}</button></div>`:`<p class="small">${t("readOnlyNote")}</p>`}
    </section>

    ${givingHTML()}

    <section class="card"><h3>${t("builderTitle")}</h3><p class="sub">${t("builderSub")}</p>
      <div class="btnRow"><button class="btn btnNavy" data-action="builder-open">${t("customizeHome")}</button>
      <button class="btn btnGhost" data-action="builder-reset">${t("reset")}</button></div></section>
    <div class="notice">${t("demoAffil")}</div>`;
  renderCommunity();
}

function renderParishSheet(){
  $("#parishList").innerHTML = PARISHES.map(p=>`
    <div class="optRow ${p.id===state.parishId?"sel":""}" data-action="parish-pick" data-id="${p.id}">
      <div class="churchMark" style="background:${p.accent};color:#fff">✠</div>
      <div><b>${esc(p.name)}</b><div class="small">${esc(p.city)}${p.priest?` · ${esc(p.priest)}`:""}</div></div>
      ${p.id===state.parishId?'<span style="margin-left:auto">✓</span>':""}
    </div>`).join("");
}
function renderBuilderSheet(){
  const names = { hero:"🖼️ Portada (foto)", actions:"☰", inspire:"✦", events:"📅", bulletin:"📄", giving:"💛" };
  $("#builderList").innerHTML = state.order.map((id,idx)=>`
    <div class="optRow"><div><b>${names[id]} ${id}</b><div class="small">${state.modules[id]!==false?"✓":"—"}</div></div>
      <span style="margin-left:auto;display:flex;gap:4px;align-items:center">
        <button class="btn btnGhost" data-action="builder-move" data-mod="${id}" data-dir="-1" ${idx===0?"disabled":""}>↑</button>
        <button class="btn btnGhost" data-action="builder-move" data-mod="${id}" data-dir="1" ${idx===state.order.length-1?"disabled":""}>↓</button>
        <button class="toggle" role="switch" aria-checked="${state.modules[id]!==false}" data-action="builder-toggle" data-mod="${id}" aria-label="toggle ${id}"></button>
      </span></div>`).join("");
}
function renderFontSheet(){
  $("#fontSheetTitle").textContent = t("fontT");
  $("#fontSheetSub").textContent = t("fontSub");
  const opts = [[1,"fontN","A"],[1.15,"fontL","A+"],[1.3,"fontXL","A++"]];
  $("#fontList").innerHTML = opts.map(([s,k,a])=>`<div class="optRow ${state.fontScale===s?"sel":""}" data-action="font-set" data-s="${s}"><div><b>${a} · ${esc(t(k))}</b></div>${state.fontScale===s?'<span style="margin-left:auto">✓</span>':""}</div>`).join("");
}
function renderLangSheet(){
  $("#langList").innerHTML = LANGS.map(l=>`
    <div class="optRow ${l.id===state.lang?"sel":""}" data-action="lang-pick" data-l="${l.id}">
      <div><b>${esc(l.native)}</b> <span class="small">· ${esc(l.name)}</span></div>
      ${l.id===state.lang?'<span style="margin-left:auto">✓</span>':""}
    </div>`).join("");
}

// ---------- eventos ----------
document.addEventListener("error", e=>{
  const t = e.target;
  if(t && t.tagName === "IMG" && (t.classList.contains("saintImg") || (t.closest && (t.closest(".saintCard") || t.closest(".saintToday"))))){
    const d = document.createElement("div");
    d.className = "avatar";
    d.textContent = (t.alt || "?").slice(0, 1);
    t.replaceWith(d);
  }
}, true);
document.addEventListener("click", e=>{
  const chk = e.target.closest("[data-action-check]");
  if(chk){
    const k = chk.dataset.actionCheck;
    if(k==="rosary-autoadv"){ state.rosaryAuto = chk.checked; if(chk.checked) goStep("rosary", state.rosaryStep); else stopSpeak(); }
    if(k==="chaplet-autoadv"){ state.chapletAuto = chk.checked; if(chk.checked) goStep("chaplet", state.chapletStep); else stopSpeak(); }
    return;
  }
  const el = e.target.closest("[data-action]");
  if(!el) return;
  const a = el.dataset.action;
  const val = (id) => $(id)?.value.trim() || "";
  if(a==="tab"){ stopSpeak(); state.tab = el.dataset.tab; render(); window.scrollTo({top:0}); }
  else if(a==="jump"){ $("#"+el.dataset.to)?.scrollIntoView({behavior:"smooth"}); }
  else if(a==="more-focus"){ stopSpeak(); state.tab="more"; render(); setTimeout(()=>{ $("#"+el.dataset.focus)?.scrollIntoView({behavior:"smooth"}); },80); }
  else if(a==="pray-mode"){ stopSpeak(); state.prayMode = el.dataset.mode; state.tab="pray"; state.prayerOpen=null; render(); window.scrollTo({top:0}); }
  else if(a==="parish-open"){ renderParishSheet(); openSheet("parishSheet"); }
  else if(a==="parish-pick"){ state.parishId = el.dataset.id; store.set("parish.id", state.parishId); closeSheets(); Sync.refresh(); render(); }
  else if(a==="font-open"){ renderFontSheet(); openSheet("fontSheet"); }
  else if(a==="font-set"){ state.fontScale = +el.dataset.s || 1; store.set("a11y.font", state.fontScale); renderFontSheet(); applyFont(); }
  else if(a==="lang-open"){ renderLangSheet(); openSheet("langSheet"); }
  else if(a==="lang-set"){ state.lang = el.dataset.l; setLang(state.lang); store.set("app.lang", state.lang); renderMore(); render(); }
  else if(a==="lang-pick"){ state.lang = el.dataset.l; setLang(state.lang); store.set("app.lang", state.lang); closeSheets(); render(); }
  else if(a==="sheet-close"){ closeSheets(); }
  else if(a==="ext"){ window.open(el.dataset.url, "_blank", "noopener"); }
  else if(a==="reading-move"){ stopSpeak(); state.readingDate = clampReadingDate(el.dataset.iso); renderReadings(); }
  else if(a==="reading-today"){ stopSpeak(); state.readingDate = toISO(new Date()); renderReadings(); }
  else if(a==="home-readings"){ stopSpeak(); state.readingDate = toISO(new Date()); state.tab="readings"; render(); window.scrollTo({top:0}); }
  else if(a==="home-saint"){ stopSpeak(); state.saintDate = toISO(new Date()); state.prayMode="santos"; state.tab="pray"; render(); window.scrollTo({top:0}); }
  else if(a==="usccb-load"){ loadUsccbDay(); }
  else if(a==="usccb-listen"){ speakUsccb(); }
  else if(a==="saint-pray"){ speak(saintPrayerText(el.dataset.name||"", getLang())); if(state.tab==="readings") renderReadings(); }
  else if(a==="font-inc"){ state.readingFont = Math.min(24, (state.readingFont||17)+1); store.set("readings.font", state.readingFont); renderReadings(); }
  else if(a==="font-dec"){ state.readingFont = Math.max(14, (state.readingFont||17)-1); store.set("readings.font", state.readingFont); renderReadings(); }
  else if(a==="read-aloud"){ const wdi = new Date(state.readingDate+"T12:00:00").getDay(); const w0 = getLang()==="en"?WEEK_EN[WEEK[wdi].key]:WEEK[wdi]; speak(w0.reflectionTitle+". "+w0.reflection); renderReadings(); }
  else if(a==="mass-readings"){ stopSpeak(); state.readingDate = nextDateForDayKey(el.dataset.day); state.tab="readings"; render(); window.scrollTo({top:0}); }
  else if(a==="pray-aloud"){ const pr=ALL_PRAYERS().find(p=>p.id===el.dataset.id); if(pr) speak(pr.name+". "+(prayerText(pr.id)||pr.text)); }
  else if(a==="stop-voice"){ state.rosaryAuto=false; state.chapletAuto=false; stopSpeak(); renderPray(); renderReadings(); }
  else if(a==="saint-move"){ stopSpeak(); state.saintDate = clampSaintDate(el.dataset.iso); renderPray(); }
  else if(a==="saint-today"){ stopSpeak(); state.saintDate = toISO(new Date()); renderPray(); }
  else if(a==="prayer-open"){ state.prayMode="oraciones"; state.prayerOpen = el.dataset.id; renderPray(); }
  else if(a==="chapel-prayer-open"){ stopSpeak(); state.prayMode="oraciones"; state.prayerOpen="oracion-capilla"; state.tab="pray"; render(); window.scrollTo({top:0}); }
  else if(a==="prayer-back"){ stopSpeak(); state.prayerOpen = null; renderPray(); }
  else if(a==="prayer-cat"){ state.prayerCat = el.dataset.cat; state.prayerOpen=null; renderPray(); }
  else if(a==="prayer-fav"){ const id=el.dataset.id; const i=state.prayerFavs.indexOf(id);
    if(i>=0) state.prayerFavs.splice(i,1); else state.prayerFavs.push(id);
    store.set("prayer.favs", state.prayerFavs); renderPray(); }
  else if(a==="custom-prayer-add"){ const t2=val("#npTitle"), x=val("#npText"); if(!t2||!x) return;
    state.customPrayers.unshift({id:"c"+Date.now(), name:t2, category:"Mías", text:x}); store.set("prayers.custom", state.customPrayers); renderPray(); }
  else if(a==="custom-prayer-del"){ state.customPrayers = state.customPrayers.filter(p=>p.id!==el.dataset.id);
    state.prayerFavs = state.prayerFavs.filter(f=>f!==el.dataset.id);
    store.set("prayers.custom", state.customPrayers); store.set("prayer.favs", state.prayerFavs); renderPray(); }
  else if(a==="rosary-set"){ stopSpeak(); state.rosarySet=el.dataset.set; state.rosaryStep=0; renderPray(); }
  else if(a==="rosary-go"){ goStep("rosary", +el.dataset.i); }
  else if(a==="rosary-auto"){ state.rosaryAuto=!state.rosaryAuto; if(state.rosaryAuto) goStep("rosary", state.rosaryStep); else { stopSpeak(); renderPray(); } }
  else if(a==="rosary-reset"){ state.rosaryAuto=false; stopSpeak(); state.rosaryStep=0; renderPray(); }
  else if(a==="chaplet-go"){ goStep("chaplet", +el.dataset.i); }
  else if(a==="chaplet-auto"){ state.chapletAuto=!state.chapletAuto; if(state.chapletAuto) goStep("chaplet", state.chapletStep); else { stopSpeak(); renderPray(); } }
  else if(a==="chaplet-reset"){ state.chapletAuto=false; stopSpeak(); state.chapletStep=0; renderPray(); }
  else if(a==="canto-play"){ const c=ALL_CANTOS().find(x=>x.id===el.dataset.id); if(c&&c.notes) playNotes(c.notes); }
  else if(a==="canto-sing"){ const c=ALL_CANTOS().find(x=>x.id===el.dataset.id); if(c) speak(c.title+". "+c.lyrics); }
  else if(a==="canto-add"){ if(!canEdit()) return; const t2=val("#ctTitle"), x=val("#ctLyrics"); if(!t2||!x) return;
    const rec={id:"x"+Date.now(), title:t2, origin:"Parroquia", lyrics:x, notes:null};
    if(pubBoth(8, rec, renderMore)) return;
    state.cantosExtra.unshift({...rec, mine:true});
    store.set("cantos.extra", state.cantosExtra); renderMore(); }
  else if(a==="canto-del"){ if(!canEdit()) return;
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(8, el.dataset.id), renderMore); }
    state.cantosExtra=state.cantosExtra.filter(c=>c.id!==el.dataset.id); store.set("cantos.extra", state.cantosExtra); renderMore(); }
  else if(a==="stream-save"){ if(!canEdit()) return; const id=ytId(val("#streamUrl")); if(!id) return;
    const rec={id:"stream", yt:id, label:val("#streamUrl")};
    if(pubBoth(13, rec, renderMore)) { state.stream={yt:id, label:val("#streamUrl")}; return; }
    state.stream={yt:id, label:val("#streamUrl")}; store.set("media.stream", state.stream); renderMore(); }
  else if(a==="stream-clear"){ if(!canEdit()) return;
    if(Sync.online){ srvOp(Sync.push(13, {id:"stream", yt:"", label:""}), renderMore); state.stream={yt:"", label:""}; return; }
    state.stream={yt:"", label:""}; store.set("media.stream", state.stream); renderMore(); }
  else if(a==="pp-add"){ if(!canEdit()) return; const t2=val("#ppTitle"), x=val("#ppText"); if(!t2||!x) return;
    const rec={id:"p"+Date.now(), name:t2, category:$("#ppCat")?.value||"Diaria", latin:null, text:x};
    if(pubBoth(7, rec, renderPray)) return;
    state.parishPrayers.unshift({...rec});
    store.set("prayers.parish", state.parishPrayers); renderPray(); }
  else if(a==="pp-bulk"){ if(!canEdit()) return; const cat=$("#ppCat")?.value||"Diaria";
    const lines=val("#ppBulk").split("\n").map(l=>l.trim()).filter(Boolean);
    const recs=[]; let n=0;
    for(const l of lines){ const m=l.split("::"); if(m.length<2||!m[0].trim()||!m[1].trim()) continue;
      recs.push({id:"p"+Date.now()+n, name:m[0].trim(), category:cat, latin:null, text:m.slice(1).join("::").trim()}); n++; }
    if(!recs.length){ renderPray(); return; }
    if(Sync.online){ srvOp((async()=>{ for(const r of recs) await Sync.push(7, r); })(), renderPray); return; }
    for(const r of recs) state.parishPrayers.unshift(r);
    if(n){ store.set("prayers.parish", state.parishPrayers); } renderPray(); }
  else if(a==="pp-del"){ if(!canEdit()) return;
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(7, el.dataset.id), renderPray); }
    state.parishPrayers=state.parishPrayers.filter(p=>p.id!==el.dataset.id); store.set("prayers.parish", state.parishPrayers); renderPray(); }
  else if(a==="fam-prayed"){ const today=toISO(new Date());
    if(!state.famPrayed.includes(today)){ state.famPrayed.push(today); store.set("fam.prayed", state.famPrayed); } renderPray(); }
  else if(a==="video-add"){ if(!canEdit()) return; const t2=val("#vdTitle"), u=val("#vdUrl"); const id=ytId(u); if(!t2||!id) return;
    const rec={id:"v"+Date.now(), title:t2, yt:id};
    if(pubBoth(9, rec, renderMore)) return;
    state.videosExtra.unshift({...rec}); store.set("videos.extra", state.videosExtra); renderMore(); }
  else if(a==="video-del"){ if(!canEdit()) return;
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(9, el.dataset.id), renderMore); }
    state.videosExtra=state.videosExtra.filter(v=>v.id!==el.dataset.id); store.set("videos.extra", state.videosExtra); renderMore(); }
  else if(a==="cal-view"){ state.calView=el.dataset.v; renderCalendar(); }
  else if(a==="cal-day"){ state.calSel = el.dataset.iso; renderCalendar(); }
  else if(a==="cal-dayjump"){ state.calSel = el.dataset.iso; state.calView="dia"; renderCalendar(); window.scrollTo({top:0}); }
  else if(a==="cal-filter"){ state.calFilter = el.dataset.cat; renderCalendar(); }
  else if(a==="cal-move"){ state.calCursor = new Date(state.calCursor.getFullYear(), state.calCursor.getMonth()+ (+el.dataset.dir), 1); renderCalendar(); }
  else if(a==="cal-weekmove"){ const d=new Date(state.calSel+"T12:00:00"); d.setDate(d.getDate()+7*(+el.dataset.dir)); state.calSel=toISO(d); renderCalendar(); }
  else if(a==="cal-daymove"){ const d=new Date(state.calSel+"T12:00:00"); d.setDate(d.getDate()+(+el.dataset.dir)); state.calSel=toISO(d); renderCalendar(); }
  else if(a==="cal-today"){ state.calCursor = startMonth(new Date()); state.calSel = toISO(new Date()); renderCalendar(); }
  else if(a==="ics"){ const ev = allEvents().find(x=>x.id===el.dataset.id); if(ev) downloadICS(ev); }
  else if(a==="rem-toggle"){ const id=el.dataset.id; const i=state.reminders.indexOf(id);
    if(i>=0) state.reminders.splice(i,1); else state.reminders.push(id);
    store.set("reminders", state.reminders); renderHome(); renderCalendar(); }
  else if(a==="support-open"){ state._supportOpen = state._supportOpen===el.dataset.id? null : el.dataset.id; renderCalendar(); }
  else if(a==="support-vol"){ const id=el.dataset.id; const s=state.support[id]||{vol:0,monto:0}; s.vol++;
    state.support[id]=s; store.set("support", state.support); state._supportOpen=null; renderCalendar(); }
  else if(a==="support-give"){ const id=el.dataset.id; const s=state.support[id]||{vol:0,monto:0}; s.monto+=+el.dataset.amt;
    state.support[id]=s; store.set("support", state.support); state._supportOpen=null; renderCalendar(); }
  else if(a==="register"){ const n=val("#regName"); if(!n) return; state.userName=n; store.set("user.name", n); renderMore(); renderHome(); }
  else if(a==="logout"){ state.userName=""; store.set("user.name", ""); renderMore(); renderHome(); }
  else if(a==="muro-add"){ const t2=val("#muroText"); if(!t2) return; const k=$("#muroKind")?.value||t("kind_greet");
    const rec={id:"w"+Date.now(), name:state.userName||"Feligresía", kind:k, text:t2, when:""};
    if(pubBoth(12, rec, renderMore)) return;
    state.muroExtra.unshift({...rec, mine:true});
    store.set("muro.extra", state.muroExtra); renderMore(); }
  else if(a==="int-filter"){ state.intencionFilter=el.dataset.t; renderMore(); }
  else if(a==="int-add"){ if(!canEdit()) return; const ty=$("#inType")?.value||"Cumpleaños", n=val("#inNames"), d=val("#inDate")||"—", t2=val("#inText");
    if(!n||!t2) return; const rec={id:"i"+Date.now(), type:ty, names:n, date:d, massId:$("#inMassId")?.value||"", mass:val("#inMass"), place:val("#inPlace"), text:t2};
    if(pubBoth(3, rec, ()=>{ renderMore(); renderHome(); })) return;
    state.intencionesExtra.unshift({...rec, mine:true});
    store.set("intenciones.extra", state.intencionesExtra); renderMore(); renderHome(); }
  else if(a==="int-del"){ const it=allIntenciones().find(i=>i.id===el.dataset.id); if(!it) return; if(!(canEdit()||it.mine)) return;
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(3, el.dataset.id), ()=>{ renderMore(); renderHome(); }); }
    state.intencionesExtra=state.intencionesExtra.filter(i=>i.id!==el.dataset.id);
    if(canEdit()&&!it.mine&&!state.intencionesHidden.includes(el.dataset.id)){ state.intencionesHidden.push(el.dataset.id); store.set("intenciones.hidden", state.intencionesHidden); }
    store.set("intenciones.extra", state.intencionesExtra); renderMore(); }
  else if(a==="int-greet"){ const it=allIntenciones().find(i=>i.id===el.dataset.id); if(!it) return;
    const msg = (it.type==="Defunciones"||it.type==="Exequias") ? `Nos unimos en oración.` : `¡Felicidades! 🎉`;
    const rec={id:"w"+Date.now(), name:state.userName||"Feligresía", kind:t("kind_greet"), text:`${msg} ${it.names}`, when:""};
    if(pubBoth(12, rec, ()=>{ state.tab="community"; render(); setTimeout(()=>$("#sec-muro")?.scrollIntoView({behavior:"smooth"}),80); })) return;
    state.muroExtra.unshift({...rec, mine:true});
    store.set("muro.extra", state.muroExtra); state.tab="community"; render(); setTimeout(()=>$("#sec-muro")?.scrollIntoView({behavior:"smooth"}),80); }
  else if(a==="dir-form"){ if(!canEdit()) return; state.dirForm=true; state.editingId=null; renderMore(); }
  else if(a==="dir-cancel"){ state.dirForm=false; state.editingId=null; renderMore(); }
  else if(a==="dir-edit"){ if(!canEdit()) return; state.editingId=el.dataset.id; state.dirForm=true; state.tab="community"; render(); setTimeout(()=>$("#sec-directorio")?.scrollIntoView({behavior:"smooth"}),60); }
  else if(a==="dir-del"){ if(!canEdit()) return; const it=dirAll().find(m=>m.id===el.dataset.id);
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(4, el.dataset.id), ()=>{ renderMore(); renderHome(); }); }
    state.directoryExtra=state.directoryExtra.filter(m=>m.id!==el.dataset.id);
    if(it&&!it.mine&&!state.directoryHidden.includes(el.dataset.id)){ state.directoryHidden.push(el.dataset.id); store.set("directory.hidden", state.directoryHidden); }
    store.set("directory.extra", state.directoryExtra); renderMore(); renderHome(); }
  else if(a==="dir-save"){ if(!canEdit()) return;
    const fam=val("#dmFam"); if(!fam) return;
    const bdays = val("#dmBdays").split("\n").map(l=>{ const m=l.match(/(.+?),\s*(\d{1,2}\D\d{1,2})/); if(!m) return null; const md=normMD(m[2]); return md?{name:m[1].trim(), md}:null; }).filter(Boolean);
    const couple=val("#dmCouple"), annMd=normMD(val("#dmAnniv"));
    const groups=[...document.querySelectorAll("[data-dmgroup]:checked")].map(x=>x.dataset.dmgroup);
    const members=val("#dmMembers").split("\n").map(l=>{ const t2=l.trim(); if(!t2) return null;
      const mm=t2.match(/^(.*?)\s*\(([a-z0-9]+)\)\s*$/);
      if(mm && GROUPS.some(g=>g.id===mm[2])) return {name:mm[1].trim(), group:mm[2]};
      return {name:t2}; }).filter(Boolean);
    const rec = {id: state.editingId||"d"+Date.now(), family:fam, contact:val("#dmContact"), phone:val("#dmPhone"), email:val("#dmEmail"), address:val("#dmAddr"), clergy:$("#dmClergy")?.value||null, homebound:!!$("#dmHome")?.checked, groups, members, birthdays:bdays, anniversary:(couple&&annMd)?{couple, md:annMd}:null, notes:val("#dmNotes")};
    if(pubBoth(4, rec, ()=>{ state.dirForm=false; state.editingId=null; renderMore(); renderHome(); })){ state.dirForm=false; state.editingId=null; return; }
    if(state.editingId){ const i=state.directoryExtra.findIndex(m=>m.id===state.editingId); if(i>=0) state.directoryExtra[i]={...rec, mine:true}; else state.directoryExtra.unshift({...rec, mine:true}); }
    else state.directoryExtra.unshift({...rec, mine:true});
    store.set("directory.extra", state.directoryExtra);
    state.dirForm=false; state.editingId=null; state._officeSent=false; renderMore(); renderHome();
  }

  else if(a==="horizon-set"){ state.alertHorizon=+el.dataset.n; store.set("alerts.horizon", state.alertHorizon); state._officeSent=false; renderMore(); }
  else if(a==="alert-done"){ const y=new Date().getFullYear(); state.alertsDone[`${el.dataset.mid}|${el.dataset.md}|${y}`]=1;
    store.set("alerts.done", state.alertsDone); renderMore(); renderHome(); }
  else if(a==="notify-office"){
    const al = collectAlerts(state.alertHorizon);
    const lines = al.map(x=>`• ${x.name} — ${(x.type==="bday"?t("bdayTag"):t("wedTag"))} ${x.date.toLocaleString(localeOf(),{day:"numeric",month:"long"})} (${x.family})`);
    const rec={id:"m"+Date.now(), from:state.userName||"Feligresía", time:"", channel:"Oficina", title:`${t("upcomingT")} · ${state.alertHorizon} ${t("daysL")}`, body: lines.length?lines.join("\n"):"—"};
    if(pubBoth(2, rec, ()=>{ store.set("msgs.unread", true); state._officeSent=true; renderMore(); })) return;
    state.messagesExtra.unshift(rec);
    store.set("messages.extra", state.messagesExtra); store.set("msgs.unread", true);
    state._officeSent=true; renderMore();
  }
  else if(a==="alerts-enable"){
    const done = ()=>{ store.set("alerts.auto", true); state._officeSent=false; renderMore(); fireAutoAlert(); };
    try{
      if("Notification" in window && Notification.permission==="granted") done();
      else if("Notification" in window) Notification.requestPermission().then(p=>{ if(p==="granted") done(); });
    }catch{}
  }
  else if(a==="bulletin-open"){ state.bulletinOpen = el.dataset.id; renderMore(); }
  else if(a==="bulletin-back"){ state.bulletinOpen = null; renderMore(); }
  else if(a==="bulletin-add"){ if(!canEdit()) return; const t2=val("#bulTitle"), x=val("#bulBody");
    const f=$("#bulFile")?.files?.[0]; let u=val("#bulUrl"); if(!t2||(!x&&!f&&!u)) return;
    (async()=>{ el.disabled=true; const old=el.textContent; el.textContent=t("bulUploading");
      try{
        if(f){ const r=await root.uploadPlugin(f); if(r&&r.url) u=r.url; else throw new Error("upload"); }
        const rec={id:"b"+Date.now(), title:t2, date:new Date().toLocaleDateString(), cover:"", sections:x?[{h:"",p:x}]:[], pdf:u||""};
        el.disabled=false; el.textContent=old;
        if(Sync.online){ srvOp(Sync.push(0, rec), ()=>{ renderMore(); renderHome(); }); return; }
        state.bulletinsExtra.unshift(rec);
        store.set("bulletins.extra", state.bulletinsExtra); renderMore(); renderHome();
      }catch(err){ el.disabled=false; el.textContent=old; alert(t("bulUploadFail")); } })(); }
  else if(a==="bulletin-del"){ if(!canEdit()) return;
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(0, el.dataset.id), ()=>{ renderMore(); renderHome(); }); }
    state.bulletinsExtra=state.bulletinsExtra.filter(b=>b.id!==el.dataset.id);
    if(state.bulletinOpen===el.dataset.id) state.bulletinOpen=null;
    store.set("bulletins.extra", state.bulletinsExtra); renderMore(); renderHome(); }
  else if(a==="doc-add"){ if(!canEdit()) return; const t2=val("#docTitle");
    const f=$("#docFile")?.files?.[0]; let u=val("#docUrl"); if(!t2||(!f&&!u)) return;
    (async()=>{ el.disabled=true; const old=el.textContent; el.textContent=t("docUploading");
      try{
        if(f){ const r=await root.uploadPlugin(f); if(r&&r.url) u=r.url; else throw new Error("upload"); }
        const rec={id:"d"+Date.now(), title:t2, note:val("#docNote"), date:new Date().toLocaleDateString(), url:u};
        el.disabled=false; el.textContent=old;
        if(Sync.online){ srvOp(Sync.push(1, rec), renderMore); return; }
        state.documentsExtra.unshift(rec);
        store.set("documents.extra", state.documentsExtra); renderMore();
      }catch(err){ el.disabled=false; el.textContent=old; alert(t("docFail")); } })(); }
  else if(a==="doc-del"){ if(!canEdit()) return;
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(1, el.dataset.id), renderMore); }
    state.documentsExtra=state.documentsExtra.filter(d=>d.id!==el.dataset.id);
    store.set("documents.extra", state.documentsExtra); renderMore(); }
  else if(a==="group-cat"){ state.groupCat=el.dataset.c; renderMore(); }
  else if(a==="group-members"){ state.groupOpen = state.groupOpen===el.dataset.id?null:el.dataset.id; renderMore(); }
  else if(a==="group-join"){ const id=el.dataset.id; const g=GROUPS.find(x=>x.id===id); if(g&&!g.open&&!state.joinedGroups.includes(id)) return;
    const i=state.joinedGroups.indexOf(id);
    if(i>=0) state.joinedGroups.splice(i,1); else state.joinedGroups.push(id);
    store.set("groups.joined", state.joinedGroups); renderMore(); }
  else if(a==="group-event-add"){ if(!canEdit()) return; const gsel=$("#geGroup")?.value; const t2=val("#geTitle"); if(!gsel||!t2) return;    const g=GROUPS.find(x=>x.id===gsel);
    state.customEvents.unshift({id:"g"+Date.now(), title:t2, day:$("#geDay")?.value||"sun", time:val("#geTime")||"—", category:"Comunidad", location:val("#gePlace")||"", desc:"", recurring:"Del grupo", group:g?g.name:""});
    store.set("events.custom", state.customEvents); renderMore(); renderCalendar(); renderHome(); }
  else if(a==="celeb-add"){ if(!canEdit()) return; const ti=val("#cbTitle"), dt=$("#cbDate")?.value||"";
    if(!ti||!/^\d{4}-\d{2}-\d{2}$/.test(dt)) return;
    const dd=new Date(dt+"T12:00:00"); const dk=["sun","mon","tue","wed","thu","fri","sat"][dd.getDay()];
    state.datedEvents.unshift({id:"d"+Date.now(), title:ti, day:dk, date:dt, time:val("#cbTime")||"—", category:$("#cbCat")?.value||"Sacramentos", location:val("#cbPlace")||"", cel:val("#cbCel")||"", desc:val("#cbDesc")||"", recurring:"Única"});
    store.set("events.dated", state.datedEvents); renderCalendar(); renderHome(); }
  else if(a==="celeb-del"){ if(!canEdit()) return; const id=el.dataset.id;
    state.datedEvents=state.datedEvents.filter(e=>e.id!==id); store.set("events.dated", state.datedEvents);
    if(!state.datedHidden.includes(id)){ state.datedHidden.push(id); store.set("events.datedHidden", state.datedHidden); }
    renderCalendar(); renderHome(); }
  else if(a==="ministry-mass"){ state.ministryMass=el.dataset.m; renderMore(); }
  else if(a==="ministry-goto"){ const m=el.dataset.m; if(m && state.ministry[m]) state.ministryMass=m; stopSpeak(); state.tab="community"; render(); setTimeout(()=>{ $("#sec-ministerios")?.scrollIntoView({behavior:"smooth"}); },80); }
  else if(a==="admin-login"){ if(Sync.online){ const pw=(val("#admSrvPass")||""); if(!pw) return;
      (async()=>{ try{ const ok=await Sync.auth(pw); state._admMsg = ok ? "" : t("srvDenied"); }catch(e){ state._admMsg = t("srvFail"); } renderMore(); })(); return; }
    const pin=(val("#admPin")||"").trim();
    if(pin && pin===store.get("admin.pin","1234")){ state.admin=true; store.set("admin.auth", true); state._admMsg=""; }
    else state._admMsg=t("wrongPin"); renderMore(); }
  else if(a==="admin-logout"){ Sync.logout(); state.admin=false; store.set("admin.auth", false); state._admMsg=""; renderMore(); }
  else if(a==="gate-mode"){ state.gateMode = el.dataset.m || "invite"; state._gateMsg = ""; renderGate(); }
  else if(a==="gate-redeem"){
    const n = val("#gateName"), c = normCode($("#gateCode")?.value);
    const p1 = $("#gatePw1")?.value || "", p2 = $("#gatePw2")?.value || "";
    if(!n || !c || !p1 || !p2){ state._gateMsg = t("gateNeedAll"); renderGate(); return; }
    if(p1.length < 6){ state._gateMsg = t("pwShort"); renderGate(); return; }
    if(p1 !== p2){ state._gateMsg = t("pwMismatch"); renderGate(); return; }
    if(!Sync.online || !Sync._configReady){ state._gateMsg = Sync.online ? t("gateWait") : t("gateWaitNet"); renderGate(); return; }
    (async()=>{ el.disabled = true;
      try{
        const rec = Sync.coll("users").find(u => String(u.name || "").toLowerCase() === n.toLowerCase());
        if(!rec || rec.pass) throw new Error("code");
        const salt = newSalt(), pass = await hashPw(salt, p1), chk = await sha256hex(salt + "::" + p1);
        await Sync.account({ op: "setpass", id: rec.id, code: c, salt, pass, chk });
        state.userName = rec.name; store.set("user.name", rec.name);
        state.inviteOk = true; store.set("invite.ok", true); store.set("account.session", rec.name);
        state._gateMsg = "";
        try{ Sync.push(12, { id: "w" + Date.now(), name: rec.name, kind: "🚪", text: t("gateJoined"), when: "" }).catch(()=>{}); }catch{}
        render();
      }catch(err){ el.disabled = false; state._gateMsg = String((err && err.message) || err).includes("code") ? t("gateBadCode") : String((err && err.message) || err); renderGate(); } })(); }
  else if(a==="gate-login"){
    const n = val("#gateName"), pw = $("#gatePwLogin")?.value || "";
    if(!n || !pw){ state._gateMsg = t("gateNeedAll"); renderGate(); return; }
    if(!Sync.online || !Sync._configReady){ state._gateMsg = Sync.online ? t("gateWait") : t("gateWaitNet"); renderGate(); return; }
    (async()=>{ el.disabled = true;
      try{
        const rec = Sync.coll("users").find(u => String(u.name || "").toLowerCase() === n.toLowerCase());
        if(!rec || !rec.pass) throw new Error("nouser");
        const h = await hashPw(rec.salt || "", pw);
        if(h !== rec.pass) throw new Error("badpw");
        state.userName = rec.name; store.set("user.name", rec.name);
        state.inviteOk = true; store.set("invite.ok", true); store.set("account.session", rec.name);
        state._gateMsg = ""; render();
      }catch(err){ el.disabled = false; const m = String((err && err.message) || err);
        state._gateMsg = m.includes("badpw") ? t("gateBadPw") : t("gateNoUser"); renderGate(); } })(); }
  else if(a==="gate-admin"){
    const n = val("#gateName"), pw = $("#gateAdmPw")?.value || "";
    if(!n || !pw){ state._gateMsg = t("gateNeedAll"); renderGate(); return; }
    if(Sync.online){
      (async()=>{ try{ const ok = await Sync.auth(pw);
          if(ok){ state.userName = n; store.set("user.name", n); state.inviteOk = true; store.set("invite.ok", true);
            const rec = Sync.coll("users").find(u => String(u.name || "").toLowerCase() === n.toLowerCase());
            if(rec && rec.pass) store.set("account.session", rec.name);
            state._gateMsg = ""; render();
          } else { state._gateMsg = t("srvDenied"); renderGate(); }
        }catch(e){ state._gateMsg = t("srvFail"); renderGate(); } })(); return; }
    if(pw === store.get("admin.pin", "1234")){ state.admin = true; store.set("admin.auth", true);
      state.userName = n; store.set("user.name", n); state.inviteOk = true; store.set("invite.ok", true); state._gateMsg = ""; render(); return; }
    state._gateMsg = t("wrongPin"); renderGate(); }
  else if(a==="acc-logout"){ state.inviteOk = false; store.set("invite.ok", false); store.set("account.session", "");
    state.userName = ""; store.set("user.name", ""); state._chpwMsg = "";
    Sync.logout(); state.admin = false; store.set("admin.auth", false); state._gateMsg = ""; render(); }
  else if(a==="guest-exit"){ state.inviteOk = false; store.set("invite.ok", false); store.set("account.session", "");
    state.userName = ""; store.set("user.name", ""); state._gateMsg = ""; render(); }
  else if(a==="chpw-save"){
    const cur = $("#chPwCur")?.value || "", nw = $("#chPwNew")?.value || "";
    if(!cur || !nw){ state._chpwMsg = t("gateNeedAll"); renderCommunity(); return; }
    if(nw.length < 6){ state._chpwMsg = t("pwShort"); renderCommunity(); return; }
    if(!Sync.online){ state._chpwMsg = t("gateWaitNet"); renderCommunity(); return; }
    const me = myAccount();
    if(!me || !me.pass){ state._chpwMsg = t("gateNoUser"); renderCommunity(); return; }
    (async()=>{ el.disabled = true;
      try{
        const salt = newSalt(), pass = await hashPw(salt, nw), chk = await sha256hex(salt + "::" + nw);
        await Sync.account({ op: "passwd", id: me.id, oldpw: cur, salt, pass, chk });
        state._chpwMsg = t("pwOk");
      }catch(err){ state._chpwMsg = String((err && err.message) || err).includes("denied") ? t("pwBadCur") : String((err && err.message) || err); }
      el.disabled = false; renderCommunity(); })(); }
  else if(a==="acc-create"){
    if(!isFullAdmin()) return;
    const n = val("#accName"), contact = val("#accContact"), role = $("#accRole")?.value || "member";
    if(!n || !contact){ state._accMsg = t("gateNeedAll"); renderMore(); return; }
    if(!/^(member|editor|admin)$/.test(role)) return;
    if(!Sync.online){ state._accMsg = t("gateWaitNet"); renderMore(); return; }
    if(Sync.coll("users").some(u => String(u.name || "").toLowerCase() === n.toLowerCase())){ state._accMsg = t("accDup"); renderMore(); return; }
    (async()=>{ el.disabled = true;
      try{
        const id = "u" + Date.now(), code = newCode(), codeH = await sha256hex(code);
        await Sync.account({ op: "create", id, name: n, contact, role, codeH });
        state._codes[id] = { name: n, contact, code };
        state._accMsg = t("accCreated");
      }catch(err){ state._accMsg = String((err && err.message) || err).includes("dup") ? t("accDup") : String((err && err.message) || err); }
      el.disabled = false; renderMore(); })(); }
  else if(a==="acc-role"){
    if(!isFullAdmin()) return;
    const id = el.dataset.id, r = el.dataset.r;
    if(!/^(member|editor|admin)$/.test(r)) return;
    const u = Sync.coll("users").find(x => x.id === id); if(!u) return;
    if(String(u.name || "").toLowerCase() === (state.userName || "").toLowerCase()){ renderMore(); return; }
    if(!Sync.online){ state._accMsg = t("gateWaitNet"); renderMore(); return; }
    (async()=>{ try{ await Sync.account({ op: "setrole", id, role: r }); state._accMsg = t("accRoleSaved"); }
      catch(err){ state._accMsg = String((err && err.message) || err); } renderMore(); })(); }
  else if(a==="acc-reset"){
    if(!isFullAdmin()) return;
    const id = el.dataset.id;
    const u = Sync.coll("users").find(x => x.id === id); if(!u) return;
    if(!Sync.online){ state._accMsg = t("gateWaitNet"); renderMore(); return; }
    (async()=>{ try{
        const code = newCode(), codeH = await sha256hex(code);
        await Sync.account({ op: "reset", id, codeH });
        state._codes[id] = { name: u.name, contact: u.contact, code };
        state._accMsg = t("accResetDone");
      }catch(err){ state._accMsg = String((err && err.message) || err); } renderMore(); })(); }
  else if(a==="acc-revoke"){
    if(!isFullAdmin()) return;
    const id = el.dataset.id;
    const u = Sync.coll("users").find(x => x.id === id); if(!u) return;
    if(String(u.name || "").toLowerCase() === (state.userName || "").toLowerCase()){ renderMore(); return; }
    if(!Sync.online){ state._accMsg = t("gateWaitNet"); renderMore(); return; }
    delete state._codes[id];
    srvOp(Sync.del(15, id).then(()=>{ state._accMsg = t("accRevoked"); }), renderMore); }
  else if(a==="acc-mail" || a==="acc-sms" || a==="acc-copy"){
    const id = el.dataset.id, c = state._codes[id];
    if(!c){ state._accMsg = t("accResetDone"); renderMore(); return; }
    const u = Sync.coll("users").find(x => x.id === id) || { name: c.name, contact: c.contact };
    const msg = inviteMsgText({ name: c.name }, c.code);
    const subj = t("invMailSubj").replace("{parish}", parish().name);
    if(a === "acc-mail"){ window.open("mailto:" + encodeURIComponent(c.contact.includes("@") ? c.contact : "") + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(msg), "_self"); }
    else if(a === "acc-sms"){ const ph = c.contact.includes("@") ? "" : c.contact.replace(/[^+\d]/g, ""); window.open("sms:" + ph + "?&body=" + encodeURIComponent(msg), "_self"); }
    else { if(navigator.clipboard) navigator.clipboard.writeText(subj + "\n\n" + msg).then(()=>{ state._accMsg = t("accMsgCopied"); renderMore(); }).catch(()=>{ state._accMsg = msg; renderMore(); });
      else { state._accMsg = msg; renderMore(); } }
    void u; }
  else if(a==="pin-save"){ if(Sync.online || !state.admin) return; const np=(val("#admNewPin")||"").trim();
    if(np.length>=4){ store.set("admin.pin", np); state._admMsg=t("pinSaved"); } else state._admMsg=t("wrongPin"); renderMore(); }
  else if(a==="editor-add"){ const n=val("#admEditor"); if(!n) return;
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.push(14, {id:n}), renderMore); return; }
    if(!state.admin) return;
    if(!state.editors.includes(n)) state.editors.push(n); store.set("admin.editors", state.editors); renderMore(); }
  else if(a==="editor-del"){ if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(14, el.dataset.n), renderMore); return; }
    if(!state.admin) return;
    state.editors=state.editors.filter(x=>x!==el.dataset.n); store.set("admin.editors", state.editors); renderMore(); }
  else if(a==="muro-del"){ if(!canEdit()) return; const it=muroAll().find(m=>m.id===el.dataset.id);
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(12, el.dataset.id), renderMore); }
    state.muroExtra=state.muroExtra.filter(m=>m.id!==el.dataset.id);
    if(it&&!it.mine&&!state.muroHidden.includes(el.dataset.id)){ state.muroHidden.push(el.dataset.id); store.set("muro.hidden", state.muroHidden); }
    store.set("muro.extra", state.muroExtra); renderMore(); }
  // ---- Contenidos editables (UI compartida con la página de admin) ----
  else if(a.indexOf("content-") === 0){ handleContentAction(a, el, appCtx()); }
  else if(a==="ministry-save"){ if(!canEdit()) return; const mm2=state.ministry[state.ministryMass]||{};
    $$("#sec-ministerios [data-minrole]").forEach(inp=>{ mm2[inp.dataset.minrole]=inp.value.trim(); });
    state.ministry[state.ministryMass]=mm2;
    if(pubBoth(6, {id:state.ministryMass, roles:{...mm2}}, renderMore)) return;
    store.set("ministry", state.ministry); renderMore(); }
  else if(a==="msg-open"){ state.openMsg = state.openMsg===el.dataset.id? null : el.dataset.id; store.set("msgs.unread", false); render(); }
  else if(a==="msg-add"){ const t2=val("#msgTitle"), x=val("#msgBody"); if(!t2||!x) return;
    const rec={id:"m"+Date.now(), from:state.userName||"Feligresía", time:"", channel:"Comunidad", title:t2, body:x, to:$("#msgTo")?.value||"all"};
    if(pubBoth(2, rec, ()=>{ store.set("msgs.unread", true); renderMore(); })) return;
    state.messagesExtra.unshift(rec);
    store.set("messages.extra", state.messagesExtra); store.set("msgs.unread", true); renderMore(); }
  else if(a==="pastoral-focus"){ state._pastoralForm=el.dataset.f||null; state._pastoralSent=""; stopSpeak(); state.tab="more"; render(); setTimeout(()=>{ $("#sec-pastoral")?.scrollIntoView({behavior:"smooth"}); },80); }
  else if(a==="pastoral-form"){ state._pastoralForm = state._pastoralForm===el.dataset.f?null:el.dataset.f; state._pastoralSent=""; renderMore(); setTimeout(()=>{ $("#sec-pastoral")?.scrollIntoView({behavior:"smooth"}); },60); }
  else if(a==="pastoral-adorar"){ const n=val("#paName"); if(!n) return;
    const dstr = new Date().toLocaleString(localeOf(),{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
    const tu=$("#paTurno")?.value||"";
    const rec={id:"pa"+Date.now(), from:n, time:dstr, channel:"Adoración", to:"g16", title:"🕯️ "+t("adorBtn")+" · "+tu, body:n+" · "+(val("#paPhone")||"—")+" · "+t("turnoL")+": "+tu, priv:"adoracion"};
    const done=()=>{ store.set("msgs.unread", true); state._pastoralSent=t("sentOk"); state._pastoralForm=null; renderMore(); renderHome(); setTimeout(()=>{ $("#sec-pastoral")?.scrollIntoView({behavior:"smooth"}); },80); };
    if(pubBoth(2, rec, done)) return;
    state.pastoralExtra.unshift({...rec, mine:true}); store.set("pastoral.extra", state.pastoralExtra); done(); }
  else if(a==="pastoral-visita"){ const s=val("#pvSick"); if(!s) return;
    const dstr = new Date().toLocaleString(localeOf(),{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
    const tp=$("#pvType")?.value||"visita";
    const rec={id:"pv"+Date.now(), from:val("#pvContact")||state.userName||"Feligresía", time:dstr, channel:"Pastoral de enfermos", to:"g10",
      title:"🏠 "+(tp==="comunion"?t("visitCom"):t("visitVisit"))+" · "+s,
      body:s+" · "+(val("#pvAddr")||"—")+" · "+(val("#pvContact")||"—")+(val("#pvNotes")?" · "+val("#pvNotes"):""), priv:"visita"};
    const done=()=>{ store.set("msgs.unread", true); state._pastoralSent=t("sentOk"); state._pastoralForm=null; renderMore(); setTimeout(()=>{ $("#sec-pastoral")?.scrollIntoView({behavior:"smooth"}); },80); };
    if(pubBoth(2, rec, done)) return;
    state.pastoralExtra.unshift({...rec, mine:true}); store.set("pastoral.extra", state.pastoralExtra); done(); }
  else if(a==="pastoral-privada"){ const nms=val("#ppNames"); if(!nms) return;
    const dstr = new Date().toLocaleString(localeOf(),{day:"numeric",month:"short"});
    const k=$("#ppKind")?.value||"enfermos";
    const rec={id:"pp"+Date.now(), from:state.userName||"Feligresía", time:dstr, channel:"Oración privada", to:"all",
      title:"🙏 "+(k==="difuntos"?t("pvDep"):t("pvSick"))+" (privado)", body:nms, priv:"privada"};
    const done=()=>{ store.set("msgs.unread", true); state._pastoralSent=t("sentOk"); renderMore(); setTimeout(()=>{ $("#sec-pastoral")?.scrollIntoView({behavior:"smooth"}); },80); };
    if(pubBoth(2, rec, done)) return;
    state.pastoralExtra.unshift({...rec, mine:true}); store.set("pastoral.extra", state.pastoralExtra); done(); }
  else if(a==="home-prayer-add"){ const nms=val("#hpNames"); if(!nms) return;
    const dstr = new Date().toLocaleString(localeOf(),{day:"numeric",month:"short"});
    const k=$("#hpKind")?.value||"enfermos";
    const rec={id:"pp"+Date.now(), from:state.userName||"Feligresía", time:dstr, channel:"Oración privada", to:"all",
      title:"🙏 "+(k==="difuntos"?t("pvDep"):t("pvSick"))+" (privado)", body:nms, priv:"privada"};
    const done=()=>{ store.set("msgs.unread", true); state._homePrayerSent=t("sentOk"); renderHome(); setTimeout(()=>{ $("#sec-home-pray")?.scrollIntoView({behavior:"smooth"}); },80); };
    if(pubBoth(2, rec, done)) return;
    state.pastoralExtra.unshift({...rec, mine:true}); store.set("pastoral.extra", state.pastoralExtra); done(); }
  else if(a==="home-visit-add"){ const s=val("#hcSick"); if(!s) return;
    const dstr = new Date().toLocaleString(localeOf(),{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
    const contact=[val("#hcContact"),val("#hcPhone")].filter(Boolean).join(" · ");
    const rec={id:"pv"+Date.now(), from:val("#hcContact")||state.userName||"Feligresía", time:dstr, channel:"Pastoral de enfermos", to:"g10",
      title:"🏠 "+t("visitCom")+" · "+s,
      body:s+" · "+(val("#hcAddr")||"—")+" · "+(contact||"—")+(val("#hcNotes")?" · "+val("#hcNotes"):""), priv:"visita"};
    const done=()=>{ store.set("msgs.unread", true); state._homeVisitSent=t("sentOk"); renderHome(); setTimeout(()=>{ $("#sec-home-visit")?.scrollIntoView({behavior:"smooth"}); },80); };
    if(pubBoth(2, rec, done)) return;
    state.pastoralExtra.unshift({...rec, mine:true}); store.set("pastoral.extra", state.pastoralExtra); done(); }
  else if(a==="pastoral-del"){ if(!canEdit()) return; const id=el.dataset.id;
    if(Sync.online){ if(!Sync.isAdmin) return; srvOp(Sync.del(2, id), renderMore); }
    state.pastoralExtra=state.pastoralExtra.filter(r=>r.id!==id); store.set("pastoral.extra", state.pastoralExtra); renderMore(); }
  else if(a==="news-filter"){ state.newsFilter=el.dataset.c; renderMore(); }
  else if(a==="news-add"){ if(!canEdit()) return; const c=$("#nwCat")?.value||"Diócesis", t2=val("#nwTitle"), x=val("#nwBody"); if(!t2||!x) return;
    const rec={id:"n"+Date.now(), cat:c, date:"", title:t2, body:x};
    if(pubBoth(5, rec, renderMore)) return;
    state.newsExtra.unshift(rec);
    store.set("news.extra", state.newsExtra); renderMore(); renderHome(); }
  else if(a==="builder-open"){ renderBuilderSheet(); openSheet("builderSheet"); }
  else if(a==="builder-toggle"){ const m=el.dataset.mod; state.modules[m]=!(state.modules[m]!==false);
    store.set("home.modules", state.modules); renderBuilderSheet(); renderHome(); }
  else if(a==="builder-move"){ const m=el.dataset.mod, d=+el.dataset.dir; const i=state.order.indexOf(m), j=i+d;
    if(j>=0&&j<state.order.length){ [state.order[i],state.order[j]]=[state.order[j],state.order[i]]; store.set("home.order", state.order); }
    renderBuilderSheet(); renderHome(); }
  else if(a==="builder-reset"){ state.modules={hero:true,actions:true,inspire:true,events:true,bulletin:true,giving:true};
    state.order=["hero","actions","inspire","events","bulletin","giving"];
    store.set("home.modules",state.modules); store.set("home.order",state.order); renderBuilderSheet(); renderHome(); }
  else if(a==="giving-amount"){ state.givingAmt=+el.dataset.amt; renderHome(); renderMore(); }
  else if(a==="give-donate"){
    const pid = el.dataset.id;
    const inp = $("#give-amt-"+pid);
    const amt = Math.max(1, Math.round(+((inp && inp.value) || state.givingAmt) || 0));
    const nm = ($("#giveName")?.value.trim()) || state.userName || "Feligresía";
    state.giving.name = nm;
    state.giving.gifts.unshift({ id: "g"+Date.now(), pid, amt, name: nm, date: new Date().toISOString(), status: "pending", credited: null, folio: "SC-"+Date.now().toString(36).toUpperCase().slice(-6) });
    saveGiving(); renderMore(); renderHome();
    window.open(OSV_FUNDS_URL, "_blank", "noopener");
    setTimeout(()=>{ $("#sec-donativos")?.scrollIntoView({ behavior:"smooth" }); }, 80);
  }
  else if(a==="give-credit"){
    const g = state.giving.gifts.find(x=>x.id===el.dataset.id); if(!g) return;
    g.status = "received"; g.credited = new Date().toISOString();
    saveGiving();
    if(Sync.online) srvOp(Sync.push(10, {id:g.id, pid:g.pid, amt:g.amt, name:g.name, date:g.date, folio:g.folio}), ()=>{ renderMore(); renderHome(); });
    renderMore(); renderHome();
  }
  else if(a==="give-del"){
    state.giving.gifts = state.giving.gifts.filter(x=>x.id!==el.dataset.id);
    saveGiving(); renderMore(); renderHome();
  }
  else if(a==="goal-edit"){ if(!canEdit()) return; state.goalOpen = state.goalOpen===el.dataset.id ? null : el.dataset.id; renderMore(); }
  else if(a==="goal-save"){ if(!canEdit()) return;
    const pid = el.dataset.id;
    const v = Math.round(+($("#goal-inp-"+pid)?.value) || 0);
    if(v > 0){ if(pubBoth(11, {id:pid, goal:v}, renderMore)){ state.goalOpen=null; return; } state.giving.goals[pid] = v; saveGiving(); }
    state.goalOpen = null; renderMore();
  }
  else if(a==="upd-add"){ if(!canEdit()) return;
    const pid = el.dataset.id;
    const tx = ($("#upd-"+pid)?.value || "").trim(); if(!tx) return;
    const dstr = new Date().toLocaleString(localeOf(), { day:"numeric", month:"short" });
    const rec10={id:"u"+Date.now(), pid, d:dstr, t:tx};
    if(pubBoth(10, rec10, renderMore)) return;
    (state.giving.updates[pid] = state.giving.updates[pid] || []).push({ d: dstr, t: tx, mine: true });
    saveGiving(); renderMore();
  }
  else if(a==="chapel-msg-save"){ if(!canEdit()) return;
    const tx = (val("#chapel-msg-inp") || "").trim();
    if(!tx){ state._chapelMsg = t("chapelMsgPh"); renderMore(); return; }
    const now = new Date();
    const id = "cm-" + now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0");
    const dstr = now.toLocaleDateString(localeOf(), { month: "long", year: "numeric" });
    state.giving.monthly = { id, d: dstr, t: tx }; saveGiving();
    state._chapelMsg = "";
    if(Sync.online){ srvOp(Sync.push(10, { id, pid: "blessed-sacrament", d: dstr, t: tx, monthly: 1 }), renderMore); return; }
    renderMore();
  }
  else if(a==="chapel-msg-del"){ if(!canEdit()) return; const id = el.dataset.id;
    if(state.giving.monthly && state.giving.monthly.id === id) state.giving.monthly = null;
    state.giving.updates["blessed-sacrament"] = (state.giving.updates["blessed-sacrament"] || []).filter(u=>!u.monthly);
    saveGiving();
    if(Sync.online){ if(!Sync.isAdmin) { renderMore(); return; } srvOp(Sync.del(10, id), renderMore); return; }
    renderMore();
  }
  else if(a==="chapel-photo-add"){ if(!canEdit()) return;
    const f = $("#chapel-photo-file")?.files?.[0];
    const cap = (val("#chapel-photo-cap") || "").trim();
    if(!f || !cap){ state._chapelMsg = t("chapelNeedPh"); renderMore(); return; }
    (async()=>{ el.disabled = true; const old = el.textContent; el.textContent = t("chapelUploading");
      try{
        const r = await root.uploadPlugin(f); const u = r && r.url; if(!u) throw new Error("upload");
        const dstr = new Date().toLocaleDateString(localeOf(), { day: "numeric", month: "short", year: "numeric" });
        const rec = { id: "ph" + Date.now(), pid: "blessed-sacrament", d: dstr, t: cap, photo: u };
        (state.giving.updates["blessed-sacrament"] = state.giving.updates["blessed-sacrament"] || []).push({ d: dstr, t: cap, photo: u, mine: true });
        saveGiving(); state._chapelMsg = "";
        el.disabled = false; el.textContent = old;
        if(Sync.online){ srvOp(Sync.push(10, rec), renderMore); return; }
        renderMore();
      }catch(err){ el.disabled = false; el.textContent = old; state._chapelMsg = t("chapelNeedPh"); renderMore(); } })(); }
  else if(a==="chapel-photo-del"){ if(!canEdit()) return;
    const id = el.dataset.id, url = el.dataset.url;
    state.giving.updates["blessed-sacrament"] = (state.giving.updates["blessed-sacrament"] || []).filter(u=>u.photo !== url);
    saveGiving();
    if(Sync.online){ if(!Sync.isAdmin || !id) { renderMore(); return; } srvOp(Sync.del(10, id), renderMore); return; }
    renderMore();
  }
  else if(a==="bell"){ stopSpeak(); state.tab="community"; render(); setTimeout(()=>$("#sec-mensajes")?.scrollIntoView({behavior:"smooth"}),80); store.set("msgs.unread", false); renderTop(); }
});

setFavicon();
render();
refreshGCal();
Sync.connect();
setTimeout(fireAutoAlert, 2000);
