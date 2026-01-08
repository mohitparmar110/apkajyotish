// functions/api/admin/save.js

function json(res, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const token = request.headers.get("x-admin-token");
    if (!token || token !== env.ADMIN_TOKEN) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();

    // Minimal validation
    if (!body || typeof body !== "object") return json({ error: "Invalid JSON" }, 400);
    if (!body.currency) body.currency = "INR";
    if (!body.services) body.services = [];
    if (!body.banners) body.banners = {};
    if (!body.faq) body.faq = [];
    if (!body.testimonials) body.testimonials = [];

    // Normalize numbers / booleans
    body.services = body.services.map(s => ({
      id: String(s.id || "").trim(),
      name: String(s.name || "").trim(),
      price: Number(s.price || 0),
      badge: String(s.badge || "").trim(),
      active: Boolean(s.active),
      sort: Number(s.sort || 999),
    })).filter(s => s.id && s.name);

    body.faq = body.faq.map(f => ({
      q: String(f.q || "").trim(),
      a: String(f.a || "").trim(),
      active: Boolean(f.active),
      sort: Number(f.sort || 999),
    })).filter(f => f.q && f.a);

    body.testimonials = body.testimonials.map(t => ({
      name: String(t.name || "").trim(),
      city: String(t.city || "").trim(),
      text: String(t.text || "").trim(),
      active: Boolean(t.active),
      sort: Number(t.sort || 999),
    })).filter(t => t.name && t.text);

    await env.APK_KV.put("config", JSON.stringify(body));

    return json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
