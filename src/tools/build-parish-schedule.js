// build-parish-schedule.js — convierte los calendarios parroquiales (ICS exportados de
// Google Calendar) en src/parish-schedule.js (window.ParishSchedule) para la app.
// Uso (herramienta js del workspace):
//   const s = await fs.readTextFile('src/tools/build-parish-schedule.js');
//   return await new (Object.getPrototypeOf(async function(){}).constructor)('fs', s)(fs);
// Lee: src/tools/ics/*.ics (copias de los ICS parroquiales exportados de Google
// Calendar; viven en src/ para que sobrevivan cambios de sesión/equipo).
// Escribe: src/parish-schedule.js
// Ventana: 2026-02-01..2028-01-31. Expande RRULE (WEEKLY/MONTHLY/YEARLY, UNTIL, COUNT,
// INTERVAL, EXDATE) y aplica instancias sueltas (RECURRENCE-ID) sobre la serie base.
// Clasifica: misas (+ celebrante/diácono/capilla/idioma), servicios (confesiones,
// adoración, devociones, celebraciones), funerales (solo nombre), cartelera pública y
// une cada Misa con sus intenciones del Mass Intentions Book (por fecha+hora+capilla).
// Códigos confirmados: HC = párroco, SL, JP; DES = Diác. Ernest Salazar,
// DDM = Diác. Dennis Montoya. JGS/DGR/NR se dejan en crudo.
// Capillas (párroco): San Miguel en Ranchitos, Nuestra Señora de los Dolores en
// Chimayó, San Buenaventura en Chimayó, Santo Niño de Atocha, San Pedro,
// San Isidro (La Mesilla), Sagrada Familia (Holy Family, Chimayó; la de Pajarito
// se distingue como "Sagrada Familia (Pajarito)") y Sangre de Cristo (Cuarteles).
// Santuario = Santuario de Chimayó; SC = Santa Cruz = templo principal Holy Cross
// (sus Misas duplicadas de ambos calendarios se fusionan por fecha+hora+capilla).
// ---------------------------------------------------------------------------
const WIN_FROM = "2026-02-01", WIN_TO = "2028-01-31";

const FILES = {
  intentions: "src/tools/ics/Mass_Intentions_Book.ics",
  hc: "src/tools/ics/HC_Monthly_Calendar.ics",
  shf: "src/tools/ics/SHF_Monthly_Church_Calendar.ics",
  rooms: "src/tools/ics/Meeting_Rooms.ics",
  fund: "src/tools/ics/Fundraiser_Calendar.ics"
};

function unfold(t){ return t.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, ""); }
function field(b, k){
  const m = b.match(new RegExp("^" + k + "(?:;([^:]*))?:(.*)$", "m"));
  return m ? { params: (m[1] || ""), value: (m[2] || "").trim() } : null;
}
function allFields(b, k){
  const out = []; const re = new RegExp("^" + k + "(?:;([^:]*))?:(.*)$", "gm"); let m;
  while((m = re.exec(b))) out.push({ params: m[1] || "", value: m[2].trim() });
  return out;
}
// DST America/Denver: 2026: 03-08..11-01 · 2027: 03-14..11-07 · 2028 (hasta 01-31): MST
function denverOffset(isoDate){
  if(isoDate >= "2026-03-08" && isoDate < "2026-11-01") return -6;
  if(isoDate >= "2027-03-14" && isoDate < "2027-11-07") return -6;
  return -7;
}
function utcToDenverWall(utc){
  // utc: Date. Devuelve {date:"YYYY-MM-DD", time:"HH:MM", key:"YYYYMMDDTHHMMSS"}
  let off = (utc.getUTCMonth() >= 2 && utc.getUTCMonth() <= 10) ? -6 : -7; // aproximación inicial
  let w = new Date(utc.getTime() + off * 3600e3);
  let iso = w.toISOString().slice(0, 10);
  off = denverOffset(iso);
  w = new Date(utc.getTime() + off * 3600e3);
  iso = w.toISOString().slice(0, 10);
  const hh = String(w.getUTCHours()).padStart(2, "0"), mm = String(w.getUTCMinutes()).padStart(2, "0");
  return { date: iso, time: hh + ":" + mm, key: iso.replace(/-/g, "") + "T" + hh + mm + "00" };
}
function parseDT(f){
  // f: {params, value}. Devuelve {date, time|null, key} en muro Denver, o null si inválido.
  if(!f) return null;
  const v = f.value;
  const dm = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if(!dm) return null;
  const iso = `${dm[1]}-${dm[2]}-${dm[3]}`;
  if(!dm[4]) return { date: iso, time: null, key: dm[1] + dm[2] + dm[3] }; // todo el día
  const isZ = !!dm[7];
  if(isZ){
    const utc = new Date(Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +dm[4], +dm[5], +(dm[6] || 0)));
    return utcToDenverWall(utc);
  }
  return { date: iso, time: dm[4] + ":" + dm[5], key: dm[1] + dm[2] + dm[3] + "T" + dm[4] + dm[5] + (dm[6] || "00") };
}
function parseRRule(s){
  const o = {};
  String(s || "").split(";").forEach(p => { const [k, v] = p.split("="); if(k) o[k] = v; });
  return o;
}
function weekdayOf(iso){ // 0=domingo
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
const WD2 = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
function daysInMonth(y, m){ return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
function addDaysIso(iso, n){
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * 864e5);
  return t.toISOString().slice(0, 10);
}
function expandBase(start, rrule, untilWall, count){
  // start: {date,time}. Devuelve lista de iso-dates (la hora es la de start).
  const out = [];
  const freq = rrule.FREQ;
  const interval = Math.max(1, parseInt(rrule.INTERVAL || "1", 10));
  const byday = (rrule.BYDAY || "").split(",").filter(Boolean);
  const until = untilWall || "9999";
  if(freq === "WEEKLY"){
    const wanted = new Set(byday.map(d => WD2[d.slice(-2)]).filter(x => x !== undefined));
    if(!wanted.size) wanted.add(weekdayOf(start.date));
    // semana base: lunes de la semana de start (aprox. WKST=MO)
    const dow = (weekdayOf(start.date) + 6) % 7;
    const monBase = addDaysIso(start.date, -dow);
    for(let d = WIN_FROM <= start.date ? start.date : WIN_FROM; d <= WIN_TO; d = addDaysIso(d, 1)){
      if(!wanted.has(weekdayOf(d))) continue;
      const weekIdx = Math.round((Date.parse(d) - Date.parse(monBase)) / 864e5 / 7);
      if(weekIdx % interval !== 0) continue;
      if(d < start.date) continue;
      const key = d.replace(/-/g, "") + "T" + (start.time || "0000").replace(":", "") + "00";
      if(key > until) {
        // si el día ya pasó el UNTIL y es semanal, se puede cortar si wanted es un solo día posterior... mejor seguir (barato) pero cortar si d > untilDate+7
        if(d > until.slice(0, 4) + "-" + until.slice(4, 6) + "-" + until.slice(6, 8)) { if(weekIdx > 0 && d > addDaysIso(until.slice(0,4)+"-"+until.slice(4,6)+"-"+until.slice(6,8), 7)) break; }
        continue;
      }
      out.push(d);
      if(count && out.length >= count) break;
    }
  } else if(freq === "MONTHLY"){
    let [y, m] = start.date.split("-").map(Number);
    const [ey, em] = [+(WIN_TO.slice(0, 4)), +(WIN_TO.slice(5, 7))];
    let n = 0;
    while(y < ey || (y === ey && m <= em)){
      if((n++) % interval === 0){
        const dim = daysInMonth(y, m);
        const targets = [];
        if(byday.length){
          for(const b of byday){
            const mm = b.match(/^(\d+)?([A-Z]{2})$/);
            if(!mm) continue;
            const wd = WD2[mm[2]];
            if(mm[1]){
              // n-ésimo wd del mes
              let c = 0;
              for(let d = 1; d <= dim; d++){
                const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                if(weekdayOf(iso) === wd && ++c === +mm[1]){ targets.push(iso); break; }
              }
            } else {
              for(let d = 1; d <= dim; d++){
                const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                if(weekdayOf(iso) === wd) targets.push(iso);
              }
            }
          }
        } else {
          const dd = Math.min(+start.date.slice(8, 10), dim);
          targets.push(`${y}-${String(m).padStart(2, "0")}-${String(dd).padStart(2, "0")}`);
        }
        for(const iso of targets){
          if(iso < start.date) continue;
          const key = iso.replace(/-/g, "") + "T" + (start.time || "0000").replace(":", "") + "00";
          if(key > until) continue;
          if(iso < WIN_FROM || iso > WIN_TO) continue;
          out.push(iso);
          if(count && out.length >= count) break;
        }
        if(count && out.length >= count) break;
      }
      if(++m > 12){ m = 1; y++; }
    }
  } else if(freq === "YEARLY"){
    for(let y = Math.max(+WIN_FROM.slice(0, 4), +start.date.slice(0, 4)); y <= +WIN_TO.slice(0, 4); y++){
      const iso = `${y}${start.date.slice(4)}`;
      if(iso < start.date || iso < WIN_FROM || iso > WIN_TO) continue;
      if(iso.slice(5) === "02-29" && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) continue;
      const key = iso.replace(/-/g, "") + "T" + (start.time || "0000").replace(":", "") + "00";
      if(key > until) continue;
      out.push(iso);
      if(count && out.length >= count) break;
    }
  } else {
    // FREQ desconocida: solo la fecha base
    if(start.date >= WIN_FROM && start.date <= WIN_TO) out.push(start.date);
  }
  return out;
}

// ---------- parseo de resúmenes ----------
function parsePlace(s, loc){
  const x = " " + String(s || "").toLowerCase() + " ";
  if(/san pedro/.test(x)) return "San Pedro";
  if(/santo nino|nino de atocha/.test(x)) return "Santo Niño de Atocha";
  if(/mesilla/.test(x)) return "San Isidro"; // capilla de San Isidro, La Mesilla
  if(/cuartel|sangre de cristo/.test(x)) return "Sangre de Cristo"; // capilla en Cuarteles
  if(/pajarito/.test(x)) return "Sagrada Familia (Pajarito)"; // capilla en Pajarito
  if(/sagrada/.test(x)) return "Sagrada Familia";
  if(/\bhfp\b/.test(x)) return "Sagrada Familia"; // Holy Family Parish, Chimayó
  if(/santuario/.test(x)) return "Santuario de Chimayó";
  if(/(^|[^a-z])sc([^a-z]|$)/.test(x)) return "Holy Cross"; // Santa Cruz = sede principal
  if(/el rito/.test(x)) return "El Rito";
  if(/puebla/.test(x)) return "La Puebla";
  if(/trampas/.test(x)) return "Trampas";
  if(/truchas/.test(x)) return "Truchas";
  if(/chiquito/.test(x)) return "Río Chiquito";
  if(/sarcos/.test(x)) return "Ojos Sarcos";
  if(/cordova/.test(x)) return "Córdova";
  if(/cundiyo/.test(x)) return "Cundiyó";
  if(/holy cross|\bhcccs?\b|\bhcc\b/.test(x)) return "Holy Cross";
  if(/marian hall/i.test(loc || "")) return "Marian Hall";
  // sede corta antes de los ministros ("Leyden: JP") cuando nada más casó
  const pre = String(s || "").match(/^([A-Za-zÉÑéñÜü.' ]{2,16}):\s*(HC|SL|JP|JGS|NR|FR\.|DEACON)\b/i);
  if(pre && !/mass|misa|office|meeting|wedding|funeral|mission|ministry/i.test(pre[1])) return pre[1].trim();
  if(loc) return String(loc).split(",")[0].slice(0, 40);
  return "";
}
function parseLang(s){
  if(/spanish|espa[nñ]ol/i.test(s)) return "es";
  if(/korean/i.test(s)) return "ko";
  if(/bilingual|biling/.test(s)) return "es/en";
  return "";
}
function parseKindMass(s){
  if(/anointing/i.test(s)) return "Unción";
  if(/confirmation|confirmaci/i.test(s)) return "Confirmación";
  if(/first (holy )?communion|primera comuni/i.test(s)) return "Primera Comunión";
  if(/baccalaureate|bachiller/i.test(s)) return "Bachillerato";
  if(/korean/i.test(s)) return "Misa coreana";
  if(/easter vigil|vigilia pascual/i.test(s)) return "Vigilia pascual";
  if(/christmas|navidad/i.test(s)) return "Navidad";
  if(/ash wednesday|ceniza/i.test(s)) return "Miércoles de Ceniza";
  if(/feast day|fiesta patronal/i.test(s)) return "Fiesta";
  if(/last supper|washing feet|jueves santo/i.test(s)) return "Jueves Santo";
  if(/good friday|viernes santo/i.test(s)) return "Viernes Santo";
  if(/funeral/i.test(s)) return "Exequias";
  return "";
}
const CEL_MAP = { HC: "HC", SL: "SL", JP: "JP" };
function parseMinisters(summary){
  let rest = summary.includes(":") ? summary.slice(summary.indexOf(":") + 1) : "";
  const cels = [], deas = [];
  rest = rest.replace(/\(([^)]*)\)/g, (mm, inner) => {
    inner.split(/[\/,]/).forEach(tok => {
      tok = tok.trim(); if(!tok) return;
      if(/deacon|di[aá]cono/i.test(tok)) deas.push(tok.replace(/^deacon\s+/i, ""));
      else if(/^(DES|DDM|DGR|DD)$/i.test(tok)) deas.push(tok.toUpperCase());
      else if(/^(HC|SL|JP|JGS|NR)$/i.test(tok)) cels.push(tok.toUpperCase());
      else if(/^fr\./i.test(tok)) cels.push(tok);
      // el resto ((Both), Int. DGR, etc.) se ignora
    });
    return " ";
  });
  rest.split("/").forEach(tok => {
    tok = tok.trim(); if(!tok) return;
    if(/^(DES|DDM|DGR|DD)$/i.test(tok)) deas.push(tok.toUpperCase());
    else if(/^(HC|SL|JP|JGS|NR)$/i.test(tok)) cels.push(tok.toUpperCase());
    else if(/^fr\./i.test(tok) || /^(father|padre|p\.)\b/i.test(tok)) cels.push(tok);
  });
  // "KOREAN MASS SL" / coletazos sin dos puntos
  if(!cels.length && !deas.length){
    const m = summary.match(/\b(HC|SL|JP|JGS|NR|DES|DDM|DGR|DD)\b\s*$/i);
    if(m){
      const c = m[1].toUpperCase();
      if(/^(DES|DDM|DGR|DD)$/.test(c)) deas.push(c); else cels.push(c);
    }
  }
  return { cel: [...new Set(cels)].join(" · "), dea: [...new Set(deas)].join(" · ") };
}
function cleanSummary(s){
  return String(s || "").replace(/\\/g, "").replace(/\s+/g, " ").trim();
}
function cleanLines(desc){
  let t = String(desc || "").replace(/<br\s*\/?>/gi, "\n").replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
  return t.split("\n").map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean);
}
function classify(summary){
  const s = summary;
  if(/no mass/i.test(s)) return null;
  if(/communion service/i.test(s)) return { b: "service", kind: "Comunión" };
  if(/communion to the sick|communion.*sick|sick.*communion/i.test(s)) return { b: "service", kind: "Comunión" };
  if(/confes\w*:\s*[A-Z][a-z]+ & /i.test(s)) return { b: "private" };
  if(/confession|confesion|penitential|penance service|penitencia/i.test(s)) return { b: "service", kind: "Confesiones" };
  if(/adoration|adoraci[oó]n|exposici/i.test(s)) return { b: "service", kind: "Adoración" };
  if(/rosary|chaplet|divine mercy|stations|viacrucis|via crucis|vespers|praise and worship/i.test(s)) return { b: "service", kind: "Devoción" };
  if(/funeral|burial|internment|cemetery|cementerio|pante[oó]n/i.test(s)) return { b: "funeral" };
  if(/baptism|bautizo|quincea|wedding|boda|matrimonio|marriage|rehearsal/i.test(s)) return { b: "private" };
  if(/mass\b|misa|easter vigil/i.test(s)) return { b: "mass", kind: parseKindMass(s) };
  if(/last supper|washing feet|jueves santo/i.test(s)) return { b: "mass", kind: "Jueves Santo" };
  if(/lavang|la vang/i.test(s)) return { b: "mass", kind: "Misa vietnamita" };
  if(/^[^:]{2,40}:\s*(hc|sl|jp|jgs|nr|des|ddm|dgr|dd|fr\.|father|padre|p\.|deacon|di[aá]cono)\b/i.test(s)
    && !/office|oficina|meeting|mtg|ministry|music|mentor|class|council|consejo|school|wedding|funeral|marriage|closed|mission|misi[oó]n|retreat|dinner|lunch|visit|tour|practice|rehearsal|camp|outing|sleepover|doctor|dentist|corte|hair|out to|formation|finance|staff|lesson|communion|sick/i.test(s)) return { b: "mass", kind: parseKindMass(s) };
  if(/chapel|capilla/i.test(s) && !/funeral|wedding|boda|matrimonio|quincea|baptism|bautizo|tour/i.test(s)) return { b: "mass", kind: parseKindMass(s) };
  if(/ash wednesday|ceniza/i.test(s)) return { b: "mass", kind: "Miércoles de Ceniza" };
  if(/feast day|fiesta patronal/i.test(s)) return { b: "mass", kind: "Fiesta" };
  if(/good friday|viernes santo/i.test(s)) return { b: "service", kind: "Viernes Santo" };
  if(/liturg/i.test(s)) return { b: "service", kind: "Celebración" };
  if(/first (holy )?communion/i.test(s)) return (/mass|misa|chapel|hccc|hfp|santuario|\bff\b|ff\s*:/i.test(s)) ? { b: "mass", kind: "Primera Comunión" } : { b: "private" };
  if(/confirmation|confirmaci/i.test(s) && !/retreat|mission|misi[oó]n|class|council|meeting|rehearsal/i.test(s)) return (/mass|misa|chapel|hccc|hfp|santuario/i.test(s)) ? { b: "mass", kind: "Confirmación" } : { b: "private" };
  if(/retreat|mission\b|misi[oó]n|novena|posada/i.test(s)) return { b: "candidate-event" };
  if(/office|oficina|closed|holiday|meeting|mtg|council|consejo|staff|finance|mentor|usher|acolyte|altar server|training|registration|ministry|scwa|irrigation|school|deaconate|tim mtg|lunch|dinner with|hair ?cut|vacation|visita|homebound|cleaning|music ministry|pastoralista|encuentro/i.test(s)){
    // excepciones públicas con esas palabras
    if(/registration for (ff|faith|ocia)|vacation bible|music posadas|50th anniv/i.test(s)) return { b: "candidate-event" };
    return { b: "internal" };
  }
  return { b: "candidate-event" };
}
const PUBLIC_RE = /bible study|ocia|rica|r\.c\.i\.a|faith formation|family formation|\bff\b|fiesta|arts & crafts|vacation bible|coffee & donuts|posada|retreat|mission|misi[oó]n|walk to|peregrin|procesi|registration|novena|family night|fundrais|bingo|bazaar|kermes|carnival|raffle|catholic daughters|knights of columbus|st\. vincent|concert|danza|matachina|christmas play|gala|talk at|community meeting|reception|pot luck|married couples/i;
const PRIVATE_RE = /funeral|baptism|bautizo|quincea|wedding|boda|rehearsal|office|oficina|closed|meeting|mtg|council|staff|finance|mentor|usher|acolyte|altar server|training|scwa|irrigation|deaconate|lunch|hair ?cut|homebound|cleaning|pastoralista|encuentro|visita|dinner with|tim mtg|school|ministry/i;

async function loadFile(path){
  let raw = await fs.readTextFile(path);
  raw = unfold(raw);
  const blocks = raw.split("BEGIN:VEVENT").slice(1).map(b => "BEGIN:VEVENT" + b.split("END:VEVENT")[0]);
  return blocks.map(b => {
    const f = (k) => field(b, k);
    return {
      uid: (f("UID") || {}).value || "",
      summary: ((f("SUMMARY") || {}).value || ""),
      desc: ((f("DESCRIPTION") || {}).value || ""),
      loc: ((f("LOCATION") || {}).value || ""),
      dt: parseDT(f("DTSTART")),
      dtEnd: parseDT(f("DTEND")),
      rrule: ((f("RRULE") || {}).value || ""),
      recid: parseDT(f("RECURRENCE-ID")),
      exdates: allFields(b, "EXDATE").flatMap(e => e.value.split(",").map(v => parseDT({ params: e.params, value: v.trim() })).filter(Boolean).map(d => d.key)),
      status: ((f("STATUS") || {}).value || "")
    };
  }).filter(e => e.uid && e.summary && e.dt && e.status !== "CANCELLED");
}

const masses = {}, services = {}, events = {}, soloInt = {};
function push(map, iso, obj){
  if(iso < WIN_FROM || iso > WIN_TO) return;
  (map[iso] = map[iso] || []).push(obj);
}
const stats = { massOcc: 0, svcOcc: 0, evOcc: 0, intOcc: 0, bases: 0, detached: 0, exdateHit: 0 };
const diagQ = {}, diagSolo = [];
// Ocurrencias de un grupo UID: cada base (sin RECURRENCE-ID) expande su propia serie
// con SUS propios EXDATE; las instancias sueltas reemplazan (kill) en todo el grupo.
function groupOccs(grp){
  const occs = [];
  const bases = grp.filter(e => !e.recid);
  const inst = grp.filter(e => e.recid);
  stats.detached += inst.length;
  const kill = new Set(inst.map(e => e.recid.key));
  for(const base of bases){
    if(base.rrule){
      stats.bases++;
      const rr = parseRRule(base.rrule);
      const until = rr.UNTIL ? (rr.UNTIL.length === 8 ? rr.UNTIL : utcToDenverWall(new Date(Date.UTC(+rr.UNTIL.slice(0,4), +rr.UNTIL.slice(4,6)-1, +rr.UNTIL.slice(6,8), +rr.UNTIL.slice(9,11)||0, +rr.UNTIL.slice(11,13)||0, 0))).key) : null;
      const exset = new Set(base.exdates);
      const dates = expandBase(base.dt, rr, until, rr.COUNT ? +rr.COUNT : 0);
      for(const d of dates){
        const key = d.replace(/-/g, "") + "T" + (base.dt.time || "0000").replace(":", "") + "00";
        if(exset.has(key)){ stats.exdateHit++; continue; }
        if(kill.has(key)) continue;
        occs.push({ ev: base, date: d });
      }
    } else { occs.push({ ev: base, date: base.dt.date }); }
  }
  for(const e of inst) occs.push({ ev: e, date: e.dt.date });
  return occs;
}

// ---------- 1. intenciones ----------
{
  const evs = await loadFile(FILES.intentions);
  const byUid = {};
  evs.forEach(e => { (byUid[e.uid] = byUid[e.uid] || []).push(e); });
  const occs = []; // {date,time,full,chapel,lang,lines}
  for(const uid of Object.keys(byUid)){
    for(const o of groupOccs(byUid[uid])) occs.push(o);
  }
  for(const { ev, date } of occs){
    if(!/^(mass intentions|mass\b|hccc mass)/i.test(ev.summary)) continue;
    if(date < WIN_FROM || date > WIN_TO) continue;
    stats.intOcc++;
    occs._all = (occs._all || []);
    occs._all.push({
      date, time: ev.dt.time || "",
      full: /FULL/i.test(ev.summary) ? 1 : 0,
      chapel: parsePlace(ev.summary, ev.loc),
      lang: parseLang(ev.summary),
      lines: cleanLines(ev.desc)
    });
  }
  var INTENTIONS = occs._all || [];
}

// ---------- 2. misas / servicios / cartelera ----------
function processFile(path, defPlace){
  return loadFile(path).then(evs => {
    const byUid = {};
    evs.forEach(e => { (byUid[e.uid] = byUid[e.uid] || []).push(e); });
    const occs = [];
    for(const uid of Object.keys(byUid)){
      for(const o of groupOccs(byUid[uid])) occs.push(o);
    }
    return occs;
  });
}
function funeralName(s){
  let nm = String(s || "");
  nm = nm.replace(/^.*\bfuneral\b[^:]*:\s*/i, "").replace(/^(hccc\s+)?cemetery\s*:?\s*/i, "");
  nm = nm.replace(/\([^)]*\)/g, " ");
  nm = nm.replace(/^(HC|SL|JP|JGS|NR)\s+(for\s+)?/i, "").replace(/^FH[- ]/i, "");
  nm = nm.replace(/\s*\/?\s*Int\..*$/i, "").replace(/\/$/, "").replace(/\s+/g, " ").trim();
  return nm.slice(0, 80);
}
function emitOcc(ev, date, defPlace, allowAllDay){
  const s = cleanSummary(ev.summary);
  const c = classify(s);
  const time = ev.dt.time || "";
  if(!time && !allowAllDay) return "marker";
  const end = ev.dtEnd && ev.dtEnd.time ? ev.dtEnd.time : "";
  const place = parsePlace(s, ev.loc) || defPlace;
  const min = parseMinisters(s);
  if(!c) return "closed";
  if(c.b === "mass" || c.b === "funeral"){
    stats.massOcc++;
    push(masses, date, {
      t: time, e: end, pl: place, lg: parseLang(s),
      k: c.b === "funeral" ? "Exequias" : (c.kind || ""),
      ce: min.cel, de: min.dea, full: 0, int: [],
      ti: c.b === "funeral" ? funeralName(s) : ""
    });
    return "mass";
  }
  if(c.b === "service"){
    stats.svcOcc++;
    let title = s.slice(0, 90);
    if(/communion to the sick/i.test(s)) title = "Comunión a los enfermos";
    push(services, date, { t: time, e: end, k: c.kind, ti: title, ce: min.cel, pl: place });
    return "service";
  }
  if(c.b === "candidate-event"){
    if(PRIVATE_RE.test(s) && !/registration|vacation bible|music posadas|50th anniv|family night|pot luck|married couples|reception for 50th|christmas play|valentine/i.test(s)) return "internal";
    if(!PUBLIC_RE.test(s)){ diagQ[s] = (diagQ[s] || 0) + 1; return "internal?"; }
    stats.evOcc++;
    push(events, date, { t: time, e: end, ti: s.slice(0, 110), pl: place, de: cleanLines(ev.desc).slice(0, 3).join(" / ").slice(0, 200) });
    return "event";
  }
  return c.b;
}
const buckets = {};
for(const [key, defPlace] of [["hc", "Holy Cross"], ["shf", ""], ["rooms", ""], ["fund", ""]]){
  if(key === "fund"){
    const evs = await loadFile(FILES.fund);
    for(const ev of evs){
      const s = cleanSummary(ev.summary);
      if(!/fiesta|fundrais|bingo|bazaar|kermes|gala|raffle|sale/i.test(s)) continue;
      const d = ev.dt.date;
      stats.evOcc++;
      push(events, d, { t: ev.dt.time || "", e: "", ti: s.slice(0, 110), pl: parsePlace(s, ev.loc) || "Holy Cross", de: "" });
    }
    continue;
  }
  const occs = await processFile(FILES[key], defPlace);
  for(const { ev, date } of occs){
    const r = emitOcc(ev, date, defPlace, key === "fund");
    buckets[r] = (buckets[r] || 0) + 1;
  }
}

// ---------- 2b. quitar duplicados HC/SHF (misma Misa en los dos calendarios) ----------
function mergeMin(dst, src){
  if(src.ce && !dst.ce) dst.ce = src.ce;
  else if(src.ce && dst.ce && !dst.ce.includes(src.ce)) dst.ce += " · " + src.ce;
  if(src.de){
    const parts = String(dst.de || "").split(" · ").filter(Boolean);
    src.de.split(" · ").forEach(d => { if(d && !parts.includes(d)) parts.push(d); });
    dst.de = parts.join(" · ");
  }
  if(!dst.lg && src.lg) dst.lg = src.lg;
  if(!dst.e && src.e) dst.e = src.e;
  if(!dst.ti && src.ti) dst.ti = src.ti;
}
{
  const seen = {};
  for(const date of Object.keys(masses)){
    const merged = [];
    for(const m of masses[date]){
      const key = [m.t, m.pl, m.k || ""].join("|");
      const prev = seen[date + "~" + key];
      if(prev){ mergeMin(prev, m); continue; }
      // misma hora+sede, una sin clase y otra con clase específica (p. ej. Unción): es la misma Misa
      let target = null;
      if(m.k !== "Exequias"){
        target = merged.find(x => x.t === m.t && x.pl === m.pl && x.k !== "Exequias" && ((x.k || "") === "" || (m.k || "") === ""));
      }
      if(!target && !m.pl){
        target = merged.find(x => x.t === m.t && x.pl === "Holy Cross" && (x.k || "") === (m.k || "") && (!x.ce || !m.ce || x.ce === m.ce));
      }
      if(target){ if(!target.k && m.k) target.k = m.k; mergeMin(target, m); continue; }
      seen[date + "~" + key] = m;
      merged.push(m);
    }
    masses[date] = merged;
  }
  const seenSvc = {};
  for(const date of Object.keys(services)){
    const merged = [];
    for(const s of services[date]){
      const key = [s.t, s.k, s.ti].join("|");
      const prev = seenSvc[date + "~" + key];
      if(prev && (!prev.pl || !s.pl || prev.pl === s.pl)){
        if(!prev.pl && s.pl) prev.pl = s.pl;
        if(s.e && (!prev.e || s.e > prev.e)) prev.e = s.e;
        if(s.ce && !prev.ce) prev.ce = s.ce;
        continue;
      }
      seenSvc[date + "~" + key] = s;
      merged.push(s);
    }
    services[date] = merged;
  }
}

// ---------- 3. unir intenciones con misas ----------
let matched = 0, solo = 0;
for(const it of INTENTIONS){
  const day = masses[it.date] || [];
  const cands = day.filter(m => !m.t || !it.time || m.t === it.time);
  if(!cands.length){ solo++; diagSolo.push(it.date + " " + (it.time || "?") + " [" + (it.chapel || "") + "] " + (it.lines[0] || "").slice(0, 60)); push(soloInt, it.date, { t: it.time, full: it.full, int: it.lines }); continue; }
  let best = cands[0], bestScore = -1;
  for(const m of cands){
    let sc = 0;
    if(it.chapel && m.pl === it.chapel) sc += 2;
    if(it.lang && m.lg === it.lang) sc += 2;
    if(!it.chapel && !it.lang) sc += 1;
    if(sc > bestScore){ bestScore = sc; best = m; }
  }
  matched++;
  best.int = best.int.concat(it.lines);
  if(it.full) best.full = 1;
}
// ordenar cada día por hora
for(const map of [masses, services, events, soloInt])
  for(const k of Object.keys(map)) map[k].sort((a, b) => String(a.t || "").localeCompare(String(b.t || "")));

const out = "window.ParishSchedule = " + JSON.stringify({ from: WIN_FROM, to: WIN_TO, masses, services, events, soloInt }) + ";\n";
await fs.writeTextFile("src/parish-schedule.js", out);
return { bytes: out.length, stats, buckets, days: { masses: Object.keys(masses).length, services: Object.keys(services).length, events: Object.keys(events).length, soloInt: Object.keys(soloInt).length }, matched, solo, intentions: INTENTIONS.length,
  dropped: Object.entries(diagQ).sort((a, b) => b[1] - a[1]).slice(0, 40), soloSample: diagSolo.slice(0, 12) };
