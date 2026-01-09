// functions/api/config.js

export async function onRequestGet({ env }) {
  try {
    const raw = await env.APK_KV.get("config");
    if (raw) {
      return new Response(raw, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "access-control-allow-origin": "*",
        },
      });
    }

    // Fallback default (first time before you save)
    const fallback = {
      currency: "INR",

      // ✅ Match admin.html structure
      banners: {
        heroBannerDesktopUrl: "https://cdn.apkajyotish.com/banners/hero-desktop.jpg",
        heroBannerMobileUrl: "https://cdn.apkajyotish.com/banners/hero-mobile.jpg",
        heroHeadline: "Get Clarity. Get Direction.",
        heroSub: "Vedic guidance with practical remedies",
        heroKicker: "20+ Years Experience",
        whatsappNumber: "919999999999",
      },

      services: [
        { id: "love", name: "Love & Relationships", price: 351, badge: "Popular", active: true, sort: 10 },
        { id: "career", name: "Career & Money", price: 451, badge: "Best Value", active: true, sort: 20 },
      ],

      faq: [
        { q: "What do I need to send?", a: "Date, time, place of birth.", active: true, sort: 10 },
      ],

      testimonials: [
        { name: "Rahul", city: "Delhi", text: "Accurate & practical guidance.", active: true, sort: 10 },
      ],
    };

    return new Response(JSON.stringify(fallback), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
      },
    });
  }
}
