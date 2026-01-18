// functions/api/admin/save.js

function json(res, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, x-admin-token",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

function asString(v, fallback = "") {
  return (v === null || v === undefined) ? fallback : String(v).trim();
}
function asNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function asBool(v) {
  // ✅ FIX: avoid Boolean("false") === true
  if (v === true || v === false) return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "y", "on"].includes(s)) return true;
  if (["false", "0", "no", "n", "off", ""].includes(s)) return false;
  return false;
}

function normalizeBullets(v){
  if (Array.isArray(v)) {
    return v.map(x => asString(x)).filter(Boolean);
  }
  const txt = asString(v);
  if (!txt) return [];
  return txt
    .split(/\r?\n|,/g)
    .map(s => s.trim())
    .filter(Boolean);
}

export async function onRequestOptions() {
  return json({ ok: true }, 200);
}

export async function onRequestPost({ request, env }) {
  try {
    const token = request.headers.get("x-admin-token");
    if (!token || token !== env.ADMIN_TOKEN) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await request.json();
    if (!body || typeof body !== "object") return json({ error: "Invalid JSON" }, 400);

    // Read existing config to preserve values when fields are omitted
    let existing = {};
    try {
      const raw = await env.APK_KV.get("config");
      if (raw) existing = JSON.parse(raw);
    } catch (_) {}

    if (!body.currency) body.currency = "INR";
    if (!Array.isArray(body.services)) body.services = [];
    if (!Array.isArray(body.faq)) body.faq = [];
    if (!Array.isArray(body.testimonials)) body.testimonials = [];
    if (!body.banners || typeof body.banners !== "object") body.banners = {};

    const legacyHero = body.hero || body.banners?.hero || {};

    // ✅ WhatsApp precedence fix preserved
    const normalizedBanners = {
      heroBannerDesktopUrl: asString(
        body.banners.heroBannerDesktopUrl ||
        legacyHero.desktopBanner ||
        legacyHero.desktopBannerUrl ||
        existing?.banners?.heroBannerDesktopUrl ||
        ""
      ),
      heroBannerMobileUrl: asString(
        body.banners.heroBannerMobileUrl ||
        legacyHero.mobileBanner ||
        legacyHero.mobileBannerUrl ||
        existing?.banners?.heroBannerMobileUrl ||
        ""
      ),
      heroHeadline: asString(
        body.banners.heroHeadline ||
        legacyHero.headline ||
        existing?.banners?.heroHeadline ||
        ""
      ),
      heroSub: asString(
        body.banners.heroSub ||
        legacyHero.subline ||
        legacyHero.sub ||
        existing?.banners?.heroSub ||
        ""
      ),
      heroKicker: asString(
        body.banners.heroKicker ||
        legacyHero.kicker ||
        existing?.banners?.heroKicker ||
        ""
      ),
      whatsappNumber: asString(
        body.banners.whatsappNumber ||
        legacyHero.whatsapp ||
        existing?.banners?.whatsappNumber ||
        ""
      ),
    };

    body.banners = normalizedBanners;

    body.services = body.services
      .map((s) => ({
        id: asString(s?.id),
        name: asString(s?.name),
        price: asNumber(s?.price, 0),
        badge: asString(s?.badge),
        subtitle: asString(s?.subtitle),
        bullets: normalizeBullets(s?.bullets),
        cta: asString(s?.cta, "Start now"),
        gst_note: asString(s?.gst_note, "incl. GST"),
        active: asBool(s?.active),
        sort: asNumber(s?.sort, 999),
      }))
      .filter((s) => s.id && s.name);

    body.faq = body.faq
      .map((f) => ({
        q: asString(f?.q),
        a: asString(f?.a),
        active: asBool(f?.active),
        sort: asNumber(f?.sort, 999),
      }))
      .filter((f) => f.q && f.a);

    body.testimonials = body.testimonials
      .map((t) => ({
        name: asString(t?.name),
        city: asString(t?.city),
        text: asString(t?.text),
        active: asBool(t?.active),
        sort: asNumber(t?.sort, 999),
      }))
      .filter((t) => t.name && t.text);

    const finalConfig = {
      currency: asString(body.currency, "INR"),
      banners: body.banners,
      services: body.services,
      faq: body.faq,
      testimonials: body.testimonials,
    };

    await env.APK_KV.put("config", JSON.stringify(finalConfig));

    return json(
      {
        ok: true,
        savedAt: new Date().toISOString(),
        whatsappNumber: finalConfig.banners.whatsappNumber,
      },
      200
    );
  } catch (err) {
    return json({ error: err?.message || "Save failed" }, 500);
  }
}
