// Supabase Edge Function: proxy del texto oficial USCCB (Deno).
// Despliegue SIN CLI (dashboard): ver `src/cloud/README.md` §F (2 min).
//   Nombre de la función: `usccb`  (el cliente la llama en
//   `${SUPABASE_URL}/functions/v1/usccb?iso=YYYY-MM-DD&lang=es|en`)
// Por qué existe: GitHub Pages es estático y el navegador bloquea la lectura
// directa de bible.usccb.org (sin cabeceras CORS). Esta función descarga la
// página en el servidor (sin limitación CORS) y la devuelve como JSON con
// `Access-Control-Allow-Origin: *`. No guarda nada, no necesita secretos.
// El texto sigue siendo © USCCB: la app solo lo muestra in-app + caché local.

Deno.serve(async (req: Request): Promise<Response> => {
  const cors: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "apikey, authorization, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json", ...extra },
    });

  let iso = "", lang = "en";
  try {
    const u = new URL(req.url);
    iso = u.searchParams.get("iso") || "";
    lang = u.searchParams.get("lang") === "es" ? "es" : "en";
  } catch {
    return json({ ok: false, error: "bad-request" }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return json({ ok: false, error: "bad-date" }, 400);

  const code = iso.slice(5, 7) + iso.slice(8, 10) + iso.slice(2, 4);
  const target =
    lang === "es"
      ? `https://bible.usccb.org/es/bible/lecturas/${code}.cfm`
      : `https://bible.usccb.org/bible/readings/${code}.cfm`;

  try {
    const r = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 SantaCruzParishApp/1.0",
        "Accept-Language": lang === "es" ? "es,en;q=0.8" : "en",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(20000),
    });
    const html = await r.text();
    if (!r.ok) return json({ ok: false, error: "http", status: r.status }, 502);
    // La página del día es inmutable: caché pública 1 h (el cliente guarda 30 días).
    return json({ ok: true, url: target, html }, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    });
  } catch (e) {
    return json({ ok: false, error: "net", detail: String(e).slice(0, 200) }, 502);
  }
});
