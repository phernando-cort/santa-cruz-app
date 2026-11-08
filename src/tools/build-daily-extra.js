// build-daily-extra.js — builder for src/daily-extra.js (window.DailyExtra), the generated
// fallback layer covering 2027-11-01..2032-12-31 for the parish-app daily readings.
// Usage (dev console tool): const src = await fs.readTextFile('src/tools/build-daily-extra.js');
//   return await new (Object.getPrototypeOf(async function(){}).constructor)('fs', src)(fs);
// What it does: builds FERIAL/SLOTMAP/FIXED tables from src/vendor/lectionary-daily.js
// (+ LectionaryProject slots from src/vendor/lectionary-data.js, CSV rescue from
// src/tools/csv-rows.json), predicts every day 2027-11-01..2032-12-31, validates against
// the effective rows for 2023-01-01..2027-10-31, writes scratch/daily-extra.CANDIDATE.js.
// Review the VALIDATION summary (mismN should be only accepted classes + vendor-typo list),
// spot-check the checks printed by the emission block, then copy the candidate to
// src/daily-extra.js. Rebuild recipe: no npm deps; runs in the workspace js tool.
// See src/README.md ("Daily readings 2023-2032") for calendar decisions.
// ---------------------------------------------------------------------------
// an6: builder final — tablas + predict + validación vs efectivo + cobertura futura + emisión.
// Uso: const s = await fs.readTextFile('scratch/an6.js');
//      return await new (Object.getPrototypeOf(async function(){}).constructor)('fs', s)(fs);
const dc = await fs.readTextFile("src/vendor/lectionary-daily.js");
new Function(dc.replace("window.DailyCitations={", "globalThis.DailyCitations={"))();
const D = globalThis.DailyCitations;
let lv = await fs.readTextFile("src/vendor/lectionary-data.js");
lv = lv.replace("window.dispatchEvent(new Event(\"lectionary-module-ready\"));", "");
new Function(lv.replace("window.LectionaryModule =", "globalThis.LectionaryModule ="))();
const M = globalThis.LectinaryModule || globalThis.LectionaryModule;
const LC = M.LiturgicalCalendar;

// ---------- helpers ----------
const DAY = 86400000;
const isoOf = (d) => d.toISOString().slice(0, 10);
const parseIso = (iso) => new Date(iso + "T00:00:00Z");
const addD = (d, n) => new Date(d.getTime() + n * DAY);
const diffDays = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY);
const WD = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const ORDN = {1:"First",2:"Second",3:"Third",4:"Fourth",5:"Fifth",6:"Sixth",7:"Seventh",8:"Eighth",9:"Ninth",10:"Tenth",11:"Eleventh",12:"Twelfth",13:"Thirteenth",14:"Fourteenth",15:"Fifteenth",16:"Sixteenth",17:"Seventeenth",18:"Eighteenth",19:"Nineteenth",20:"Twentieth",21:"Twenty-first",22:"Twenty-second",23:"Twenty-third",24:"Twenty-fourth",25:"Twenty-fifth",26:"Twenty-sixth",27:"Twenty-seventh",28:"Twenty-eighth",29:"Twenty-ninth",30:"Thirtieth",31:"Thirty-first",32:"Thirty-second",33:"Thirty-third",34:"Thirty-fourth"};
const ABBR = [["thessalonians","thes"],["corinthians","cor"],["philippians","phil"],["ephesians","eph"],["timothy","tm"],["titus","tit"],["titus","ti"],["hebrews","heb"],["revelation","rv"],["colossians","col"],["peter","pt"],["samuel","sam"],["jude","jud"],["james","jas"],["job","jb"],["john","jn"],["matthew","mt"],["mark","mk"],["mark","m"],["luke","lk"],["psalm","ps"],["genesis","gen"],["genesis","gn"],["exodus","ex"],["leviticus","lv"],["numbers","nm"],["deuteronomy","dt"],["joshua","jos"],["judges","jgs"],["samuel","sm"],["kings","kgs"],["chronicles","chr"],["ezra","ezr"],["nehemiah","neh"],["tobit","tob"],["tobit","tb"],["judith","jdt"],["esther","est"],["maccabees","mc"],["ruth","ru"],["proverbs","prv"],["ecclesiastes","eccl"],["song of songs","sgs"],["wisdom","wis"],["sirach","sir"],["isaiah","is"],["jeremiah","jer"],["lamentations","lam"],["baruch","bar"],["ezekiel","ez"],["daniel","dn"],["hosea","hos"],["joel","jl"],["amos","am"],["obadiah","ob"],["jonah","jon"],["micah","mi"],["nahum","na"],["habakkuk","hab"],["zephaniah","zep"],["haggai","hg"],["zechariah","zec"],["malachi","mal"],["acts","act"],["romans","rom"],["galatians","gal"],["thessalonians","thess"],["song of songs","sg"],["hebrews","hb"],["psalm","psalms"],["revelation","rev"],["exodus","exod"],["matthew","matt"],["zechariah","zech"],["thessalonians","thes"]];
const normCite = (s) => {
  let x = String(s || "").toLowerCase().replace(/[’‘]/g, "'").replace(/[—–]/g, "-");
  x = x.replace(/^(see|cf\.?)\s+/, "");
  x = x.replace(/([a-z])(\d)/g, "$1 $2");
  for (const [full, ab] of ABBR) x = x.replace(new RegExp("\\b" + ab.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g"), full);
  // strip "X or ALT" longer options, drop filler "and", drop verse-letter suffixes (3b, 16bc, 8abcd)
  x = x.replace(/\bor\b.*$/, "").replace(/\band\b/g, " ").replace(/(\d)[a-z]+/g, "$1");
  return x.replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
};
const psalmKey = (p) => normCite(p).replace(/^psalm /, "");
const sigOf = (r) => [r[2], normCite(r[3]), psalmKey(r[4]), normCite(r[5]), normCite(r[6]), normCite(r[7])].join("|");
const colDiff = (e, p) => {
  const f = [];
  if (normCite(e[3]) !== normCite(p[3])) f.push("F");
  if (psalmKey(e[4]) !== psalmKey(p[4])) f.push("P");
  if (normCite(e[5]) !== normCite(p[5])) f.push("S");
  if (normCite(e[6]) !== normCite(p[6])) f.push("A");
  if (normCite(e[7]) !== normCite(p[7])) f.push("G");
  return f.join("");
};
const normLab = (s) => String(s || "").toLowerCase().replace(/’/g, "'").replace(/\s+/g, " ").trim();
const inOverlay = (iso) => iso >= "2026-04-01" && iso <= "2027-05-31";

// positive ferial-label test
const isFerialLabel = (s) => {
  if (/Thanksgiving|Day of Prayer|All Souls|Commemoration/i.test(s)) return false;
  return /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday) (of the|of|in the|after|in) /.test(s)
    || /^Christmas Weekday/.test(s) || / after Epiphany/.test(s)
    || / in the Octave of Easter/.test(s) || /^Easter Monday/.test(s)
    || / of Holy Week/.test(s) || / Day in the Octave of Christmas/.test(s)
    || / Week of Advent/.test(s);
};
const rankOf = (label) => {
  if (/^Solemnity/.test(label)) return "S";
  if (/^Feast/.test(label)) return "F";
  if (/Martyr|martyr/.test(label)) return "mM";
  if (/^Memorial/.test(label)) return "M";
  if (/^(Saint|St\.|Blessed|Our Lady|The (Holy|Blessed)|Holy)/.test(label)) return "M";
  if (isFerialLabel(label)) return "-";
  return "?";
};
const LORD = ["Transfiguration", "Exaltation of the Holy Cross", "Presentation of the Lord", "Dedication of the Lateran Basilica"];

// ---------- liturgical context ----------
function endYearFor(date) {
  const y = date.getUTCFullYear();
  const next = LC.getLiturgicalYear(y + 1);
  return date.getTime() >= next.dates.advent1.getTime() ? y + 1 : y;
}
const lyCache = {};
function lyFor(iso) {
  const ey = endYearFor(parseIso(iso));
  if (!lyCache[ey]) {
    const ly = LC.getLiturgicalYear(ey);
    const { slots } = M.buildSlots(ey);
    const byDate = new Map(slots.map(s => [s.date.getTime(), s]));
    const otSuns = slots.filter(s => s.kind === "ot").map(s => {
      const m = String(s.id).match(/ot\d+-(\d+)/);
      return { t: s.date.getTime(), iso: isoOf(s.date), week: m ? +m[1] : null };
    }).filter(o => o.week != null).sort((a, b) => a.t - b.t);
    let epiphSun = null;
    for (let dd = 2; dd <= 8; dd++) { const d = new Date(Date.UTC(ey, 0, dd)); if (d.getUTCDay() === 0) { epiphSun = d; break; } }
    const eJan = epiphSun.getUTCDate();
    const baptism = (eJan === 7 || eJan === 8) ? addD(epiphSun, 1) : addD(epiphSun, 7);
    const christmas = new Date(Date.UTC(ey - 1, 11, 25));
    const holyFamily = christmas.getUTCDay() === 0 ? new Date(Date.UTC(ey - 1, 11, 30)) : addD(christmas, 7 - christmas.getUTCDay());
    lyCache[ey] = { ey, ly, slots, byDate, otSuns, epiphSun, baptism, holyFamily };
  }
  return lyCache[ey];
}
function ensureYears(aIso, bIso) {
  let d = parseIso(aIso); const end = parseIso(bIso);
  while (d <= end) { lyFor(isoOf(d)); d = addD(d, 60); }
}
function nextOtSun(t) {
  let best = null;
  for (const k in lyCache) for (const o of lyCache[k].otSuns) if (o.t > t && (!best || o.t < best.t)) best = o;
  return best;
}
const transferObsCache = {};
function transferObs(y) {
  // observed (transferred) solemnity isos for calendar year y
  if (!transferObsCache[y]) {
    const C = lyFor(y + "-06-15"); const L = C.ly.dates;
    const mar19 = y + "-03-19";
    const josephObs = parseIso(mar19).getUTCDay() === 0 ? isoOf(addD(parseIso(mar19), 1)) : mar19;
    const mar25 = y + "-03-25";
    const a = parseIso(mar25), awd = a.getUTCDay();
    const inHoly = a.getTime() >= addD(L.palmSunday, 0).getTime() && a.getTime() <= addD(L.easter, 7).getTime();
    let annObs;
    if (awd === 0 && !inHoly) annObs = isoOf(addD(a, 1));
    else if (inHoly) annObs = isoOf(addD(L.easter, 8));
    else annObs = mar25;
    const dec8 = y + "-12-08";
    const immacObs = parseIso(dec8).getUTCDay() === 0 ? isoOf(addD(parseIso(dec8), 1)) : dec8;
    transferObsCache[y] = { josephObs, annObs, immacObs };
  }
  return transferObsCache[y];
}
function otWeekFor(iso) {  const d = parseIso(iso), t = d.getTime();
  const C = lyFor(iso); const L = C.ly.dates;
  if (t > L.christTheKing.getTime() && t < L.nextAdvent1.getTime()) return 34;
  const nx = nextOtSun(t);
  // tail after the last OT Sunday (Christ-King gap) or no next: preceding Sunday's week
  if (!nx || nx.t > L.christTheKing.getTime()) {
    let pv0 = null;
    for (const k in lyCache) for (const o of lyCache[k].otSuns) if (o.t < t && (!pv0 || o.t > pv0.t)) pv0 = o;
    return pv0 ? pv0.week : null;
  }
  if (L.ashWednesday.getTime() > t && L.ashWednesday.getTime() <= nx.t) {
    let pv = null;
    for (const k in lyCache) for (const o of lyCache[k].otSuns) if (o.t < t && (!pv || o.t > pv.t)) pv = o;
    return pv ? pv.week : null;
  }
  let cnt = 0;
  for (let x = t + DAY; x <= nx.t; x += DAY) if (new Date(x).getUTCDay() === 0) cnt++;
  return nx.week - cnt;
}
const ferialKeyCache = {};
function ferialKey(iso) {
  if (ferialKeyCache[iso]) return ferialKeyCache[iso];
  const d = parseIso(iso), C = lyFor(iso);
  const wd = d.getUTCDay(), mmdd = iso.slice(5), t = d.getTime(), L = C.ly.dates;
  const par = C.ey % 2 === 1 ? "I" : "II";
  let k = null;
  if (mmdd >= "12-17" && mmdd <= "12-24") k = "ADVFIX:" + mmdd;
  else if ((mmdd >= "12-26" && mmdd <= "12-31") || mmdd === "01-01") k = "XMAS:" + mmdd;
  else if (mmdd >= "01-02" && mmdd <= "01-07") {
    const eph = isoOf(C.epiphSun);
    if (iso < eph) k = "JANPRE:" + mmdd;
    else if (iso > eph) k = "JANPOS:" + wd;
  }
  if (!k && iso > isoOf(C.epiphSun) && iso < isoOf(C.baptism)) k = "JANPOS:" + wd;
  if (!k && t >= L.advent1.getTime() && t < addD(L.christmas, 0).getTime()) {
    const w = Math.floor(diffDays(L.advent1, d) / 7) + 1;
    k = "ADV:" + w + ":" + wd;
  }
  if (!k && t > L.easter.getTime() && t < addD(L.pentecost, 0).getTime()) {
    const dc2 = diffDays(L.easter, d);
    if (dc2 >= 1 && dc2 <= 6) k = "OCT:" + dc2;
    else k = "EAST:" + (Math.floor((dc2 - 1) / 7) + 1) + ":" + wd;
  }
  if (!k && t >= L.ashWednesday.getTime() && t < addD(L.palmSunday, 0).getTime()) {
    if (t < addD(L.ashWednesday, 4).getTime()) k = "LENT:0:" + wd;
    else k = "LENT:" + Math.floor((diffDays(L.ashWednesday, d) + 3) / 7) + ":" + wd;
  }
  if (!k && t >= addD(L.palmSunday, 0).getTime() && t <= addD(L.holyThursday, -1).getTime()) k = "HOLY:" + wd;
  if (!k) { const w = otWeekFor(iso); if (w) k = "OT:" + par + ":" + w + ":" + wd; }
  ferialKeyCache[iso] = k;
  return k;
}
const otFormulaNo = (par, w, wd) => 305 + 6 * (w - 1) + (wd - 1);

// ---------- tables ----------
ensureYears("2023-01-01", "2032-12-31");
const isos = Object.keys(D).sort();
const SLOTMAP = {}; const SLOTSEEN = {};
for (const iso of isos) {
  const C = lyFor(iso);
  const slot = C.byDate.get(parseIso(iso).getTime());
  if (!slot || slotIgnored(slot)) continue;
  const k = slot.kind + ":" + slot.id + ":" + C.ly.cycle;
  (SLOTSEEN[k] = SLOTSEEN[k] || []).push(iso);
}
for (const k in SLOTSEEN) {
  const occ = SLOTSEEN[k].map(iso => ({ iso, row: D[iso] })).filter(o => (o.row[3] || o.row[4] || o.row[5] || o.row[6] || o.row[7]) && !LORD.some(x => String(o.row[0] || "").includes(x)));
  if (!occ.length) continue;
  occ.sort((a, b) => {
    const ao = inOverlay(a.iso) ? 1 : 0, bo = inOverlay(b.iso) ? 1 : 0;
    if (ao !== bo) return ao - bo;
    return a.iso < b.iso ? 1 : -1;
  });
  SLOTMAP[k] = occ[0].row;
}
// FERIAL: ferial-labeled only; Nº majority; tie -> formula-Nº; row: majority sig, then non-overlay newest.
// memorial-in-disguise donors fill keys with NO plain donor: OT keys (Nº == formula) + JAN keys.
const ferialGroups = {};
// memorials with proper gospel/alleluia content: never donate ferial readings (explicit hybrid branches own them)
const NO_DONATE = { "01-26": 1, "06-11": 1, "07-29": 1, "09-15": 1, "10-02": 1, "08-29": 1 };
const plainKeys = new Set();
function addFerialDonor(iso, row) {
  const k = ferialKey(iso);
  if (!k) return;
  if (!ferialGroups[k]) ferialGroups[k] = new Map();
  const m = ferialGroups[k];
  if (!m.has(row[2])) m.set(row[2], { count: 0, rows: [] });
  const e = m.get(row[2]);
  e.count++;
  e.rows.push({ iso, row });
}
function slotIgnored(slot) { return slot && (/epiphany/i.test(slot.id) || /baptism/i.test(slot.id)); }
for (const iso of isos) {
  const C = lyFor(iso);
  const _sl = C.byDate.get(parseIso(iso).getTime());
  if (_sl && !slotIgnored(_sl)) continue;
  if (parseIso(iso).getUTCDay() === 0) continue;
  const r = D[iso];
  if (!r[3] && !r[4] && !r[5] && !r[6] && !r[7]) continue;
  if (rankOf(r[0]) !== "-") continue;
  addFerialDonor(iso, r);
  plainKeys.add(ferialKey(iso));
}
// memorial-in-disguise: keys with no plain donor (OT: Nº == formula; JAN: any memorial content)
for (const iso of isos) {
  const C = lyFor(iso);
  const _sl2 = C.byDate.get(parseIso(iso).getTime());
  if (_sl2 && !slotIgnored(_sl2)) continue;
  if (parseIso(iso).getUTCDay() === 0) continue;
  const r = D[iso];
  if (!r[3] && !r[4] && !r[5] && !r[6] && !r[7]) continue;
  const rk = rankOf(r[0]);
  const _isDopRow = /Day of Prayer/.test(r[0]);
  if ((rk !== "M" && rk !== "mM") && !_isDopRow) continue;
  const k = ferialKey(iso);
  if (!k || plainKeys.has(k)) continue;
  if (NO_DONATE[iso.slice(5)]) continue;
  if (/^JAN/.test(k)) { addFerialDonor(iso, r); continue; }
  const m = k.match(/^OT:(I|II):(\d+):(\d)$/);
  if (m && r[2] === otFormulaNo(m[1], +m[2], +m[3])) addFerialDonor(iso, r);
}
const nonOvNewestIso = (rows) => {
  const pool = rows.some(o => !inOverlay(o.iso)) ? rows.filter(o => !inOverlay(o.iso)) : rows;
  return pool.map(o => o.iso).sort().pop();
};
const FERIAL = {};
for (const k in ferialGroups) {
  const m = k.match(/^OT:(I|II):(\d+):(\d)$/);
  const formula = m ? otFormulaNo(m[1], +m[2], +m[3]) : null;
  const arr = [...ferialGroups[k].entries()].sort((a, b) =>
    b[1].count - a[1].count ||
    ((b[0] === formula) - (a[0] === formula)));
  const win = arr[0][1];
  const bySig = new Map();
  for (const o of win.rows) {
    const s = sigOf(o.row);
    if (!bySig.has(s)) bySig.set(s, []);
    bySig.get(s).push(o);
  }
  const hasNonOv = (arr) => arr.some(o => !inOverlay(o.iso)) ? 1 : 0;
  const sarr = [...bySig.values()].sort((a, b) =>
    b.length - a.length ||
    (hasNonOv(b) - hasNonOv(a)) ||
    (nonOvNewestIso(a) > nonOvNewestIso(b) ? -1 : nonOvNewestIso(a) < nonOvNewestIso(b) ? 1 : 0));
  const srows = sarr[0].slice().sort((a, b) => {
    const ao = inOverlay(a.iso) ? 1 : 0, bo = inOverlay(b.iso) ? 1 : 0;
    if (ao !== bo) return ao - bo;
    return a.iso < b.iso ? 1 : -1;
  });
  const _fr0 = srows[0].row.slice();
  if (/^\d+:/.test(_fr0[4])) _fr0[4] = "Psalm " + _fr0[4];
  FERIAL[k] = _fr0;
}
// FIXED (drop movables + transfer sources)
const TRANSFER_SRC = { "03-19": 1, "03-25": 1, "12-08": 1, "12-09": 1 };
const MOVABLE_RE = /Mother of the Church|Immaculate Heart|Sacred Heart/i;
const mmddLabels = {};
for (const iso of isos) {
  const C = lyFor(iso);
  const _r0x = D[iso];
  const _isLordSun = parseIso(iso).getUTCDay() === 0 && LORD.some(x => String(_r0x[0] || "").includes(x));
  if (C.byDate.get(parseIso(iso).getTime()) && !_isLordSun) continue;
  if (parseIso(iso).getUTCDay() === 0 && !_isLordSun) continue;
  const mmdd = iso.slice(5);
  if (TRANSFER_SRC[mmdd]) continue;
  const tob = transferObs(+iso.slice(0, 4));
  if (iso === tob.josephObs || iso === tob.annObs || iso === tob.immacObs) continue;
  const r = D[iso];
  const rk = rankOf(r[0]);
  if (rk === "-" || rk === "?") continue;
  if (MOVABLE_RE.test(r[0])) continue;
  (mmddLabels[mmdd] = mmddLabels[mmdd] || []).push({ iso, row: r });
}
const FIXED = {};
function fxLabel(mmdd, year) {
  const fx = FIXED[mmdd];
  if (!fx) return null;
  return (fx.labelsByYear && fx.labelsByYear[year]) || fx.label;
}
for (const mmdd in mmddLabels) {
  const occ = mmddLabels[mmdd];
  const labelsByYear = {};
  for (const o of occ) labelsByYear[o.iso.slice(0, 4)] = o.row[0];
  const nonOv = occ.filter(o => !inOverlay(o.iso));
  const label = (nonOv.length ? nonOv : occ).map(o => o.row[0]).sort().pop();
  let color = "";
  for (const o of [...occ].sort((a, b) => a.iso < b.iso ? -1 : 1)) if (o.row[1]) color = o.row[1];
  const nonEmpty = occ.filter(o => o.row[3] || o.row[4] || o.row[5] || o.row[6] || o.row[7]);
  const properVotes = [];
  let ferialVotes = 0;
  for (const o of nonEmpty) {
    const k = ferialKey(o.iso);
    const fr = k && FERIAL[k];
    if (fr && fr[2] === o.row[2]) ferialVotes++;
    else {
      const m = k && k.match(/^OT:(I|II):(\d+):(\d)$/);
      if (m && o.row[2] === otFormulaNo(m[1], +m[2], +m[3])) ferialVotes++;
      else properVotes.push(o);
    }
  }
  const bySig = new Map();
  for (const o of properVotes) {
    const s = sigOf(o.row);
    if (!bySig.has(s)) bySig.set(s, []);
    bySig.get(s).push(o);
  }
  const maxShared = Math.max(0, ...[...bySig.values()].map(v => v.length));
  const type = (properVotes.length >= 2 || (properVotes.length >= 1 && ferialVotes === 0)) ? "proper" : "ferial";
  let template = null;
  if (type === "proper") {
    const pool = [...bySig.entries()].sort((a, b) => b[1].length - a[1].length || (a[1][a[1].length-1].iso < b[1][b[1].length-1].iso ? 1 : -1))[0][1];
    pool.sort((a, b) => {
      const ao = inOverlay(a.iso) ? 1 : 0, bo = inOverlay(b.iso) ? 1 : 0;
      if (ao !== bo) return ao - bo;
      return a.iso < b.iso ? 1 : -1;
    });
    template = pool[0].row;
  }
  FIXED[mmdd] = { label, color, rank: rankOf(label), lud: LORD.some(x => label.includes(x)), occ: occ.map(o => o.iso), type, template, maxShared, properVotes: properVotes.length, ferialVotes, labelsByYear };
}
// CSV gap-fill map
// vendor leaves some festal colors blank (""); Luke the Evangelist is red (cf. DAILY_FILL 2027-10-18)
if (FIXED["10-18"] && !FIXED["10-18"].color) FIXED["10-18"].color = "red";
const csvRows = JSON.parse(await fs.readTextFile("src/tools/csv-rows.json"));
const CSV = {}; // num -> cyc -> {first, psalm, second, gospel}
for (const r of csvRows) {
  const c = String(r.cyc);
  if (!CSV[r.num]) CSV[r.num] = {};
  if (!CSV[r.num][c]) CSV[r.num][c] = { first: "", psalm: "", second: "", gospel: "" };
  const e = CSV[r.num][c];
  if (r.type === "G") e.gospel = e.gospel || r.cit;
  else if (r.type === "PS") e.psalm = e.psalm || r.cit;
  else if (r.type === "NT") { if (!e.first) e.first = r.cit; else if (!e.second) e.second = r.cit; }
  else if (r.type === "OT") e.first = e.first || r.cit;
}
function csvReadings(num, cycKey) {
  // merge: wildcard ("1+2"/"ABC") base overlaid by cycle-specific entry
  const m = CSV[num];
  if (!m) return null;
  const want = cycKey === "I" ? "1" : cycKey === "II" ? "2" : cycKey;
  const base = m["1+2"] || m["ABC"] || null;
  const spec = m[want] || m[String(want).toLowerCase()] || null;
  if (!spec && !base) return null;
  const g = (f) => (spec && spec[f]) || (base && base[f]) || "";
  const out = { first: g("first"), psalm: g("psalm"), second: g("second"), gospel: g("gospel") };
  return (out.first || out.psalm || out.second || out.gospel) ? out : null;
}

// explicit templates R = (iso) => D row
const R = (iso) => D[iso];
const TPL = {
  epiphany: R("2027-01-03"),
  baptismMonA: R("2023-01-09"), baptismMonB: R("2024-01-08"),
  baptismSunA: R("2026-01-11"), baptismSunB: R("2027-01-10"), baptismSunC: R("2025-01-12"),
  holyFamA: R("2025-12-28"), holyFamB: R("2026-12-27"), holyFamC: R("2024-12-29"),
  jan1: R("2026-01-01"),
  christmas: ["The Nativity of the Lord (Christmas)", "white", 16, "Isaiah 52:7-10", "Psalm 98:1, 2-3, 3-4, 5-6", "Hebrews 1:1-6", "", "John 1:1-18"],
  assumption: ["Solemnity of the Assumption of the Blessed Virgin Mary (Mass during the Day)", "white", 622, "Revelation 11:19a; 12:1-6a, 10ab", "Psalm 45:10, 11, 12, 16", "1 Corinthians 15:20-27", "", "Luke 1:39-56"],
  pentecost: ["Pentecost Sunday (Mass during the Day)", "red", 63, "Acts 2:1-11", "Psalm 104:1, 24, 29-30, 31, 34", "1 Corinthians 12:3b-7, 12-13", "", "John 20:19-23"],
  holyThursday: ["Holy Thursday — Mass of the Lord's Supper", "white", 39, "Exodus 12:1-8, 11-14", "Psalm 116:12-13, 15-16bc, 17-18", "1 Corinthians 11:23-26", "", "John 13:1-15"],
  joseph: R("2027-03-19"), annunciation: R("2027-04-05"), immaculate: R("2026-12-08"),
  allSouls: R("2026-11-02"),
  thanksgiving: ["Thanksgiving Day", "white", 506, "", "", "", "", ""],
  dayOfPrayerLabel: "Day of Prayer for the Legal Protection of Unborn Children",
  maryMother: R("2027-05-17"),
  ihLabel: "Memorial of the Immaculate Heart of the Blessed Virgin Mary",
  ihAlleluia: "See Luke 2:19", ihGospel: "Luke 2:41-51",
  ascensionA: { r: ["The Ascension of the Lord", "white", 58, "Acts 1:1-11", "Psalm 47:2-3, 6-7, 8-9", "Ephesians 1:17-23", "", "Matthew 28:16-20"] },
  ascensionB: { r: ["The Ascension of the Lord", "white", 58, "Acts 1:1-11", "Psalm 47:2-3, 6-7, 8-9", "Ephesians 1:17-23", "", "Mark 16:15-20"] },
  easter7A: R("2026-05-17"),
  nativity: R("2024-06-24"),
  peterPaul: R("2026-06-29"),
  sacredHeartA: R("2026-06-12"), sacredHeartB: R("2024-06-07"), sacredHeartC: R("2025-06-27"),
  stephen: R("2026-12-26"), john: R("2025-12-27"), innocents: R("2026-12-28"),
  oct29: R("2025-12-29"), oct30: R("2026-12-30"), oct31: R("2026-12-31"),
  ashWed: R("2027-02-10"),
  goodFriday: R("2026-04-03"),
  vigilA: R("2026-04-04"), vigilB: R("2024-03-30"), vigilC: R("2025-04-19"),
  transfigA: R("2026-08-06"), transfigB: R("2024-08-06"), transfigC: R("2025-08-06"),
  barnabasFirst: "Acts 11:21b-26; 13:1-3", barnabasPsalm: "Psalm 98:1, 2-3ab, 3cd-4, 5-6",
  timothyFirst: "2 Timothy 1:1-8", timothyPsalm: "Psalm 96:1-2a, 2b-3, 7-8a, 10",
  mercyLabel: "Second Sunday of Easter (or Sunday of Divine Mercy)",
  lent3A: SLOTMAP["lent:lent-3:A"], lent4A: SLOTMAP["lent:lent-4:A"], lent5A: SLOTMAP["lent:lent-5:A"],
};
TPL.easter7B = (() => {
  const s = M.buildSlots(2024).slots.find(x => x.kind === "easter" && /easter-7/.test(String(x.id)));
  const r = (M.readingsForCycle(s, "B") || {});
  const txt = (v) => M.readingText(v, "B");
  return ["Seventh Sunday of Easter", "white", 60, txt(r.first), txt(r.psalm), txt(r.second), "", txt(r.gospel)];
})();
if (/^\d+:/.test(TPL.nativity[4])) TPL.nativity = [TPL.nativity[0], TPL.nativity[1], TPL.nativity[2], TPL.nativity[3], "Psalm " + TPL.nativity[4], TPL.nativity[5], TPL.nativity[6], TPL.nativity[7]];
TPL.easter7C = (() => {
  const s = M.buildSlots(2025).slots.find(x => x.kind === "easter" && /easter-7/.test(String(x.id)));
  const r = (M.readingsForCycle(s, "C") || {});
  const txt = (v) => M.readingText(v, "C");
  return ["Seventh Sunday of Easter", "white", 61, txt(r.first), txt(r.psalm), txt(r.second), "", txt(r.gospel)];
})();
TPL.ascensionC = (() => {
  const c = csvReadings(58, "C");
  return ["The Ascension of the Lord", "white", 58, "Acts 1:1-11", "Psalm 47:2-3, 6-7, 8-9", (c && c.second) || "Ephesians 1:17-23", "", (c && c.gospel) || "Luke 24:46-53"];
})();
TPL.baptismMonC = ["The Baptism of the Lord", "white", 21, "Isaiah 42:1-4, 6-7", "Psalm 29:1-2, 3-4, 3, 9-10", "", "Cf. Mark 9:7", "Luke 3:15-16, 21-22"];

function canonFerial(iso, key, row) {
  const [kind, a, b, c] = key.split(":");
  const wd = WD[+c !== undefined && kind !== "ADVFIX" && kind !== "XMAS" && kind !== "JANPRE" ? + (key.split(":").pop()) : parseIso(iso).getUTCDay()];
  return row;
}
function ferialLabel(iso, key) {
  const parts = key.split(":");
  const kind = parts[0];
  const wd = WD[parseIso(iso).getUTCDay()];
  if (kind === "OT") return `${wd} of the ${ORDN[+parts[2]]} Week in Ordinary Time`;
  if (kind === "ADV") return `${wd} of the ${ORDN[+parts[1]]} Week of Advent`;
  if (kind === "ADVFIX") {
    if (parts[1] === "12-24") return `${wd} of the Fourth Week of Advent Mass in the Morning`;
    const y = +iso.slice(0, 4);
    const xmas = new Date(Date.UTC(y, 11, 25));
    const adv1 = new Date(xmas.getTime() - (21 + xmas.getUTCDay()) * 86400000);
    const w = Math.floor((parseIso(iso).getTime() - adv1.getTime()) / 86400000 / 7) + 1;
    return `${wd} of the ${ORDN[w] || "Third"} Week of Advent`;
  }
  if (kind === "XMAS") {
    const d = { "12-29": "Fifth", "12-30": "Sixth", "12-31": "Seventh" }[parts[1]];
    if (d) return `The ${d} Day in the Octave of Christmas`;
    return "Christmas Weekday";
  }
  if (kind === "JANPRE") return "Christmas Weekday";
  if (kind === "JANPOS") return `${wd} after Epiphany`;
  if (kind === "LENT") {
    if (parts[1] === "0") return `${wd} after Ash Wednesday`;
    // vendor consistently uses "in Lent" for Wed/Thu of week 1 (all years); "of" elsewhere
    const useIn = parts[1] === "1" && (parts[2] === "3" || parts[2] === "4");
    return `${wd} of the ${ORDN[+parts[1]]} Week ${useIn ? "in" : "of"} Lent`;
  }
  if (kind === "HOLY") return `${wd} of Holy Week`;
  if (kind === "OCT") return `${wd} in the Octave of Easter`;
  if (kind === "EAST") {
    if (parts[1] === "7" && parts[2] === "6") return "Saturday of the Seventh Week of Easter - Mass in the Morning";
    return `${wd} of the ${ORDN[+parts[1]]} Week of Easter`;
  }
  return null;
}
const SEASON_COLOR = { OT: "green", ADV: "violet", ADVFIX: "violet", LENT: "violet", HOLY: "violet", EAST: "white", OCT: "white", XMAS: "white", JANPRE: "white", JANPOS: "white" };

// ---------- predict ----------
function predict(iso) {
  const d = parseIso(iso), wd = d.getUTCDay(), mmdd = iso.slice(5);
  const C = lyFor(iso), L = C.ly.dates, cycle = C.ly.cycle, par = C.ey % 2 === 1 ? "I" : "II";
  const eph = isoOf(C.epiphSun), bap = isoOf(C.baptism), hf = isoOf(C.holyFamily);
  const t = d.getTime();
  const corpusSun = C.slots.filter(s => s.kind === "solemnity" && /corpus|body and blood/i.test(s.name)).map(s => isoOf(s.date))[0];
  const shFri = corpusSun ? isoOf(addD(parseIso(corpusSun), 5)) : null;
  const ihSat = shFri ? isoOf(addD(parseIso(shFri), 1)) : null;
  const pentecostSun = isoOf(L.pentecost);
  const ascThu = isoOf(addD(L.easter, 39));
  const maryMon = isoOf(addD(L.pentecost, 1));
  const easterMon = isoOf(addD(L.easter, 1));
  const octaveSun = isoOf(addD(L.easter, 7));
  // thanksgiving: 4th Thursday of November
  const nov1 = new Date(Date.UTC(d.getUTCFullYear(), 10, 1));
  const thanks = isoOf(addD(nov1, ((4 - nov1.getUTCDay() + 7) % 7) + 21));
  // day of prayer
  let dop = d.getUTCFullYear() + "-01-22";
  if (parseIso(dop).getUTCDay() === 0) dop = d.getUTCFullYear() + "-01-23";
  // transfers
  const mar19 = d.getUTCFullYear() + "-03-19";
  const josephObs = parseIso(mar19).getUTCDay() === 0 ? isoOf(addD(parseIso(mar19), 1)) : mar19;
  const mar25 = d.getUTCFullYear() + "-03-25";
  let annObs;
  {
    const a = parseIso(mar25), awd = a.getUTCDay();
    const inHoly = a.getTime() >= addD(L.palmSunday, 0).getTime() && a.getTime() <= addD(L.easter, 7).getTime();
    if (awd === 0 && !inHoly) annObs = isoOf(addD(a, 1));
    else if (inHoly) annObs = isoOf(addD(L.easter, 8));
    else annObs = mar25;
  }
  const dec8 = d.getUTCFullYear() + "-12-08";
  const immacObs = parseIso(dec8).getUTCDay() === 0 ? isoOf(addD(parseIso(dec8), 1)) : dec8;

  const mkRow = (feast, color, lect, first, psalm, second, alleluia, gospel) => [feast, color, lect, first, psalm, second, alleluia, gospel];
  const year = d.getUTCFullYear();
  // ferial base for hybrid memorials: clean FERIAL consensus, else CSV formula (NO_DONATE keeps hybrids out of FERIAL)
  const ferialBase = (key) => {
    if (key && FERIAL[key]) return FERIAL[key];
    const m = key && key.match(/^OT:(I|II):(\d+):(\d)$/);
    if (m) {
      const num = otFormulaNo(m[1], +m[2], +m[3]);
      const c = csvReadings(num, m[1]);
      if (c) return [null, "green", num, c.first, c.psalm, c.second, "", c.gospel];
    }
    const am = key && key.match(/^ADV:(\d+):(\d)$/);
    if (am) {
      const num = 174 + (+am[1] - 1) * 6 + (+am[2]);
      const c = csvReadings(num, par);
      if (c) return [null, "violet", num, c.first, c.psalm, c.second, "", c.gospel];
    }
    return null;
  };
  const resolveFerial = (label, color, key) => {
    const r = key && FERIAL[key];
    if (r) return mkRow(label, color || r[1] || SEASON_COLOR[key.split(":")[0]] || "green", r[2], r[3], r[4], r[5], r[6], r[7]);
    const m = key && key.match(/^OT:(I|II):(\d+):(\d)$/);
    if (m) {
      const num = otFormulaNo(m[1], +m[2], +m[3]);
      const c = csvReadings(num, m[1]);
      if (c) return mkRow(label, color || "green", num, c.first, c.psalm, c.second, "", c.gospel);
    }
    const am = key && key.match(/^ADV:(\d+):(\d)$/);
    if (am) {
      const num = 174 + (+am[1] - 1) * 6 + (+am[2]);
      const c = csvReadings(num, par);
      if (c) return mkRow(label, color || "violet", num, c.first, c.psalm, c.second, "", c.gospel);
    }
    return null;
  };

  // 1. transfers & explicit solemnities (before slots)
  if (iso === josephObs) { const r = TPL.joseph; return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === annObs) { const r = TPL.annunciation; return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === immacObs) { const r = TPL.immaculate; return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === thanks) return TPL.thanksgiving.slice();
  if (iso === d.getUTCFullYear() + "-11-02") { const r = TPL.allSouls; return mkRow(r[0], r[1] || "violet", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === eph) { const r = TPL.epiphany; return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === bap) {
    const isSun = wd === 0;
    const key = isSun ? "Sun" + cycle : "Mon" + cycle;
    const map = { MonA: TPL.baptismMonA, MonB: TPL.baptismMonB, MonC: TPL.baptismMonC, SunA: TPL.baptismSunA, SunB: TPL.baptismSunB, SunC: TPL.baptismSunC };
    const r = map[key];
    if (Array.isArray(r)) return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]);
    return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]);
  }
  if (iso === hf) {
    const r = TPL["holyFam" + cycle];
    return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]);
  }
  if (iso === d.getUTCFullYear() + "-01-01") { const r = TPL.jan1; return mkRow(r[0], "white", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === d.getUTCFullYear() + "-12-25") return TPL.christmas.slice();
  if (iso === d.getUTCFullYear() + "-08-15") return TPL.assumption.slice();
  if (iso === d.getUTCFullYear() + "-11-01") { const r = R("2026-11-01"); return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === d.getUTCFullYear() + "-06-29") { const r = TPL.peterPaul; return mkRow(r[0], r[1] || "red", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === d.getUTCFullYear() + "-06-24") { const r = TPL.nativity; return mkRow(r[0], r[1] || "white", 587, r[3], r[4], r[5], r[6], r[7]); }
  if (iso === shFri) { const r = TPL["sacredHeart" + cycle]; return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === pentecostSun) return TPL.pentecost.slice();
  if (iso === maryMon) { const r = TPL.maryMother; return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === ascThu) {
    const r = TPL["ascension" + cycle];
    const row = r.r || r;
    return row.slice();
  }
  if (iso === isoOf(addD(L.easter, -1))) {
    const r = TPL["vigil" + cycle];
    return mkRow("Holy Saturday At the Easter Vigil in the Holy Night of Easter", r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]);
  }
  if (t >= addD(L.ashWednesday, 0).getTime() && iso < isoOf(L.ashWednesday)) { /* pre-ash: fall through */ }
  if (isoOf(L.ashWednesday) === iso) { const r = TPL.ashWed; return mkRow(r[0], r[1] || "violet", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (isoOf(L.holyThursday) === iso) return TPL.holyThursday.slice();
  if (iso === d.getUTCFullYear() + "-12-26") { const r = TPL.stephen; return mkRow(r[0], r[1] || "red", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === d.getUTCFullYear() + "-12-27") { const r = TPL.john; return mkRow(r[0], r[1] || "white", r[2], r[3], r[4], r[5], r[6], r[7]); }
  if (iso === d.getUTCFullYear() + "-12-28") { const r = TPL.innocents; return mkRow(r[0], r[1] || "red", r[2], r[3], r[4], r[5], r[6], r[7]); }
  // transfiguration: proper feast any day (supersedes Sunday); Nº614, cycle gospel
  if (mmdd === "08-06") { const r = TPL["transfig" + cycle]; return mkRow(r[0], r[1] || "white", 614, r[3], r[4], r[5], r[6], r[7]); }

  // day of prayer (label + ferial of day, CSV rescue)
  const fk = ferialKey(iso);
  const fr = ferialBase(fk);
  if (iso === dop) return resolveFerial(TPL.dayOfPrayerLabel, "white", fk);
  // immaculate heart saturday
  if (iso === ihSat) {
    const fx = FIXED[mmdd];
    // a recurring fixed memorial/feast on this date displaces IH (one-off IH-labeled FIXED entries don't count)
    const coincide = fx && (fx.rank === "M" || fx.rank === "mM" || fx.rank === "F") && fx.occ && fx.occ.length >= 2;
    if (!coincide && fr) return mkRow(TPL.ihLabel, "white", fr[2], fr[3], fr[4], "", TPL.ihAlleluia, TPL.ihGospel);
    const fb = resolveFerial(coincide ? ferialLabel(iso, fk) : TPL.ihLabel, coincide ? null : "white", fk);
    if (fb) {
      if (!coincide) return mkRow(TPL.ihLabel, "white", fb[2], fb[3], fb[4], "", TPL.ihAlleluia, TPL.ihGospel);
      return fb;
    }
    return null;
  }
  // barnabas hybrid (proper first+psalm, ferial alleluia+gospel, Nº580)
  if (mmdd === "06-11" && wd !== 0) {
    const fb0 = ferialBase(fk);
    if (fb0) return mkRow(fxLabel("06-11", year) || "Memorial of Saint Barnabas, Apostle", (FIXED["06-11"] && FIXED["06-11"].color) || "red", 580, TPL.barnabasFirst, TPL.barnabasPsalm, "", fb0[6], fb0[7]);
    return null;
  }
  // timothy & titus hybrid (proper first+psalm Nº520, ferial alleluia+gospel)
  if (mmdd === "01-26" && wd !== 0 && fr) {
    return mkRow(fxLabel("01-26", year) || "Memorial of Saints Timothy and Titus, Bishops", "white", 520, TPL.timothyFirst, TPL.timothyPsalm, "", fr[6], fr[7]);
  }
  // martha hybrid (ferial day + proper alleluia+gospel)
  if (mmdd === "07-29" && wd !== 0 && fr) {
    return mkRow(fxLabel("07-29", year) || "Memorial of Saints Martha, Mary, and Lazarus", "white", fr[2], fr[3], fr[4], "", "John 8:12", "John 11:19-27");
  }
  // guardian angels hybrid (ferial day + proper alleluia+gospel)
  if (mmdd === "10-02" && wd !== 0 && fr) {
    return mkRow(fxLabel("10-02", year) || "Memorial of the Holy Guardian Angels", "white", fr[2], fr[3], fr[4], "", "Psalm 103:21", "Matthew 18:1-5, 10");
  }
  // our lady of sorrows hybrid (ferial day + proper gospel)
  if (mmdd === "09-15" && wd !== 0 && fr) {
    return mkRow(fxLabel("09-15", year) || "Memorial of Our Lady of Sorrows", "white", fr[2], fr[3], fr[4], "", "", "John 19:25-27");
  }
  // passion of john the baptist hybrid (ferial day + proper alleluia+gospel)
  if (mmdd === "08-29" && wd !== 0 && fr) {
    return mkRow(fxLabel("08-29", year) || "Memorial of the Passion of Saint John the Baptist", "red", fr[2], fr[3], fr[4], "", "Matthew 5:10", "Mark 6:17-29");
  }

  // 2. slots (LP epiphany/baptism fixed-date slots ignored: explicit branches own those days)
  const slot0 = C.byDate.get(t);
  const slot = slotIgnored(slot0) ? null : slot0;
  if (slot) {
    const sk = slot.kind + ":" + slot.id + ":" + cycle;
    // feasts of the Lord supersede Sundays (Presentation, Transfiguration, Exaltation, Lateran...)
    if (wd === 0) {
      const fx0 = FIXED[mmdd];
      if (fx0 && fx0.rank === "F" && fx0.lud && fx0.type === "proper" && fx0.template) {
        const r0 = fx0.template;
        return mkRow(fxLabel(mmdd, year) || r0[0], fx0.color || r0[1] || "white", r0[2], r0[3], r0[4], r0[5], r0[6], r0[7]);
      }
    }
    // Lent 3/4/5: Year-A scrutiny readings every cycle (hoisted: covers cycle-C SLOTMAP gaps too)
    if (cycle !== "A" && /^lent-[345]$/.test(slot.id)) {
      const r = TPL[{ "lent-3": "lent3A", "lent-4": "lent4A", "lent-5": "lent5A" }[slot.id]];
      if (r) return [r[0], r[1] || slot.color || "violet", r[2], r[3], r[4], r[5], r[6], r[7]];
    }
    // Easter 7: canonical label + cycle readings (TPL.easter7B rebuilt from LP, not the "2027-05-09" shell row)
    if (/easter-7/.test(slot.id)) {
      const r = TPL["easter7" + cycle];
      if (r) {
        const ecol = r[1] || slot.color || "white";
        if (iso === octaveSun) return [TPL.mercyLabel, ecol, r[2], r[3], r[4], r[5], r[6], r[7]];
        return [r[0], ecol, r[2], r[3], r[4], r[5], r[6], r[7]];
      }
    }
    const srow = SLOTMAP[sk];
    if (srow) {
      const scol = srow[1] || slot.color || null;
      if (iso === octaveSun) return [TPL.mercyLabel, scol || "white", srow[2], srow[3], srow[4], srow[5], srow[6], srow[7]];
      return [srow[0], scol, srow[2], srow[3], srow[4], srow[5], srow[6], srow[7]];
    }
    // gap fallback: LectionaryProject readings
    const r = M.readingsForCycle(slot, cycle) || {};
    const txt = (v) => M.readingText(v, cycle);
    let lect = null;
    const idm = String(slot.id).match(/(\d+)$/);
    if (/lent-3/.test(sk)) lect = 28;
    else if (/lent-4/.test(sk)) lect = 31;
    else if (/lent-5/.test(sk)) lect = 34;
    else if (/easter-7/.test(sk)) lect = { A: 59, B: 60, C: 61 }[cycle];
    else if (/ot2-13/.test(sk)) lect = { A: 97, B: 98, C: 99 }[cycle];
    else if (/ot1-9/.test(sk)) lect = { A: 85, B: 86, C: 87 }[cycle]; // 9th Sunday: too-late Easter, never in vendor range
    else {
      // ordinary-Sunday Nºs step +1 per cycle (A<B<C); interpolate from a sibling cycle
      const ord = { A: 0, B: 1, C: 2 };
      for (const cc of ["A", "B", "C"]) {
        const sib = SLOTMAP[slot.kind + ":" + slot.id + ":" + cc];
        if (sib && sib[2] != null) { lect = sib[2] + (ord[cycle] - ord[cc]); break; }
      }
    }
    return [slot.name, slot.color || null, lect, txt(r.first), txt(r.psalm), txt(r.second), "", txt(r.gospel)];
  }

  // 3. fixed feasts on weekdays
  const fx = FIXED[mmdd];
  if (fx && wd !== 0) {
    // suppressed in holy week/triduum/octave/dec17-24 (ferial branches own those dates)
    const inHoly = t >= addD(L.palmSunday, 0).getTime() && t < addD(L.easter, 7).getTime();
    const inAdv = mmdd >= "12-17" && mmdd <= "12-24";
    // Lenten weekdays suppress memorials (feasts like Chair are celebrated)
    const inLentOrd = t >= addD(L.ashWednesday, 0).getTime() && t < addD(L.easter, 0).getTime();
    if (!inHoly && !inAdv && !(inLentOrd && (fx.rank === "M" || fx.rank === "mM"))) {
      if (fx.type === "proper" && fx.template) {
        const r = fx.template;
        return mkRow(fxLabel(mmdd, year) || r[0], fx.color || r[1] || (fx.rank === "mM" ? "red" : "white"), r[2], r[3], r[4], r[5], r[6], r[7]);
      }
      if (fx.type === "ferial") return resolveFerial(fxLabel(mmdd, year) || fx.label, fx.color || (fx.rank === "mM" ? "red" : "white"), fk);
    }
  }
  // 4. plain ferial (CSV rescue inside resolveFerial)
  if (fk) {
    const r = resolveFerial(ferialLabel(iso, fk), null, fk);
    if (r) return r;
  }
  return null;
}

// ---------- effective (what dailyFor returns today) ----------
const FEAST_FILL = {
  holyThursday: ["Holy Thursday — Mass of the Lord's Supper", "white", 39, "Exodus 12:1-8, 11-14", "Psalm 116:12-13, 15-16, 17-18", "1 Corinthians 11:23-26", "", "John 13:1-15"],
  christmas: ["The Nativity of the Lord (Christmas)", "white", 16, "Isaiah 52:7-10", "Psalm 98:1, 2-3, 3-4, 5-6", "Hebrews 1:1-6", "", "John 1:1-18"],
  pentecost: ["Pentecost Sunday (Mass during the Day)", "red", 63, "Acts 2:1-11", "Psalm 104:1, 24, 29-30, 31, 34", "1 Corinthians 12:3b-7, 12-13", "", "John 20:19-23"],
  assumption: ["Solemnity of the Assumption of the Blessed Virgin Mary (Mass during the Day)", "white", 622, "Revelation 11:19a; 12:1-6a, 10ab", "Psalm 45:10, 11, 12, 16", "1 Corinthians 15:20-27", "", "Luke 1:39-56"],
};
const FEAST_FILL_DATES = { "2023-04-06": "holyThursday", "2024-03-28": "holyThursday", "2025-04-17": "holyThursday", "2023-12-25": "christmas", "2024-12-25": "christmas", "2025-12-25": "christmas", "2026-12-25": "christmas", "2023-05-28": "pentecost", "2024-05-19": "pentecost", "2025-06-08": "pentecost", "2023-08-15": "assumption", "2024-08-15": "assumption", "2025-08-15": "assumption", "2026-08-15": "assumption", "2027-08-15": "assumption" };
const FEAST_FIX = { "2023-01-31": "Memorial of Saint John Bosco, Priest", "2023-05-25": "Thursday of the Seventh Week of Easter", "2025-06-01": "Seventh Sunday of Easter", "2027-03-25": "Holy Thursday — Mass of the Lord's Supper", "2027-05-09": "Seventh Sunday of Easter" };
const dcSrc = await fs.readTextFile("src/daily-citations.js");
const dfMatch = dcSrc.match(/const DAILY_FILL = (\{[\s\S]*?\n\};)/);
const DAILY_FILL = dfMatch ? new Function("return (" + dfMatch[1].replace(/\};\s*$/, "}") + ")")() : {};
function effective(iso) {
  const fill = FEAST_FILL_DATES[iso];
  if (fill) return FEAST_FILL[fill].slice();
  const row = D[iso];
  if (!row) return null;
  let [feast, color, lect, first, psalm, second, alleluia, gospel] = row;
  if (FEAST_FIX[iso]) feast = FEAST_FIX[iso];
  const df = DAILY_FILL[iso];
  if (df && !first && !psalm && !second && !alleluia && !gospel) {
    [color, first, psalm, second, alleluia, gospel] = df;
  }
  return [feast, color, lect, first, psalm, second, alleluia, gospel];
}

// validation
const mismN = [], mismL = [], mismC = [], nullEff = [], nullPred = [];
for (const iso of isos) {
  // skip DAILY_FILL-covered empties: reconstruct from daily-citations? use source-empty as null
  const eff = effective(iso);
  const p = predict(iso);
  const srcRow = D[iso];
  const srcEmpty = !srcRow[3] && !srcRow[4] && !srcRow[5] && !srcRow[6] && !srcRow[7];
  if (!eff || (srcEmpty && eff[3] === "" && eff[4] === "" && eff[5] === "" && eff[6] === "" && eff[7] === "")) { nullEff.push(iso); continue; }
  if (!p) { nullPred.push(iso); continue; }
  // compare Nº + citations normalized
  const sameN = eff[2] === p[2] && sigOf(eff) === sigOf(p);
  if (!sameN) mismN.push(iso + " Nº" + eff[2] + "→" + p[2] + " [" + colDiff(eff, p) + "] | " + eff[0].slice(0, 40) + " || " + [eff[3], eff[7]].join("/").slice(0, 60) + "  ~~  " + [p[3], p[7]].join("/").slice(0, 60));
  else {
    if (normLab(eff[0]) !== normLab(p[0])) mismL.push(iso + " [" + eff[0].slice(0, 52) + "] ~~ [" + p[0].slice(0, 52) + "]");
    const nc = (s) => String(s || "").toLowerCase().replace(/[^a-z]+/g, "");
    if (eff[1] && p[1] && nc(eff[1]) !== nc(p[1])) mismC.push(iso + " " + eff[1] + "→" + p[1]);
  }
}
// memorial-gospel scan: memorial rows (non-hybrid) where pred is ferial-label with same Nº but different gospel
const HYB = { "01-26": 1, "06-11": 1, "07-29": 1, "09-15": 1, "10-02": 1, "06-24": 1, "06-29": 1 };
const hybridScan = [];
for (const iso of isos) {
  const r = D[iso];
  const rk = rankOf(r[0] || "");
  if (rk !== "M" && rk !== "mM") continue;
  if (HYB[iso.slice(5)]) continue;
  if (parseIso(iso).getUTCDay() === 0) continue;
  if (!r[3] && !r[4] && !r[5] && !r[6] && !r[7]) continue;
  const p = predict(iso);
  if (!p) continue;
  if (p[2] === r[2] && normCite(p[7]) !== normCite(r[7])) {
    const fx = FIXED[iso.slice(5)];
    hybridScan.push(iso + " Nº" + r[2] + " fx=" + (fx ? fx.type : "none") + " | " + r[0].slice(0, 44) + " || effG:" + r[7].slice(0, 30) + " vs ferG:" + p[7].slice(0, 30));
  }
}
// future sweep: every day 2027-11-01..2032-12-31 must resolve
const futNull = [];
{
  let d = parseIso("2027-11-01");
  const end = parseIso("2032-12-31");
  while (d <= end) {
    const iso = isoOf(d);
    if (!predict(iso)) futNull.push(iso);
    d = addD(d, 1);
  }
}
const report = {
  total: isos.length, nullEff: nullEff.length, nullPred,
  mismN: mismN.length, mismL: mismL.length, mismC: mismC.length,
  slotGaps: Object.keys(SLOTSEEN).filter(k => !SLOTMAP[k]),
  ferialKeys: Object.keys(FERIAL).length,
  fixedCount: Object.keys(FIXED).length,
  hybridScan: hybridScan.length, futNull: futNull.length,
};
await fs.writeTextFile("scratch/an6-report.json", JSON.stringify({ report, mismN, mismL, mismC, hybridScan, futNull }, null, 1));
return "VALIDATION\ntotal=" + report.total + " nullEff=" + report.nullEff + " nullPred=" + JSON.stringify(nullPred)
  + "\nmismN=" + mismN.length + "\n" + mismN.slice(0, 80).join("\n")
  + "\n\nmismL=" + mismL.length + "\n" + mismL.slice(0, 40).join("\n")
  + "\n\nmismC=" + mismC.length + "\n" + mismC.slice(0, 20).join("\n")
  + "\n\nhybridScan=" + hybridScan.length + "\n" + hybridScan.slice(0, 30).join("\n")
  + "\n\nfutNull=" + futNull.length + " " + JSON.stringify(futNull.slice(0, 20));
