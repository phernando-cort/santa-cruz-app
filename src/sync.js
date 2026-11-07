import { cloudEnabled, cloudConnect } from "./sync-cloud.js";

// Fase 2 — sincronización con el servidor compartido (gratis, infraestructura Perchance).
// Si hay conexión: lee/escribe en el servidor (todos los teléfonos ven lo mismo).
// Si no hay conexión: la app sigue funcionando con los datos locales de cada teléfono.
var KEYS = ["bulletins","documents","messages","intenciones","directory","news","ministry","parishPrayers","cantos","videos","givingUpdates","givingGoals","muro","config","editors","users"];
var MIGKEY = "sync.migrated.v1";

export var Sync = {
  online: false, isAdmin: false, connecting: false, _configReady: false,
  data: {}, editors: [], goals: {}, updates: [], ministrySrv: {}, stream: null, inviteCode: null,
  migrated: false, getParish: function(){ return ""; }, getUser: function(){ return ""; }, onUpdate: null,
  _sock: null, _pass: null, _retry: 0, _rt: 0
};
for (var k0 = 0; k0 < KEYS.length; k0++) Sync.data[KEYS[k0]] = [];

Sync.coll = function(k){ return Sync.data[k] || []; };
Sync.updatesFor = function(pid){ return Sync.updates.filter(function(u){ return u.pid === pid; }); };
Sync.goalFor = function(pid){ var g = Sync.goals[pid]; return (g === undefined || g === null) ? null : +g; };

function rpc1(method, payload){
  return Sync._sock.rpc[method](payload).then(function(r){ return JSON.parse(r); });
}
function byTsDesc(a, b){ return (b.ts || 0) - (a.ts || 0); }

Sync.pullColl = function(idx){
  var self = this;
  return rpc1("pull", JSON.stringify({ c: idx, par: self.getParish() })).then(function(res){
    var recs = (res && res.recs) || [];
    recs.sort(byTsDesc);
    self.data[KEYS[idx]] = recs;
    if (idx === 11) { self.goals = {}; recs.forEach(function(r){ if (r.id) self.goals[r.id] = r.goal; }); }
    if (idx === 10) self.updates = recs;
    if (idx === 6) { self.ministrySrv = {}; recs.forEach(function(r){ if (r.id) self.ministrySrv[r.id] = r.roles || {}; }); }
    if (idx === 13) { var s = null, inv = null; recs.forEach(function(r){ if (r.id === "stream") s = r; if (r.id === "invite" && r.code) inv = String(r.code); }); self.stream = s; self.inviteCode = inv; }
    if (idx === 14) self.editors = recs.map(function(r){ return r.id; });
    return recs;
  });
};

Sync.pullAll = function(){
  var self = this, chain = Promise.resolve();
  for (var i = 0; i < KEYS.length; i++) {
    (function(idx){
      chain = chain.then(function(){ return self.pullColl(idx).catch(function(){ return []; }); });
    })(i);
  }
  return chain;
};

Sync.push = function(idx, rec){
  var self = this;
  var c = JSON.parse(JSON.stringify(rec));
  delete c.mine;
  c.par = self.getParish();
  if (typeof c.ts !== "number") c.ts = Date.now();
  return rpc1("push", JSON.stringify({ c: idx, rec: c, by: self.getUser() })).then(function(res){
    if (!res || !res.ok) throw new Error("srv");
    return self.pullColl(idx).catch(function(){});
  });
};

Sync.del = function(idx, id){
  var self = this;
  return rpc1("del", JSON.stringify({ c: idx, id: id, by: self.getUser() })).then(function(){
    return self.pullColl(idx).catch(function(){});
  });
};

Sync.account = function(payload){
  var self = this;
  var p = payload || {};
  if(!p.by) p.by = self.getUser();
  if(!p.par) p.par = self.getParish();
  return rpc1("account", JSON.stringify(p));
};

Sync.auth = function(pw){
  var self = this;
  return Sync._sock.rpc.auth(String(pw)).then(function(r){
    var res = JSON.parse(r);
    if (res && res.ok) { self.isAdmin = true; self._pass = String(pw); return true; }
    return false;
  });
};

Sync.logout = function(){
  var self = this;
  self.isAdmin = false; self._pass = null;
  try { if (self._sock) self._sock.rpc.logout("{}").catch(function(){}); } catch (e) {}
};

function scheduleRetry(){
  var self = Sync;
  if (self._rt) return;
  var wait = Math.min(60000, (1000 * Math.pow(2, self._retry)) + Math.random() * 1000);
  self._retry++;
  self._rt = setTimeout(function(){ self._rt = 0; self.connect(); }, wait);
}

Sync.connect = function(){
  var self = this;
  if (self.connecting || self._sock || self._cloud) return Promise.resolve();
  // 1) Nube Supabase (GitHub Pages). Si no está configurada, se sigue abajo.
  try {
    if (cloudEnabled()) {
      self.connecting = true;
      return cloudConnect(self).then(function(ok){
        if (ok) return;
        self.connecting = false;
      }).catch(function(err){
        self.connecting = false; self.online = false;
        try { self._cloudError = String((err && err.message) || err); } catch(e2){}
        scheduleRetry();
      });
    }
  } catch (e) {}
  // 2) Servidor Perchance (solo dentro de Perchance).
  if (typeof root === "undefined" || !root.createServerSocket) { scheduleRetry(); return Promise.resolve(); }
  self.connecting = true;
  var sock;
  try { sock = root.createServerSocket(); }
  catch (e) { self.connecting = false; scheduleRetry(); return Promise.resolve(); }
  self._sock = sock;
  try {
    sock.addEventListener("message", function(ev){
      try {
        var m = JSON.parse(ev.data);
        if (m && typeof m.c === "number" && (!m.par || m.par === self.getParish())) {
          self.pullColl(m.c).then(function(){ if (self.onUpdate) self.onUpdate(); }).catch(function(){});
        }
      } catch (e) {}
    });
    sock.addEventListener("close", function(ev){
      var code = ev && ev.code;
      self.online = false; self.isAdmin = false; self._sock = null; self.connecting = false;
      if (self.onUpdate) { try { self.onUpdate(); } catch (e2) {} }
      if (code === 4403) return; // incrustado fuera de perchance: sin reintentos
      if (code === 4429) { setTimeout(function(){ self.connect(); }, 65000); return; }
      scheduleRetry();
    });
  } catch (e) {}
  return sock.opened.then(function(){
    self.online = true; self.connecting = false; self._retry = 0; self._configReady = false;
    var done = self.pullAll().then(function(){
      return self.migrate().then(function(){
        self._configReady = true;
        if (self._pass) {
          return self.auth(self._pass).catch(function(){ self.isAdmin = false; });
        }
      });
    });
    return done.then(function(){ if (self.onUpdate) self.onUpdate(); }).catch(function(){});
  }).catch(function(){
    self.online = false; self.connecting = false; self._sock = null;
    scheduleRetry();
  });
};

Sync.refresh = function(){
  var self = this;
  if (!self.online) return Promise.resolve();
  return self.pullAll().then(function(){ if (self.onUpdate) self.onUpdate(); }).catch(function(){});
};

// Sube los datos locales al servidor una sola vez (conserva ids: no duplica).
Sync.migrate = function(){
  var self = this;
  try { if (localStorage.getItem(MIGKEY)) { self.migrated = true; return Promise.resolve(0); } } catch (e) {}
  var dump = self._dump ? self._dump() : null;
  if (!dump) { try { localStorage.setItem(MIGKEY, "1"); } catch (e2) {} self.migrated = true; return Promise.resolve(0); }
  var jobs = [];
  function each(idx, arr){ (arr || []).forEach(function(r){ jobs.push([idx, r]); }); }
  each(0, dump.bulletins); each(1, dump.documents); each(2, dump.messages);
  each(3, dump.intenciones); each(4, dump.directory); each(5, dump.news);
  each(7, dump.parishPrayers); each(8, dump.cantos); each(9, dump.videos); each(12, dump.muro);
  (dump.ministry || []).forEach(function(m){ jobs.push([6, m]); });
  (dump.updates || []).forEach(function(u){ jobs.push([10, u]); });
  (dump.goals || []).forEach(function(g){ jobs.push([11, g]); });
  (dump.editors || []).forEach(function(n){ jobs.push([14, n]); });
  if (dump.stream) jobs.push([13, dump.stream]);
  var chain = Promise.resolve(), n = 0;
  jobs.forEach(function(j){
    chain = chain.then(function(){
      var c = JSON.parse(JSON.stringify(j[1]));
      delete c.mine;
      if (!c.par) c.par = self.getParish();
      if (typeof c.ts !== "number") c.ts = Date.now() - (n++);
      return rpc1("push", JSON.stringify({ c: j[0], rec: c, by: self.getUser() || "Migración" })).catch(function(){});
    });
  });
  return chain.then(function(){ return self.pullAll().catch(function(){}); }).then(function(){
    try { localStorage.setItem(MIGKEY, "1"); } catch (e) {}
    self.migrated = true;
    return jobs.length;
  });
};
