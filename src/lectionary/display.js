// Layer 2 — Applied: full scripture display per translation (handled by translators).
// - Public-domain translators fetch RVR1909 (es) / KJV (en) / Almeida (pt) /
//   Riveduta 1927 (it) / Vulgata (la) / Segond 1910 (fr) / 文理和合 (zh) /
//   ADB 1905 (tl) / Viet 1934 (vi) / Smith-Van Dyke (ar) / KRV (ko)
//   from getbible.net (no key, cached in localStorage).
// - Deuterocanonical books (Wisdom, Sirach, Baruch, Tobit, Judith, Maccabees,
//   Dn 3 canticle…): only kjva (en) and vulgate (la) carry them on getbible.
//   Other languages get the citation + official licensed links (Layer 2 rule:
//   official lectionary texts are NEVER bundled — we link out).
// - Layer 1 (citations.json / DailyCitations) holds only citation_id strings.

export function usccbCode(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return mm + dd + yy;
}

// Licensed-source links per language (Layer 2 "translators" for official texts).
export function officialReadingLinks(getLang) {
  const code = usccbCode(new Date());
  const L = getLang();
  if (L === "es") return [
    { label: "📖 Texto oficial de hoy (USCCB)", url: `https://bible.usccb.org/es/bible/lecturas/${code}.cfm` },
    { label: "⛪ Misas · Desideria Manyanet", url: "https://desideria.manyanetcolombia.org/misas" },
    { label: "📅 Ciudad Redonda", url: "https://www.ciudadredonda.org/calendario-lecturas/" },
  ];
  if (L === "en") return [
    { label: "📖 Today's official readings (USCCB)", url: `https://bible.usccb.org/bible/readings/${code}.cfm` },
    { label: "⛪ Daily Mass · Desideria", url: "https://desideria.manyanetcolombia.org/misas" },
  ];
  if (L === "fr") return [{ label: "📖 Messes · AELF (officiel)", url: "https://www.aelf.org/messe" }];
  if (L === "it") return [{ label: "📖 Letture ufficiali (Chiesa Cattolica)", url: "https://www.chiesacattolica.it/liturgia-del-giorno/" }];
  if (L === "pt") return [{ label: "📖 Liturgia diária (CNBB)", url: "https://liturgiadiaria.cnbb.org.br/" }];
  if (L === "la") return [{ label: "📖 Nova Vulgata (Vaticanum)", url: "https://www.vatican.va/archive/bible/nova_vulgata/documents/nova-vulgata_index_lt.html" }];
  return [
    { label: "📖 USCCB Daily Readings", url: `https://bible.usccb.org/bible/readings/${code}.cfm` },
    { label: "⛪ Misas · Desideria Manyanet", url: "https://desideria.manyanetcolombia.org/misas" },
  ];
}

// Public-domain translations on getbible.net (verified abbreviations).
export const BIBLE_TRANS = {
  es: "valera", en: "kjv", pt: "almeida", it: "riveduta", la: "vulgate",
  fr: "ls1910", zh: "chiunl", tl: "tagalog", vi: "vietnamese", ar: "arabicsv", ko: "korean",
};
export const TRANS_NAME = {
  valera: "Reina-Valera 1909", kjv: "King James Version", kjva: "KJV + Apocrypha",
  almeida: "Almeida", riveduta: "Riveduta 1927", vulgate: "Vulgata Clementina",
  ls1910: "Louis Segond 1910", chiunl: "文理和合本", tagalog: "Ang Dating Biblia 1905",
  vietnamese: "Kinh Thánh 1934", arabicsv: "Smith–Van Dyck", korean: "Korean RV",
};
// Only these carry deuterocanon on getbible (kjva nrs 69-81; vulgate same nrs).
const DEUT_TRANS = { en: "kjva", la: "vulgate" };

// getbible book numbers (Protestant order 1-66 + apocrypha 69-81). Keys are
// lowercased with dots/spaces removed.
const BOOK_NR = {
  "gen": 1, "genesis": 1, "genesis": 1, "gn": 1, "genese": 1, "genesi": 1,
  "ex": 2, "exodus": 2, "exod": 2, "exodo": 2, "exode": 2, "esodo": 2,
  "lev": 3, "leviticus": 3, "levitico": 3, "lv": 3,
  "num": 4, "numbers": 4, "numeros": 4, "numeros": 4, "nm": 4,
  "deut": 5, "deuteronomy": 5, "deuteronomio": 5, "dt": 5,
  "josh": 6, "joshua": 6, "josue": 6, "jos": 6,
  "judg": 7, "judges": 7, "jueces": 7, "jue": 7, "jgs": 7,
  "ruth": 8, "rut": 8, "rt": 8, "ru": 8,
  "1sam": 9, "1samuel": 9, "1samuel": 9, "1sm": 9,
  "2sam": 10, "2samuel": 10, "2samuel": 10, "2sm": 10,
  "1kgs": 11, "1kings": 11, "1reyes": 11, "1re": 11,
  "2kgs": 12, "2kings": 12, "2reyes": 12, "2re": 12,
  "1chr": 13, "1chronicles": 13, "1cronicas": 13, "1cro": 13,
  "2chr": 14, "2chronicles": 14, "2cronicas": 14, "2cro": 14,
  "ezra": 15, "esdras": 15, "esd": 15, "ezr": 15,
  "neh": 16, "nehemiah": 16, "nehemias": 16, "ne": 16,
  "esth": 17, "esther": 17, "ester": 17, "est": 17,
  "job": 18, "jb": 18,
  "sal": 19, "salm": 19, "salmo": 19, "salmos": 19, "salmi": 19, "ps": 19, "psalm": 19, "psalms": 19, "psalmus": 19, "psalmi": 19, "sl": 19, "psaume": 19, "psaumes": 19,
  "prov": 20, "proverbs": 20, "proverbios": 20, "pr": 20, "prv": 20,
  "eccl": 21, "ecclesiastes": 21, "eclesiastes": 21, "qoh": 21,
  "song": 22, "cantares": 22, "cantar": 22, "sg": 22, "sgs": 22, "songofsongs": 22, "songofsolomon": 22, "canticle": 22, "canticles": 22, "cnt": 22,
  "is": 23, "isa": 23, "isaiah": 23, "isaias": 23, "isaia": 23, "isaie": 23, "isa": 23,
  "jer": 24, "jeremiah": 24, "jeremias": 24, "jr": 24,
  "lam": 25, "lamentations": 25, "lamentaciones": 25, "lm": 25,
  "ez": 26, "eze": 26, "ezekiel": 26, "ezequiel": 26,
  "dan": 27, "daniel": 27, "dn": 27,
  "hos": 28, "hosea": 28, "oseas": 28, "os": 28,
  "joel": 29, "jl": 29,
  "amos": 30, "am": 30, "amos": 30,
  "obad": 31, "obadiah": 31, "abdias": 31, "abd": 31,
  "jonah": 32, "jonas": 32, "jon": 32,
  "mic": 33, "micah": 33, "miqueas": 33, "mi": 33, "mq": 33,
  "nah": 34, "nahum": 34, "nahum": 34, "na": 34,
  "hab": 35, "habakkuk": 35, "habacuc": 35,
  "zeph": 36, "zephaniah": 36, "sofonias": 36, "sof": 36, "zep": 36,
  "hag": 37, "haggai": 37, "hagg": 37, "ageo": 37, "ag": 37, "hg": 37,
  "hag": 37, "haggai": 37, "hagg": 37, "ageo": 37, "ag": 37,
  "zec": 38, "zech": 38, "zechariah": 38, "zacarias": 38, "za": 38,
  "mal": 39, "malachi": 39, "malaquias": 39, "ml": 39,
  "mt": 40, "mateo": 40, "mat": 40, "matthew": 40, "matt": 40, "matthieu": 40, "matteo": 40, "mateus": 40,
  "mk": 41, "mc": 41, "marcos": 41, "mar": 41, "mark": 41, "m": 41, "marc": 41, "marco": 41,
  "lk": 42, "lc": 42, "lucas": 42, "luc": 42, "luke": 42, "luca": 42,
  "jn": 43, "juan": 43, "jhn": 43, "john": 43, "jean": 43, "giovanni": 43, "joao": 43,
  "acts": 44, "hch": 44, "hechos": 44, "hech": 44, "act": 44, "actes": 44, "atti": 44, "atos": 44,
  "rom": 45, "roman": 45, "romanos": 45, "romans": 45, "rm": 45, "romains": 45, "romani": 45,
  "1cor": 46, "1corinthians": 46, "1corintios": 46, "1co": 46,
  "2cor": 47, "2corinthians": 47, "2corintios": 47, "2co": 47,
  "gal": 48, "galatians": 48, "galatas": 48, "ga": 48,
  "eph": 49, "ephesians": 49, "efesios": 49, "ef": 49,
  "phil": 50, "philippians": 50, "filipenses": 50, "flp": 50, "fil": 50,
  "col": 51, "colossians": 51, "colosenses": 51,
  "1thess": 52, "1thes": 52, "1thessalonians": 52, "1tesalonicenses": 52, "1ts": 52,
  "2thess": 53, "2thes": 53, "2thessalonians": 53, "2tesalonicenses": 53, "2ts": 53,
  "1tim": 54, "1timothy": 54, "1timoteo": 54, "tm": 54, "1tm": 54, "1ti": 54,
  "2tim": 55, "2timothy": 55, "2timoteo": 55, "2tm": 55, "2ti": 55,
  "titus": 56, "tito": 56, "tit": 56, "ti": 56,
  "phlm": 57, "philemon": 57, "filemon": 57, "flm": 57,
  "heb": 58, "hebrews": 58, "hebreos": 58, "he": 58, "hb": 58,
  "jas": 59, "james": 59, "sant": 59, "stgo": 59, "santiago": 59,
  "1pet": 60, "1peter": 60, "1pedro": 60, "1pe": 60, "1pt": 60,
  "2pet": 61, "2peter": 61, "2pedro": 61, "2pe": 61, "2pt": 61,
  "1jn": 62, "1john": 62, "1juan": 62,
  "2jn": 63, "2john": 63, "2juan": 63,
  "3jn": 64, "3john": 64, "3juan": 64,
  "jude": 65, "judas": 65, "jud": 65,
  "rev": 66, "revelation": 66, "apocalipsis": 66, "ap": 66, "rv": 66, "apocalypse": 66,
  // deuterocanonical (kjva + vulgate numbering)
  "tobit": 69, "tob": 69, "tobias": 69, "tb": 69,
  "judith": 70, "jdt": 70, "judit": 70,
  "wisdom": 73, "wis": 73, "sab": 73, "sabiduria": 73, "sagesse": 73, "sapienza": 73, "sabedoria": 73,
  "sirach": 74, "sir": 74, "sirarch": 74, "ecclesiasticus": 74, "eclo": 74, "eclesiastico": 74,
  "baruch": 75, "bar": 75, "baruc": 75,
  "1maccabees": 80, "1macc": 80, "1mac": 80, "1mc": 80, "1macabeos": 80,
  "2maccabees": 81, "2macc": 81, "2mac": 81, "2mc": 81, "2macabeos": 81,
};
const DEUT_NRS = new Set([69, 70, 73, 74, 75, 76, 77, 78, 80, 81]);

const normKey = (s) => String(s || "").toLowerCase().replace(/[\.\s]+/g, "");

// Parse a lectionary citation into fetchable parts.
// Handles: "Ps 27:1bcde, 4, 13-14" · "Rom 16:3-9, 16, 22-27" · "Mk 12:38-44 or 12:41-44"
// · "Hebrews 4:14-16; 5:7-9" (semicolons) · "John 18:1—19:42" (cross-chapter)
// · "19:8, 9, 10" (bare psalm) · "PS147:12" · "Psalm 23" (whole chapter)
// · "See/Cf." prefixes · letter suffixes (3b, 6a, 1bcde).
export function parseCitationFull(cit) {
  if (!cit) return null;
  let c = String(cit).replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
  c = c.replace(/(\d)\s*\+\s*(\d)/g, "$1-$2"); // "10+12" → rango 10-12
  c = c.replace(/^(see|cf\.?|compare|resp\.?)\b\.?\s*/i, "");
  c = c.split(/\s+or\s+/i)[0].trim();
  if (!c || c === "—") return null;
  if (/^\d+\s*:/.test(c)) c = "Ps " + c; // bare psalm "19:8, 9…"
  let m = c.match(/^(1\s|2\s|3\s)?([A-Za-zÁÉÍÓÚÜÑáéíóúüñ\.\s]+?)\s*(\d+)\s*:\s*(.*)$/);
  let bookRaw, chapter, rest;
  if (m) {
    bookRaw = (m[1] || "") + m[2];
    chapter = +m[3];
    rest = m[4] || "";
  } else {
    m = c.match(/^(1\s|2\s|3\s)?([A-Za-zÁÉÍÓÚÜÑáéíóúüñ\.\s]+?)\s+(\d+)\s*$/); // whole chapter
    if (!m) return null;
    bookRaw = (m[1] || "") + m[2];
    chapter = +m[3];
    rest = "";
  }
  const bookKey = normKey(bookRaw);
  const bookNr = BOOK_NR[bookKey];
  if (!bookNr) return null;
  const parts = [];
  const cross = rest.match(/(\d+)\s*-\s*(\d+)\s*:\s*(\d+)\s*$/);
  if (cross && chapter < +cross[2]) {
    // "18:1-19:42" → ch18:[v-start…end], …, ch19:[1…v-end]
    const chB = +cross[2];
    if (chB - chapter > 10) return null;
    for (let ch = chapter; ch <= chB; ch++) {
      if (ch === chapter) parts.push({ chapter: ch, segs: [[+cross[1], null]] });
      else if (ch === chB) parts.push({ chapter: ch, segs: [[1, +cross[3]]] });
      else parts.push({ chapter: ch, segs: [[1, null]] });
    }
  } else {
    let cur = chapter;
    for (const grp of rest.split(";")) {
      const g = grp.trim();
      if (!g) continue;
      const gm = g.match(/(\d+)\s*:\s*(.*)$/);
      let vpart = g;
      if (gm) { cur = +gm[1]; vpart = gm[2]; }
      const segs = [...vpart.matchAll(/(\d+)\s*(?:-\s*(\d+)?)?/g)].map((x) => {
        const s = +x[1];
        const hasDash = x[0].includes("-");
        const e = x[2] ? +x[2] : (hasDash ? null : s);
        return [s, e];
      });
      parts.push({ chapter: cur, segs: segs.length ? segs : [[1, null]] });
    }
    if (!parts.length) parts.push({ chapter, segs: [[1, null]] });
  }
  return { bookKey, bookNr, deut: DEUT_NRS.has(bookNr), parts };
}

// Back-compat single-part view (first part only).
export function parseCitation(cit) {
  const p = parseCitationFull(cit);
  if (!p) return null;
  const f = p.parts[0];
  const s = f.segs[0];
  return { bookNr: p.bookNr, chapter: f.chapter, vStart: s ? s[0] : null, vEnd: s ? (s[1] ?? s[0]) : null };
}

const API = "https://api.getbible.net/v2";
const chapCache = {};
function cacheGet(k) {
  if (chapCache[k]) return chapCache[k];
  try {
    const raw = localStorage.getItem("getbible.v1." + k);
    if (raw) { const j = JSON.parse(raw); chapCache[k] = j; return j; }
  } catch {}
  return null;
}
function cacheSet(k, j) {
  chapCache[k] = j;
  try { localStorage.setItem("getbible.v1." + k, JSON.stringify(j)); } catch {}
}
const cleanText = (t) => String(t || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function fetchChapter(trans, nr, ch) {
  const k = `${trans}.${nr}.${ch}`;
  const hit = cacheGet(k);
  if (hit) return hit;
  const r = await fetch(`${API}/${trans}/${nr}/${ch}.json`);
  if (!r.ok) throw new Error("http " + r.status);
  const j = await r.json();
  const verses = (j.verses || []).map((v) => ({ v: v.verse, t: cleanText(v.text) }));
  const out = { book: j.book_name, verses };
  cacheSet(k, out);
  return out;
}

// Full passage text for one citation in the requested language.
// Returns {ref, book, trans, transName, passages:[{chapter, verses:[{v,t}]}]}
// or {missing:"deut"|"parse"|"fetch"|"empty", ref}.
export async function fetchPassage(cit, lang) {
  const P = parseCitationFull(cit);
  if (!P) return { missing: "parse", ref: cit };
  const L = BIBLE_TRANS[lang] ? lang : "es";
  if (P.deut && !DEUT_TRANS[L]) return { missing: "deut", ref: cit };
  let trans = BIBLE_TRANS[L];
  let nr = P.bookNr;
  let parts = P.parts;
  if (P.deut) trans = DEUT_TRANS[L];
  // Daniel additions: NAB "Dn 3:52…" → kjva Prayer of Azariah (nr 76, offset −23).
  // Vulgate Daniel 3 already carries the canticle inline (100 verses).
  if (P.bookKey === "daniel" && L === "en" && parts.length === 1 && parts[0].chapter === 3 &&
      parts[0].segs.some(([s, e]) => (e ?? 999) > 30)) {
    trans = "kjva"; nr = 76;
    parts = [{ chapter: 1, segs: parts[0].segs.map(([s, e]) => [s - 23, e == null ? e : e - 23]) }];
  }
  // Dn 13/14: kjva Susanna (77) / Bel (78); vulgate carries ch 13-14 inline.
  if (P.bookKey === "daniel" && L === "en" && parts.some((p) => p.chapter > 12)) {
    trans = "kjva";
    const mx = Math.max(...parts.map((p) => p.chapter));
    nr = 76 + (mx - 12);
    parts = parts.map((p) => ({ chapter: 1, segs: p.segs }));
  }
  try {
    const passages = [];
    for (const p of parts) {
      const ch = await fetchChapter(trans, nr, p.chapter);
      const verses = ch.verses.filter((v) => p.segs.some(([s, e]) => v.v >= s && (e == null || v.v <= e)));
      if (verses.length) passages.push({ chapter: p.chapter, verses, book: ch.book });
    }
    if (!passages.length) return { missing: "empty", ref: cit, trans };
    return { ref: cit, book: passages[0].book, trans, transName: TRANS_NAME[trans] || trans, passages };
  } catch {
    return { missing: "fetch", ref: cit, trans };
  }
}

// Back-compat: old {text} shape for a single citation (first part only).
export async function fetchPublicDomainText(cit, lang) {
  const r = await fetchPassage(cit, lang);
  if (r.missing) throw new Error(r.missing);
  const verses = r.passages.flatMap((p) => p.verses);
  return { text: verses.map((v) => `${v.v} ${v.t}`).join("\n"), book: r.book, chapter: r.passages[0].chapter };
}
