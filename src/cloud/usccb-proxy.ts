Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "apikey, authorization, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
  };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  function json(body, status, extra) {
    const h = { "Content-Type": "application/json" };
    for (const k in cors) h[k] = cors[k];
    if (extra) for (const k in extra) h[k] = extra[k];
    return new Response(JSON.stringify(body), { status: status || 200, headers: h });
  }
  let iso = "";
  let lang = "en";
  try {
    const u = new URL(req.url);
    iso = u.searchParams.get("iso") || "";
    if (u.searchParams.get("lang") === "es") lang = "es";
  } catch (e2) {
    return json({ ok: false, error: "bad-request" }, 400);
  }
  function isDate(s) {
    if (!s || s.length !== 10) return false;
    if (s.charAt(4) !== "-" || s.charAt(7) !== "-") return false;
    const d = s.slice(0, 4) + s.slice(5, 7) + s.slice(8, 10);
    for (let i = 0; i < d.length; i++) {
      const c = d.charCodeAt(i);
      if (c < 48 || c > 57) return false;
    }
    return true;
  }
  if (!isDate(iso)) return json({ ok: false, error: "bad-date" }, 400);
  const code = iso.slice(5, 7) + iso.slice(8, 10) + iso.slice(2, 4);
  const target = lang === "es"
    ? "https://bible.usccb.org/es/bible/lecturas/" + code + ".cfm"
    : "https://bible.usccb.org/bible/readings/" + code + ".cfm";
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 20000);
    const r = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 SantaCruzParishApp/1.0",
        "Accept-Language": lang === "es" ? "es,en;q=0.8" : "en",
        "Accept": "text/html"
      },
      signal: ctl.signal
    });
    clearTimeout(t);
    const html = await r.text();
    if (!r.ok) return json({ ok: false, error: "http", status: r.status }, 502);
    return json({ ok: true, url: target, html: html }, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    });
  } catch (e) {
    return json({ ok: false, error: "net", detail: String(e).slice(0, 200) }, 502);
  }
});
