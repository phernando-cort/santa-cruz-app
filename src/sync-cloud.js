// Adaptador nube (Supabase) — misma interfaz que el servidor Perchance.
//
// La app (src/app.js) llama a Sync.pullColl/push/del/account/auth/logout/refresh
// sin saber qué backend hay detrás. Si `src/cloud-config.js` está configurado,
// src/sync.js delega todo aquí; si no, usa Perchance; si no hay red, modo local.
//
// Colecciones (mismo orden que el servidor):
// 0 bulletins, 1 documents, 2 messages, 3 intenciones, 4 directory, 5 news,
// 6 ministry, 7 parishPrayers, 8 cantos, 9 videos, 10 givingUpdates,
// 11 givingGoals, 12 muro, 13 config, 14 editors, 15 users.
// cloud-config.js puede faltar en instalaciones incompletas (ZIP viejo):
// en ese caso CLOUD queda null y la app trabaja en modo local, sin romperse.
var CLOUD = null;
try { CLOUD = (await import("./cloud-config.js")).CLOUD || null; } catch(e) { CLOUD = null; }

var TABLE = "parish_records";
var KEYS = ["bulletins","documents","messages","intenciones","directory","news","ministry","parishPrayers","cantos","videos","givingUpdates","givingGoals","muro","config","editors","users"];
// Restringidas: solo admin/editores publican (igual que el servidor).
var RESTRICTED = {0:1,1:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,13:1};
// Solo admin (igual que el servidor).
var ADMIN_ONLY = {11:1,15:1};
// Límites por campo (copia del servidor Perchance).
var FIELDS = [
 {id:64,title:120,date:40,cover:80,sections:1600,pdf:300,par:24},
 {id:64,title:120,note:300,date:40,url:300,par:24},
 {id:64,from:40,time:40,channel:40,title:120,body:2000,to:40,par:24},
 {id:64,type:40,names:120,date:40,massId:40,mass:80,place:80,text:1000,par:24},
 {id:64,family:80,contact:80,phone:40,email:80,address:160,clergy:40,groups:400,members:1500,birthdays:800,anniversary:200,notes:800,par:24},
 {id:64,cat:40,date:40,title:120,body:2000,par:24},
 {id:64,roles:1500,par:24},
 {id:64,name:120,category:40,text:1800,par:24},
 {id:64,title:120,origin:80,lyrics:1800,notes:800,par:24},
 {id:64,title:120,yt:40,par:24},
 {id:64,pid:40,amt:0,name:80,date:40,folio:40,d:40,t:500,par:24},
 {id:64,goal:0,par:24},
 {id:64,name:40,kind:60,text:1000,when:40,par:24},
 {id:64,yt:40,label:200,par:24},
 {id:64,par:24},
 {id:64,name:80,contact:80,role:16,codeH:80,salt:40,pass:90,chk:80,par:24}
];
var MIGKEY = "sync.migrated.cloud.v1";

export function cloudEnabled(){
  try {
    return !!(CLOUD && CLOUD.SUPABASE_URL &&
      CLOUD.SUPABASE_URL.indexOf("https://") === 0 &&
      CLOUD.SUPABASE_ANON_KEY && CLOUD.SUPABASE_ANON_KEY.length > 20);
  } catch(e){ return false; }
}

// SHA-256 síncrono (misma implementación que el servidor Perchance).
var TE = (typeof TextEncoder !== "undefined") ? new TextEncoder() : null;
function sha256Hex(s){
  var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var by=TE.encode(s), lb=by.length, bitLen=lb*8, n=((lb+9+63)>>6)<<6, d=new Uint8Array(n), i, o;
  d.set(by); d[lb]=128;
  d[n-1]=bitLen&255; d[n-2]=(bitLen>>>8)&255; d[n-3]=(bitLen>>>16)&255; d[n-4]=(bitLen>>>24)&255;
  var w=new Uint32Array(64);
  function ro(x,b2){ return ((x>>>b2)|(x<<(32-b2)))|0; }
  for(o=0;o<n;o+=64){
    for(i=0;i<16;i++) w[i]=((d[o+i*4]<<24)|(d[o+i*4+1]<<16)|(d[o+i*4+2]<<8)|d[o+i*4+3])|0;
    for(i=16;i<64;i++){ var g0=w[i-15], g1=w[i-2];
      var s0=ro(g0,7)^ro(g0,18)^(g0>>>3), s1=ro(g1,17)^ro(g1,19)^(g1>>>10);
      w[i]=(w[i-16]+s0+w[i-7]+s1)|0; }
    var a=H[0],b1=H[1],c2=H[2],dd=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(i=0;i<64;i++){ var S1=ro(e,6)^ro(e,11)^ro(e,25), ch=(e&f)^(~e&g), t1=(h+S1+ch+K[i]+w[i])|0;
      var S0=ro(a,2)^ro(a,13)^ro(a,22), mj=(a&b1)^(a&c2)^(b1&c2), t2=(S0+mj)|0;
      h=g; g=f; f=e; e=(dd+t1)|0; dd=c2; c2=b1; b1=a; a=(t1+t2)|0; }
    H[0]=(H[0]+a)|0; H[1]=(H[1]+b1)|0; H[2]=(H[2]+c2)|0; H[3]=(H[3]+dd)|0;
    H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
  }
  var out=""; for(i=0;i<8;i++) out+=(Array(9).join("0")+(H[i]>>>0).toString(16)).slice(-8);
  return out;
}

function byTsDesc(a,b){ return (b.ts || 0) - (a.ts || 0); }

function validate(c, rec){
  if(!rec || typeof rec !== "object") throw new Error("bad_rec");
  var caps = FIELDS[c];
  var js = JSON.stringify(rec);
  if(js.length > 100000) throw new Error("too_large");
  if(typeof rec.id !== "string" || rec.id.length < 1 || rec.id.length > 64 ||
     /[\x00-\x1f\x7f]/.test(rec.id)) throw new Error("bad_id");
  for(var k in caps){
    var v = rec[k];
    if(v === undefined || v === null) continue;
    if(typeof v === "number"){ if(caps[k] !== 0) throw new Error("too_large:"+k); continue; }
    var s = (typeof v === "string") ? v : JSON.stringify(v);
    if(s.length > caps[k]) throw new Error("too_large:"+k);
  }
  if(rec.par === undefined) rec.par = "";
  rec.par = String(rec.par).slice(0, 24);
  if(typeof rec.ts !== "number") rec.ts = Date.now();
}

function userRecByName(Sync, nm, par){
  var w = String(nm || "").toLowerCase(), out = null;
  var arr = Sync.coll("users") || [];
  for(var i = 0; i < arr.length; i++){
    var r = arr[i];
    if(r && String(r.name || "").toLowerCase() === w && (!r.par || !par || r.par === par)) out = r;
  }
  return out;
}
function userRoleOf(Sync, nm, par){
  var r = userRecByName(Sync, nm, par);
  return r ? String(r.role || "") : "";
}
function nameIsAdmin(Sync, nm){ return userRoleOf(Sync, nm) === "admin"; }
function editorHas(Sync, name, par){
  if(!name) return false;
  var rl = userRoleOf(Sync, name, par);
  if(rl === "admin" || rl === "editor") return true;
  var eds = Sync.editors || [];
  for(var i = 0; i < eds.length; i++){
    var e = eds[i];
    if(typeof e === "string"){ if(e === name) return true; }
    else if(e && (e.id === name || e.name === name) && (!e.par || !par || e.par === par)) return true;
  }
  return false;
}

// Antiflood simple (como el servidor: error "flood" si se abusa).
var RL = {};
function rl(key, max){
  var now = Date.now(), a = RL[key] || [], b = [], i;
  for(i = 0; i < a.length; i++) if(now - a[i] < 60000) b.push(a[i]);
  RL[key] = b;
  if(b.length >= max) throw new Error("flood");
  b.push(now);
}

function rowToRec(r){
  var b = (r && r.body && typeof r.body === "object") ? Object.assign({}, r.body) : {};
  b.id = r.rid;
  b.par = (r.par == null) ? "" : r.par;
  if(typeof b.ts !== "number") b.ts = r.ts || 0;
  return b;
}

export async function cloudConnect(Sync){
  if(!cloudEnabled() || Sync._cloud) return !!Sync._cloud;
  var mod;
  try {
    mod = await import("https://esm.sh/@supabase/supabase-js@2");
  } catch(e){ throw new Error("net"); }
  // Toda petición con tope de 20 s: si no hay red/Supabase, fallar a modo local
  // en vez de colgarse (pullAll hace 16 consultas seguidas).
  function fetchTo(u, o){
    try {
      var ctl = new AbortController(), t = setTimeout(function(){ try{ ctl.abort(); }catch(e){} }, 20000);
      var base = (typeof fetch === "function") ? fetch : ((typeof globalThis !== "undefined" && globalThis.fetch) || null);
      return base(u, Object.assign({}, o, { signal: ctl.signal })).then(
        function(r){ clearTimeout(t); return r; },
        function(e){ clearTimeout(t); throw e; });
    } catch(e){ return fetch(u, o); }
  }
  var client = mod.createClient(CLOUD.SUPABASE_URL, CLOUD.SUPABASE_ANON_KEY, { global: { fetch: fetchTo } });
  Sync._cloudClient = client;
  Sync._cloudError = "";
  // Sonda: si la URL/clave son malas o falta el SQL, fallar AHORA (modo local)
  // en vez de marcar "en línea" con un cliente roto.
  try {
    var probe = await client.from(TABLE).select("c", { count: "exact", head: true }).limit(0);
    if(probe && probe.error) throw probe.error;
  } catch(e){ throw new Error("net"); }

  function parish(){ try { return String(Sync.getParish ? Sync.getParish() : ""); } catch(e){ return ""; } }
  function me(){ try { return String(Sync.getUser ? Sync.getUser() : ""); } catch(e){ return ""; } }

  function applyDerived(idx, recs){
    Sync.data[KEYS[idx]] = recs;
    var i, r;
    if(idx === 11){ Sync.goals = {}; for(i=0;i<recs.length;i++){ r=recs[i]; if(r.id) Sync.goals[r.id]=r.goal; } }
    if(idx === 10) Sync.updates = recs;
    if(idx === 6){ Sync.ministrySrv = {}; for(i=0;i<recs.length;i++){ r=recs[i]; if(r.id) Sync.ministrySrv[r.id]=r.roles||{}; } }
    if(idx === 13){ var s=null, inv=null; for(i=0;i<recs.length;i++){ r=recs[i]; if(r.id==="stream") s=r; if(r.id==="invite"&&r.code) inv=String(r.code); } Sync.stream=s; Sync.inviteCode=inv; }
    if(idx === 14) Sync.editors = recs.map(function(r){ return (r && r.id) || ""; }).filter(Boolean);
  }

  Sync.pullColl = function(idx){
    var par = parish();
    return client.from(TABLE).select("c,par,rid,body,ts").eq("c", idx).limit(600)
      .then(function(res){
        if(res.error) throw new Error("net");
        var recs = (res.data || []).map(rowToRec).filter(function(r){ return !r.par || r.par === par; });
        recs.sort(byTsDesc);
        applyDerived(idx, recs);
        return recs;
      });
  };

  Sync.pullAll = function(){
    var chain = Promise.resolve();
    for(var i = 0; i < KEYS.length; i++){
      (function(idx){
        chain = chain.then(function(){ return Sync.pullColl(idx).catch(function(){ return []; }); });
      })(i);
    }
    return chain;
  };

  Sync.push = function(idx, rec){
    var c = JSON.parse(JSON.stringify(rec));
    delete c.mine;
    c.par = parish();
    if(typeof c.ts !== "number") c.ts = Date.now();
    try { validate(idx, c); } catch(e){ return Promise.reject(e); }
    if(ADMIN_ONLY[idx] && !Sync.isAdmin) return Promise.reject(new Error("admin"));
    if(RESTRICTED[idx]){
      var by = me();
      if(!by || !(Sync.isAdmin || editorHas(Sync, by, c.par))) return Promise.reject(new Error("editors"));
    }
    try { rl("push", 60); } catch(e){ return Promise.reject(e); }
    var row = { c: idx, par: c.par || "", rid: c.id, body: c, ts: c.ts };
    return client.from(TABLE).upsert(row, { onConflict: "c,par,rid" })
      .then(function(res){
        if(res.error) throw new Error("srv");
        return Sync.pullColl(idx).catch(function(){});
      });
  };

  Sync.del = function(idx, id){
    var by = me();
    if(!(Sync.isAdmin || nameIsAdmin(Sync, by))) return Promise.reject(new Error("admin"));
    try { rl("del", 60); } catch(e){ return Promise.reject(e); }
    return client.from(TABLE).delete().eq("c", idx).eq("rid", String(id || ""))
      .then(function(res){
        if(res.error) throw new Error("srv");
        return Sync.pullColl(idx).catch(function(){});
      });
  };

  Sync.account = function(payload){
    var p = payload || {};
    var op = String(p.op || ""), by = String(p.by || me() || "");
    var par = String(p.par || parish() || "");
    var isAdm = !!Sync.isAdmin || nameIsAdmin(Sync, by);
    function touch(){ return Sync.pullColl(15).catch(function(){}); }
    function find(id){
      var arr = Sync.coll("users") || [];
      for(var i = 0; i < arr.length; i++) if(arr[i] && arr[i].id === id) return arr[i];
      return null;
    }
    function save(u){
      try { validate(15, u); } catch(e){ return Promise.reject(e); }
      var row = { c: 15, par: u.par || "", rid: u.id, body: u, ts: u.ts || Date.now() };
      return client.from(TABLE).upsert(row, { onConflict: "c,par,rid" })
        .then(function(res){ if(res.error) throw new Error("srv"); return touch(); });
    }
    if(op === "create"){
      if(!isAdm) return Promise.reject(new Error("admin"));
      var rec = { id: String(p.id || ""), name: String(p.name || ""), contact: String(p.contact || ""),
        role: String(p.role || "member"), codeH: String(p.codeH || ""), salt: "", pass: "", chk: "",
        par: par, ts: Date.now() };
      if(!rec.id || !rec.name || !rec.codeH) return Promise.reject(new Error("bad_rec"));
      if(!/^(member|editor|admin)$/.test(rec.role)) rec.role = "member";
      if(find(rec.id)) return Promise.reject(new Error("dup"));
      return save(rec).then(function(){ return { ok: 1, id: rec.id }; });
    }
    if(op === "setpass"){
      var f = find(String(p.id || "")); if(!f) return Promise.reject(new Error("no_user"));
      var u = JSON.parse(JSON.stringify(f));
      if(u.pass) return Promise.reject(new Error("already"));
      if(!u.codeH || sha256Hex(String(p.code || "")) !== u.codeH) return Promise.reject(new Error("code"));
      u.salt = String(p.salt || "").slice(0,40); u.pass = String(p.pass || "").slice(0,90);
      u.chk = String(p.chk || "").slice(0,80); u.codeH = "";
      return save(u).then(function(){ return { ok: 1 }; });
    }
    if(op === "passwd"){
      var f2 = find(String(p.id || "")); if(!f2) return Promise.reject(new Error("no_user"));
      var u2 = JSON.parse(JSON.stringify(f2));
      if(!u2.pass || !u2.chk) return Promise.reject(new Error("no_user"));
      if(sha256Hex(String(u2.salt || "") + "::" + String(p.oldpw || "")) !== u2.chk)
        return Promise.reject(new Error("denied"));
      u2.salt = String(p.salt || "").slice(0,40); u2.pass = String(p.pass || "").slice(0,90);
      u2.chk = String(p.chk || "").slice(0,80);
      return save(u2).then(function(){ return { ok: 1 }; });
    }
    if(op === "setrole"){
      if(!isAdm) return Promise.reject(new Error("admin"));
      var f3 = find(String(p.id || "")); if(!f3) return Promise.reject(new Error("no_user"));
      if(!/^(member|editor|admin)$/.test(String(p.role || ""))) return Promise.reject(new Error("bad_rec"));
      var u3 = JSON.parse(JSON.stringify(f3)); u3.role = String(p.role);
      return save(u3).then(function(){ return { ok: 1 }; });
    }
    if(op === "reset"){
      if(!isAdm) return Promise.reject(new Error("admin"));
      var f4 = find(String(p.id || "")); if(!f4) return Promise.reject(new Error("no_user"));
      var u4 = JSON.parse(JSON.stringify(f4));
      u4.codeH = String(p.codeH || ""); u4.salt = ""; u4.pass = ""; u4.chk = "";
      if(!u4.codeH) return Promise.reject(new Error("bad_rec"));
      return save(u4).then(function(){ return { ok: 1 }; });
    }
    return Promise.reject(new Error("bad_op"));
  };

  var fails = 0;
  Sync.auth = function(pw){
    if(fails >= 6) return Promise.resolve(false);
    var ok = false;
    try { ok = CLOUD.ADMIN_SHA256 && sha256Hex(String(pw)) === CLOUD.ADMIN_SHA256; } catch(e){}
    if(ok){ Sync.isAdmin = true; Sync._pass = String(pw); fails = 0; return Promise.resolve(true); }
    fails++;
    return Promise.resolve(false);
  };

  Sync.logout = function(){
    Sync.isAdmin = false; Sync._pass = null;
    return Promise.resolve({ ok: 1 });
  };

  Sync.refresh = function(){
    if(!Sync._cloud) return Promise.resolve();
    return Sync.pullAll().then(function(){ if(Sync.onUpdate) Sync.onUpdate(); }).catch(function(){});
  };

  // Sube los datos locales a la nube una sola vez (conserva ids).
  Sync.migrate = function(){
    try { if(localStorage.getItem(MIGKEY)){ Sync.migrated = true; return Promise.resolve(0); } } catch(e){}
    var dump = Sync._dump ? Sync._dump() : null;
    if(!dump){ try { localStorage.setItem(MIGKEY, "1"); } catch(e2){} Sync.migrated = true; return Promise.resolve(0); }
    var jobs = [];
    function each(idx, arr){ (arr || []).forEach(function(r){ jobs.push([idx, r]); }); }
    each(0, dump.bulletins); each(1, dump.documents); each(2, dump.messages);
    each(3, dump.intenciones); each(4, dump.directory); each(5, dump.news);
    each(7, dump.parishPrayers); each(8, dump.cantos); each(9, dump.videos); each(12, dump.muro);
    (dump.ministry || []).forEach(function(m){ jobs.push([6, m]); });
    (dump.updates || []).forEach(function(u){ jobs.push([10, u]); });
    (dump.goals || []).forEach(function(g){ jobs.push([11, g]); });
    (dump.editors || []).forEach(function(n){ jobs.push([14, n]); });
    if(dump.stream) jobs.push([13, dump.stream]);
    var chain = Promise.resolve();
    jobs.forEach(function(j){
      chain = chain.then(function(){
        var c = JSON.parse(JSON.stringify(j[1]));
        delete c.mine;
        return Sync.push(j[0], c).catch(function(){});
      });
    });
    return chain.then(function(){ return Sync.pullAll().catch(function(){}); }).then(function(){
      try { localStorage.setItem(MIGKEY, "1"); } catch(e){}
      Sync.migrated = true;
      return jobs.length;
    });
  };

  // Realtime: al cambiar algo en la tabla, recargar esa colección y repintar.
  var pend = {}, pt = 0;
  function schedulePull(c){
    if(!(c >= 0 && c < KEYS.length)){
      Sync.refresh().catch(function(){});
      return;
    }
    pend[c] = 1;
    if(pt) return;
    pt = setTimeout(function(){
      pt = 0;
      var cols = Object.keys(pend).map(Number);
      pend = {};
      var chain = Promise.resolve();
      cols.forEach(function(idx){
        chain = chain.then(function(){ return Sync.pullColl(idx).catch(function(){}); });
      });
      chain.then(function(){ if(Sync.onUpdate) { try { Sync.onUpdate(); } catch(e){} } }).catch(function(){});
    }, 800);
  }

  Sync.backend = "supabase";
  Sync.online = true; Sync.connecting = true; Sync._retry = 0; Sync._configReady = false;
  await Sync.pullAll().catch(function(){});
  await Sync.migrate().catch(function(){});
  Sync._configReady = true; Sync.connecting = false;
  if(Sync._pass){ try { await Sync.auth(Sync._pass); } catch(e){} }
  Sync._cloud = true;
  if(Sync.onUpdate){ try { Sync.onUpdate(); } catch(e){} }
  try {
    client.channel("parish-records")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, function(payload){
        var c = null;
        if(payload && payload.new && typeof payload.new.c === "number") c = payload.new.c;
        else if(payload && payload.old && typeof payload.old.c === "number") c = payload.old.c;
        try { schedulePull(c); } catch(e){}
      })
      .subscribe();
  } catch(e){}
  return true;
}
