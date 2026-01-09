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

    const fallback = {
      currency: "INR",

      banners: {
        heroBannerDesktopUrl: "https://pub-c1f56b2e5a0a43aabe3aac3dcb2f27db.r2.dev/banners/hero-desktop.jpg",
        heroBannerMobileUrl: "https://pub-c1f56b2e5a0a43aabe3aac3dcb2f27db.r2.dev/banners/hero-mobile.jpg",
        heroHeadline: "Get Clarity. Get Direction.",
        heroSub: "Vedic guidance with practical remedies",
        heroKicker: "20+ Years Experience",
        whatsappNumber: "919999999999",
      },

      services: [
        {
          id: "love",
          name: "Love & Relationships",
          price: 351,
          badge: "Popular",
          subtitle: "Clarity on compatibility, marriage timing & next steps.",
          bullets: ["30-min consult", "Timing windows", "2 follow-ups free"],
          cta: "Start now",
          gst_note: "incl. GST",
          active: true,
          sort: 10
        },
        {
          id: "career",
          name: "Career & Money",
          price: 451,
          badge: "Best Value",
          subtitle: "Job change timing, business luck & wealth pathways.",
          bullets: ["40-min deep dive", "90-day plan", "PDF remedies"],
          cta: "Start now",
          gst_note: "incl. GST",
          active: true,
          sort: 20
        },
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

