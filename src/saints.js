// Santo del día: une la fiesta del calendario con la biografía breve.
// - Nombres/datos: src/vendor/saints-data.js (ACoci86/daily-saints, MIT).
// - Español (frase): src/vendor/saints-es.js (redacción parroquial condensada).
// - Faltantes del calendario USA: src/vendor/saints-extra.js (redacción propia ES+EN).
// El calendario de la fuente es tradicional (pre-1970): se casa por NOMBRE,
// nunca por fecha. Sin bio para misterios, ferias y fiestas sin santo.
const SAINT_IMG_HOST = "https://acoci86.github.io/daily-saints";

const fold = (s) => String(s || "").toLowerCase()
  .replace(/&#0?39;|&rsquo;|'/g, " ").replace(/&[a-z]+;/g, " ")
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/\./g, "").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
const stripThe = (s) => s.replace(/^the\s+/, "");
const ROLES = "bishop|bishops|pope|popes|priest|priests|deacon|deacons|abbot|abbots|religious|monk|monks|evangelist|evangelists|apostle|apostles|confessor|confessors|hermit|hermits|king|kings|virgin|virgins|doctor|doctors|martyr|martyrs|archangel|archangels";
function stripRoles(s) {
  let p = String(s || "");
  let prev;
  const rx = new RegExp(`\\s+(${ROLES})(\\s+of\\s+the\\s+church)?$`);
  do {
    prev = p;
    p = p.replace(/\s+and\s+companions$/, "")
      .replace(/\s+in the dioceses of the united states$/, "")
      .replace(/\s+mass (during the day|in the morning)$/, "")
      .replace(/\s+vigil( mass)?$/, "")
      .replace(rx, "").replace(/\s+and$/, "").trim();
  } while (p !== prev);
  return p;
}
const BLOCK_NAME = new Set(["simon", "cyril"]); // "Simon"=contenido de Inocentes; "Cyril" no es el de Tesalónica
const BLOCK_FEAST = [/chair of saint peter/, /dedication of the lateran/, /all souls/, /faithful departed/, /holy family/, /corpus christi/, /body and blood/, /sacred heart/, /christ.{0,5}king/, /trinity/, /divine mercy/, /ascension/, /pentecost/, /palm sunday/, /good friday/, /holy saturday/, /holy week/, /of holy week/, /chrism/, /ash wednesday/, /thursday after ash/, /friday after ash/, /saturday after ash/, /christmas weekday/, /octave of (christmas|easter)/, /day in the octave/, /(monday|tuesday|wednesday|thursday|friday|saturday|first|second|third|fourth|fifth|sixth|seventh) (sunday|day)? ?(of|in|after) (the )?(second|third|fourth|fifth|sixth|seventh) week of easter/, /(first|second|third|fourth|fifth|sixth|seventh) sunday of easter/, /easter sunday/, /easter monday/, /resurrection of the lord/, /ordinary time/, /advent/, /lent/, /after epiphany/, /morning mass/, /in the morning/, /thanksgiving/, /unborn children/, /seventh sunday of easter/, /saints john and paul/, /^\d{4}-\d{2}-\d{2}$/, /^$/];
const FEAST_RULES = [
  [/stephen.*first martyr/, "stephen"],
  [/mother of god|mary the holy mother of god/, "mary mother of god"],
  [/virgin mary mother of the church/, "mary mother of church"],
  [/queenship/, "queenship"],
];
const FEAST_ALIAS = {
  "feast of the conversion of saint paul apostle": "The Conversion of Saint Paul",
  "feast of the presentation of the lord": "The Presentation of Jesus in the Temple",
  "solemnity of the annunciation of the lord": "Annunciation of the Blessed Virgin Mary and the Incarnation of the Word of God",
  "feast of the transfiguration of the lord": "Transfiguration of Our Lord",
  "feast of the visitation of the blessed virgin mary": "The Visitation of the Blessed Virgin Mary",
  "feast of the nativity of the blessed virgin mary": "The Nativity of the Blessed Virgin",
  "feast of the exaltation of the holy cross": "The Exaltation of the Holy Cross",
  "memorial of our lady of sorrows": "The Seven Sorrows of the Blessed Virgin Mary",
  "the epiphany of the lord": "The Epiphany of Our Lord",
  "the baptism of the lord": "The Baptism of Our Lord",
  "solemnity of the immaculate conception of the blessed virgin mary": "The Immaculate Conception",
  "the nativity of the lord christmas vigil mass": "The Nativity of Our Lord Jesus Christ",
  "the nativity of the lord christmas": "The Nativity of Our Lord Jesus Christ",
  "memorial of saints cyril monk and methodius bishop": "Cyril and Methodius",
};
const NAME_ALIAS = {
  "mary magdalene": "Mary Magdalen", "james": "James the Greater", "anthony": "Anthony of the Desert",
  "justin": "Justin of Naplouse", "clare": "Clare of Assisi", "lucy": "Lucy of Syracuse",
  "bernard": "Bernard of Clairvaux", "teresa of jesus": "Teresa of Avila", "sharbel makhlouf": "Charbel Makhlouf",
  "bridget": "Bridget of Sweden", "birgitta": "Bridget of Sweden", "louis": "Louis IX",
  "vincent": "Vincent of Saragossa", "joseph the worker": "Joseph", "camillus de lellis": "Camillus of Lellis",
  "joseph calasanz": "Joseph Calasanctius", "francis of paola": "Francis of Paula",
  "guardian angels": "The Holy Guardian Angels", "holy guardian angels": "The Holy Guardian Angels",
  "therese of the child jesus": "Thérèse of Lisieux", "mary magdalene de pazzi": "Mary Magdalene of Pazzi",
  "immaculate heart of the blessed virgin mary": "The Immaculate Heart of Mary",
  "joseph spouse of the blessed virgin mary": "Joseph", "joseph husband of the blessed virgin mary": "Joseph",
  "john de brebeuf": "The Holy North American Martyrs", "isaac jogues": "The Holy North American Martyrs",
  "bede the venerable": "Bede", "john baptist de la salle": "John Baptist de LaSalle",
  "andrew kim tae-gon": "Andrew Kim",
};
function data() { return (typeof window !== "undefined" && window.SaintsData) || null; }
function esBio() { return (typeof window !== "undefined" && window.SaintsES) || {}; }
function extra() { return (typeof window !== "undefined" && window.SaintsExtra) || {}; }
let normMap = null;
function getNormMap() {
  if (normMap) return normMap;
  normMap = new Map();
  const D = data();
  if (D) for (const n of Object.keys(D)) {
    const k = stripThe(fold(n));
    if (!normMap.has(k)) normMap.set(k, n);
  }
  return normMap;
}
function feastCands(feast) {
  const f = fold(feast).replace(/^(memorial|optional memorial|feast|solemnity) of /, "").replace(/^the /, "");
  const out = [];
  const push = (p) => {
    p = String(p || "").replace(/^(saint|st|blessed|bl) /, "").trim();
    p = stripRoles(p);
    if (!p) return;
    if (/^(bishop|bishops|priest|priests|martyr|martyrs|virgin|virgins|doctor|doctors|pope|popes|religious|abbot|abbots|apostle|apostles|confessor|confessors|deacon|deacons|monk|monks|evangelist|king|kings|companions?)$/.test(p)) return;
    if (out.indexOf(p) < 0) out.push(p);
  };
  if (/^saints /.test(f)) {
    for (const seg of f.replace(/^saints /, "").split(",")) {
      for (const part of seg.split(/\s+and\s+|\s*&\s*/)) push(part);
    }
    if (out.length) return out;
  }
  const s = f.replace(/^(saint|st|blessed|bl) /, "").trim();
  const conv = s.match(/(?:of|of the) (saint|st) (.+?)(?:,|$)/);
  if (conv) return [conv[2].trim()];
  return [s.split(",")[0].trim()];
}
function lookup(cand) {
  const tries = [cand];
  const parts = String(cand).split(" ");
  if (parts.length === 2) tries.push(parts[0]);
  for (const t of tries) {
    let key = stripThe(fold(t));
    if (NAME_ALIAS[key] === null) return null;
    if (NAME_ALIAS[key]) key = stripThe(fold(NAME_ALIAS[key]));
    if (BLOCK_NAME.has(key)) continue;
    if (getNormMap().has(key)) return { hit: getNormMap().get(key) };
    const stripped = stripRoles(key);
    if (stripped && stripped !== key) {
      let k2 = stripped;
      if (NAME_ALIAS[k2] === null) return null;
      if (NAME_ALIAS[k2]) k2 = stripThe(fold(NAME_ALIAS[k2]));
      if (BLOCK_NAME.has(k2)) continue;
      if (getNormMap().has(k2)) return { hit: getNormMap().get(k2) };
    }
  }
  const s = stripRoles(stripThe(fold(cand)));
  if (!s || BLOCK_NAME.has(s)) return null;
  return { miss: s };
}
const ERA_ES = { "1st century": "s. I", "2nd century": "s. II", "3rd century": "s. III", "4th century": "s. IV", "4th-5th century": "ss. IV–V", "5th century": "s. V", "6th century": "s. VI", "8th century": "s. VIII", "9th century": "s. IX", "11th century": "s. XI", "12th century": "s. XII", "13th century": "s. XIII", "14th century": "s. XIV", "16th century": "s. XVI", "17th century": "s. XVII", "18th century": "s. XVIII", "19th century": "s. XIX", "20th century": "s. XX", "Medieval": "Edad Media", "Early Church": "Iglesia primitiva", "Early Christian": "Iglesia primitiva", "Modern": "Época moderna", "Biblical": "Tiempos bíblicos" };
const PAT_ES = { "youth": "jóvenes", "students": "estudiantes", "theologians": "teólogos", "confessors": "confesores", "mothers": "madres", "fathers": "padres", "families": "familias", "family": "familia", "children": "niños", "the poor": "los pobres", "poor": "pobres", "the sick": "los enfermos", "sick persons": "enfermos", "sick people": "enfermos", "sick children": "niños enfermos", "mothers ": "madres", "wives": "esposas", "wives ": "esposas", "women": "mujeres", "wives": "esposas", "widows": "viudas", "virgins": "vírgenes", "young girls": "niñas", "martyrs": "mártires", "missionaries": "misioneros", "foreign missions": "misiones", "missionaries ": "misioneros", "monks": "monjes", "nuns": "monjas", "priests": "sacerdotes", "popes": "papas", "clergy": "clero", "deacons": "diáconos", "deaconry": "diaconado", "bishops": "obispos", "fishermen": "pescadores", "farmers": "campesinos", "workers": "trabajadores", "travelers": "viajeros", "pilgrims": "peregrinos", "soldiers": "soldados", "sailors": "marineros", "police": "policías", "firefighters": "bomberos", "nurses": "enfermeras", "physicians": "médicos", "musicians": "músicos", "artists": "artistas", "painters": "pintores", "writers": "escritores", "poets": "poetas", "teachers": "maestros", "students": "estudiantes", "youth": "juventud", "lawyers": "abogados", "bankers": "banqueros", "accountants": "contadores", "merchants": "comerciantes", "bakers": "panaderos", "butchers": "carniceros", "tailors": "sastres", "farmers": "agricultores", "gardeners": "jardineros", "florists": "floristas", "cooks": "cocineros", "brewers": "cerveceros", "hatmakers": "sombrereros", "goldsmiths": "orfebres", "tanners": "curtidores", "geographers": "geógrafos", "philosophers": "filósofos", "orators": "oradores", "preachers": "predicadores", "mystics": "místicos", "converts": "conversos", "conversions": "conversiones", "penitents": "penitentes", "prisoners": "prisioneros", "slaves": "esclavos", "immigrants": "inmigrantes", "refugees": "refugiados", "people in exile": "exiliados", "exiled people": "exiliados", "travelers": "viajeros", "children": "niños", "innocence": "inocencia", "innocents": "inocentes", "victims of violence": "víctimas", "persecuted Christians": "cristianos perseguidos", "the unborn": "no nacidos", "pregnant women": "embarazadas", "mothers": "madres", "wives": "esposas", "brides": "novias", "marriage": "matrimonio", "families": "familias", "grandparents": "abuelos", "parents": "padres", "loss of parents": "huérfanos", "widows": "viudas", "sick": "enfermos", "healers": "sanadores", "hospital workers": "sanitarios", "doctors": "médicos", "nurses": "enfermeras", "blindness": "ciegos", "the blind": "ciegos", "eye disease": "vista", "throat diseases": "garganta", "ecology": "ecología", "environment": "medio ambiente", "environmentalists": "ecologistas", "animals": "animales", "horses": "caballos", "storms": "tormentas", "sailors": "marineros", "fishermen": "pescadores", "hunters": "cazadores", "victory in battle": "victorias", "soldiers": "soldados", "police": "policía", "firefighters": "bomberos", "paramedics": "paramédicos", "joy": "alegría", "hope": "esperanza", "charity": "caridad", "love": "amor", "peace": "paz", "prayers": "oración", "prayer": "oración", "students": "estudiantes", "scholars": "estudiosos", "libraries": "bibliotecas", "translators": "traductores", "booksellers": "libreros", "printers": "impresores", "journalists": "periodistas", "writers": "escritores", "education": "educación", "teachers": "maestros", "catechists": "catequistas", "seminarians": "seminaristas", "spiritual leaders": "pastores", "spiritual retreats": "retiros", "missions": "misiones", "missionaries": "misioneros", "converts": "conversos", "apologists": "apologistas", "theologians": "teólogos", "church leaders": "pastores", "unity among Christians": "unidad cristiana", "church unity": "unidad eclesial", "universal Church": "Iglesia universal", "the Catholic Church": "Iglesia católica", "Catholic Church": "Iglesia católica", "the Church": "la Iglesia", "Rome": "Roma", "the city of Milan": "Milán", "scotland": "Escocia", "greece": "Grecia", "Spain": "España", "Latin America": "América Latina", "the United States": "Estados Unidos", "North Africa": "Norte de África", "Canada": "Canadá", "Cyprus": "Chipre", "Colombia": "Colombia", "Japan": "Japón", "India": "India", "Indigenous peoples": "pueblos originarios", "Native Americans": "nativos americanos", "African missions": "misiones africanas", "Germany": "Alemania", "Europe": "Europa", "Italy": "Italia", "heaven": "cielo", "sorrows": "dolores", "loss": "pérdida", "all humanity": "la humanidad", "abbots": "abades", "abbesses": "abadesas", "hermits": "ermitaños", "beggars": "mendigos", "gravediggers": "sepultureros", "gardeners": "jardineros", "tanners": "curtidores", "butchers": "carniceros", "carpenters": "carpinteros", "blacksmiths": "herreros", "locksmiths": "cerrajeros", "stonemasons": "canteros", "builders": "constructores", "architects": "arquitectos", "masons": "albañiles", "secretaries": "secretarios", "notaries": "notarios", "bankers": "banqueros", "lawyers": "abogados", "judges": "jueces", "statesmen": "gobernantes", "rulers": "gobernantes", "kings": "reyes", "queens": "reinas", "princes": "príncipes", "nobility": "nobleza", "knights": "caballeros", "crusaders": "cruzados", "television": "televisión", "radio": "radio", "internet": "internet", "photographers": "fotógrafos", "bakers": "panaderos", "brewers": "cerveceros", "winemakers": "viñadores", "innkeepers": "posaderos", "shepherds": "pastores", "fishermen": "pescadores", "hunters": "cazadores", "miners": "mineros", "sailors": "marineros", "divers": "buzos", "firemen": "bomberos", "policemen": "policías", "soldiers": "soldados", "veterans": "veteranos", "doctors": "médicos", "surgeons": "cirujanos", "dentists": "dentistas", "pharmacists": "farmacéuticos", "midwives": "parteras", "nannies": "niñeras", "orphans": "huérfanos", "orphanages": "orfanatos", "hospitals": "hospitales", "prisons": "cárceles", "captives": "cautivos", "hostages": "rehenes", "kidnapped": "secuestrados", "runaways": "fugitivos", "lost items": "objetos perdidos", "lost causes": "causas perdidas", "impossible causes": "causas imposibles", "desperate cases": "casos difíciles", "doubt": "duda", "doubters": "los que dudan", "against heresies": "contra herejías", "against fire": "contra incendios", "against floods": "contra inundaciones", "against storms": "contra tormentas", "against lightning": "contra rayos", "sick cattle": "ganado", "wolves": "lobos", "rats": "ratas", "insects": "insectos", "beekeepers": "apicultores", "candle makers": "cereros", "candlemakers": "cereros", "wax melters": "cereros", "learning": "estudio", "schools": "escuelas", "universities": "universidades", "examinations": "exámenes", "students": "estudiantes", "professors": "profesores", "lecturers": "conferencistas", "scientists": "científicos", "astronomers": "astrónomos", "mathematicians": "matemáticos", "geologists": "geólogos", "music": "música", "singers": "cantantes", "choirs": "coros", "composers": "compositores", "dancers": "bailarines", "actors": "actores", "poets": "poetas", "authors": "autores", "editors": "editores", "booksellers": "libreros", "librarians": "bibliotecarios", "archivists": "archivistas", "scribes": "escribas", "messengers": "mensajeros", "diplomats": "diplomáticos", "civil servants": "funcionarios", "workers": "trabajadores", "laborers": "obreros", "craftsmen": "artesanos", "apprentices": "aprendices", "journeymen": "oficiales", "masters": "maestros", "servants": "servidores", "maids": "sirvientas", "housewives": "amas de casa", "housekeepers": "amas de llaves", "cooks": "cocineros", "waiters": "meseros", "bartenders": "cantineros", "barbers": "barberos", "hairdressers": "peluqueros", "tailors": "sastres", "shoemakers": "zapateros", "weavers": "tejedores", "dyers": "tintoreros", "fullers": "bataneros", "millers": "molineros", "fishmongers": "pescaderos", "butchers": "carniceros", "grocers": "tenderos", "merchants": "comerciantes", "peddlers": "buhoneros", "bankers": "banqueros", "money changers": "cambistas", "tax collectors": "recaudadores", "customs officers": "aduaneros", "sailors": "marineros", "fishermen": "pescadores", "boatmen": "barqueros", "bridge builders": "pontoneros", "road builders": "camineros", "plumbers": "fontaneros", "electricians": "electricistas", "mechanics": "mecánicos", "drivers": "conductores", "pilots": "pilotos", "aviators": "aviadores", "paratroopers": "paracaidistas", "motorcyclists": "motociclistas", "cyclists": "ciclistas", "athletes": "atletas", "runners": "corredores", "swimmers": "nadadores", "hunters": "cazadores", "jockeys": "jinetes", "fencers": "esgrimistas", "archers": "arqueros", "mountaineers": "montañeros", "skiers": "esquiadores", "yachtsmen": "regatistas", "golfers": "golfistas", "chess players": "ajedrecistas", "magicians": "magos", "jugglers": "malabaristas", "acrobats": "acróbatas", "clowns": "payasos", "comedians": "cómicos", "television": "televisión", "theatre": "teatro", "cinema": "cine", "circus": "circo", "carnivals": "carnavales", "festivals": "fiestas", "weddings": "bodas", "bridges": "puentes", "bridegrooms": "novios", "foster parents": "padres adoptivos", "godparents": "padrinos", "stepparents": "padrastros", "twins": "mellizos", "triplets": "trillizos", "only children": "hijos únicos", "firstborn": "primogénitos", "teenagers": "adolescentes", "adolescents": "adolescentes", "youth": "juventud", "students": "estudiantes", "schoolchildren": "escolares", " altar servers": "monaguillos", "choirboys": "monaguillos", "convert": "converso" };
function eraEs(e) { return ERA_ES[String(e || "")] ?? String(e || ""); }
function patronEs(list, lang) {
  if (!Array.isArray(list) || !list.length) return [];
  if (lang === "en") return list;
  return list.map((p) => PAT_ES[String(p).toLowerCase()] ?? PAT_ES[String(p)] ?? p);
}
// Rango litúrgico desde el nombre de la fiesta (las filas diarias no traen rango).
export function rankOf(feast) {
  const f = fold(feast);
  if (/^solemnity/.test(f)) return "solemnity";
  if (/^feast/.test(f)) return "feast";
  if (/optional memorial/.test(f)) return "optional";
  if (/^memorial/.test(f)) return "memorial";
  if (/sunday/.test(f)) return "sunday";
  // Solemnidades/fiestas nombradas sin la palabra explícita (calendario USA).
  if (/nativity of the lord|christmas(?! weekday)|octave day of christmas|mother of god|epiphany of the lord|annunciation|easter sunday|resurrection of the lord|ascension|pentecost|trinity sunday|corpus christi|body and blood|sacred heart|saint joseph.*spouse|joseph.*spouse.*virgin|nativity of saint john|peter and paul|transfiguration|assumption|all saints( |$)|christ the king|christ king|immaculate conception/.test(f)) return "solemnity";
  if (/baptism of the lord|presentation of the lord|chair of saint peter|conversion of saint paul|visitation|nativity of the blessed virgin|exaltation of the holy cross|our lady of sorrows|dedication of the lateran|guardian angels|holy family|birth of the blessed virgin/.test(f)) return "feast";
  return "";
}
// Santo del día para una fiesta del calendario. Devuelve null si no hay santo
// (misterios, ferias, domingos de tiempo...). lang: "en" o "es" (otros → "es").
export function saintFor(feast, lang) {
  const D = data();
  if (!D || !feast) return null;
  const nf = fold(feast);
  if (BLOCK_FEAST.some((rx) => rx.test(nf))) return null;
  for (const [rx, tgt] of FEAST_RULES) {
    if (rx.test(nf)) return extraSaint(tgt, lang);
  }
  if (FEAST_ALIAS[nf]) return vendorSaint(FEAST_ALIAS[nf], lang);
  let firstMiss = null;
  for (const c of feastCands(feast)) {
    const r = lookup(c);
    if (r && r.hit) return vendorSaint(r.hit, lang);
    if (r && r.miss && !firstMiss) firstMiss = r.miss;
  }
  if (firstMiss) return extraSaint(firstMiss, lang);
  return null;
}
export function saintsAvailable() {
  return !!(data() && (typeof window === "undefined" || (window.SaintsES && window.SaintsExtra)));
}
function vendorSaint(name, lang) {
  const D = data();
  const s = D[name];
  if (!s) return null;
  const [era, patronage, , summary, image, wiki] = s;
  const L = lang === "en" ? "en" : "es";
  const bio = L === "en" ? summary : (esBio()[name] || summary);
  return { kind: "vendor", name, era: L === "en" ? (era || "") : eraEs(era), patron: patronEs(patronage, L), bio, image: image ? SAINT_IMG_HOST + image : null, wiki: wiki || null };
}
function extraSaint(key, lang) {
  const X = extra()[key];
  if (!X) return null;
  const L = lang === "en" ? "en" : "es";
  return { kind: "extra", name: X.name, era: L === "en" ? (X.era_en || "") : (X.era_es || ""), patron: L === "en" ? (X.patron_en || []) : (X.patron_es || []), bio: L === "en" ? X.bio_en : X.bio_es, image: null, wiki: X.wiki || null };
}
// Todos los santos de un día (MM-DD) según las fechas de la fuente.
// Para "el santo de cada día, con biografía, foto y oración".
export function saintsOfDate(mmdd, lang) {
  const D = data();
  if (!D || !/^\d{2}-\d{2}$/.test(String(mmdd || ""))) return [];
  const L = lang === "en" ? "en" : "es";
  const out = [];
  for (const name of Object.keys(D)) {
    const e = D[name];
    const dates = String(e[6] || "").split(",").map(s => s.trim());
    if (!dates.includes(mmdd)) continue;
    const [era, patronage, , summary, image, wiki] = e;
    out.push({
      kind: "vendor", name,
      era: L === "en" ? (era || "") : (eraEs(era || "") || ""),
      patron: patronEs(patronage, L),
      bio: L === "en" ? summary : (esBio()[name] || summary),
      bioEs: !!esBio()[name],
      image: image ? SAINT_IMG_HOST + image : null, wiki: wiki || null,
    });
  }
  return out;
}
// Santo(s) del día con UNA sola regla en toda la app: primero el santo de la
// fiesta que celebra la Misa; si la fiesta no tiene santo (domingos, ferias),
// se usan los santos de la fecha. Así Inicio, Lecturas y Santoral coinciden.
export function saintsForDay(feast, mmdd, lang) {
  let list = [];
  try { const one = feast ? saintFor(feast, lang) : null; if (one) list = [one]; } catch {}
  if (!list.length) { try { list = saintsOfDate(mmdd, lang) || []; } catch {} }
  return list;
}
// Oración breve de intercesión (redacción propia, ES+EN) para el santo del día.
export function saintPrayerText(name, lang) {
  const n = String(name || "").replace(/^Saints?\s+/i, "").trim() || name;
  if (lang === "en") return `${n}, friend of God and faithful witness of Christ, pray for us before the Lord, that we may live in his love today and always. Amen.`;
  return `${n}, amigo de Dios y testigo fiel de Cristo, ruega por nosotros ante el Señor, para que vivamos en su amor hoy y siempre. Amén.`;
}
