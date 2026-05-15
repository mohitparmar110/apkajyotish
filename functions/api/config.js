// functions/api/config.js

function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
          status,
          headers: {
                  "content-type": "application/json; charset=utf-8",
                  "cache-control": "no-store",
                  "access-control-allow-origin": "*",
                  "access-control-allow-methods": "GET, OPTIONS",
                  "access-control-allow-headers": "content-type, x-admin-token",
          },
    });
}

export async function onRequestOptions() {
    return json({ ok: true }, 200);
}

function isValidApkaJyotishConfig(cfg) {
    // Validate that the config belongs to ApkaJyotish (not another site like AquaShield)
  // AquaShield config has navigation.companyName="AquaShield" or hero.active="terrace"
  if (!cfg) return false;
    if (cfg.navigation && cfg.navigation.companyName && cfg.navigation.companyName !== "ApkaJyotish") return false;
    if (cfg.hero && cfg.hero.active && ["terrace", "toilet", "heat"].includes(cfg.hero.active)) return false;
    // Must have services array or currency field typical of ApkaJyotish
  if (cfg.currency === "INR" && Array.isArray(cfg.services)) return true;
    // If KV has neither navigation.companyName nor hero.active waterproofing keys, accept it
  if (!cfg.navigation && !cfg.hero) return true;
    return false;
}

export async function onRequestGet({ env }) {
    try {
          const raw = await env.APK_KV.get("config");
          if (raw) {
                  try {
                            const parsed = JSON.parse(raw);
                            if (isValidApkaJyotishConfig(parsed)) {
                                        return new Response(raw, {
                                                      headers: {
                                                                      "content-type": "application/json; charset=utf-8",
                                                                      "cache-control": "no-store",
                                                                      "access-control-allow-origin": "*",
                                                      },
                                        });
                            }
                            // KV config is invalid (likely belongs to another site) - use fallback
                  } catch (e) {
                            // JSON parse error - use fallback
                  }
          }

      const fallback = {
              currency: "INR",
              banners: {
                        heroBannerDesktopUrl: "https://pub-c1f56b2e5a0a43aabe3aac3dcb2f27db.r2.dev/banners/hero-desktop.jpg",
                        heroBannerMobileUrl: "https://pub-c1f56b2e5a0a43aabe3aac3dcb2f27db.r2.dev/banners/hero-mobile.jpg",
                        heroHeadline: "Get Clarity. Get Direction.",
                        heroSub: "Vedic guidance with practical remedies",
                        heroKicker: "20+ Years Experience",
                        whatsappNumber: "919326139609",
              },
              services: [
                {
                            id: "love",
                            name: "Love & Relationship Reading",
                            price: 899,
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
                            name: "Career & Business Guidance",
                            price: 1199,
                            badge: "Best Value",
                            subtitle: "Job change timing, business luck & wealth pathways.",
                            bullets: ["40-min deep dive", "90-day plan", "PDF remedies"],
                            cta: "Start now",
                            gst_note: "incl. GST",
                            active: true,
                            sort: 20
                },
                {
                            id: "kundali",
                            name: "Janam Kundali Reading",
                            price: 799,
                            badge: "",
                            subtitle: "Complete birth chart analysis — 45-60 min session.",
                            bullets: ["Full chart analysis", "Written summary", "Remedies included"],
                            cta: "Book Now",
                            gst_note: "incl. GST",
                            active: true,
                            sort: 30
                },
                {
                            id: "matching",
                            name: "Marriage & Kundali Matching",
                            price: 999,
                            badge: "",
                            subtitle: "In-depth compatibility for you and your partner.",
                            bullets: ["Ashtakoota analysis", "Mangal dosha check", "Timing advice"],
                            cta: "Check Compatibility",
                            gst_note: "incl. GST",
                            active: true,
                            sort: 40
                },
                {
                            id: "gemstone",
                            name: "Gemstone Consultation",
                            price: 599,
                            badge: "",
                            subtitle: "Right gemstone for your chart and goals.",
                            bullets: ["Chart-specific selection", "Wear guide", "Alternatives"],
                            cta: "Get Advice",
                            gst_note: "incl. GST",
                            active: true,
                            sort: 50
                },
                {
                            id: "annual",
                            name: "Annual Forecast",
                            price: 1499,
                            badge: "",
                            subtitle: "12-month roadmap with monthly guidance.",
                            bullets: ["Full year forecast", "Monthly periods", "Written report"],
                            cta: "Plan My Year",
                            gst_note: "incl. GST",
                            active: true,
                            sort: 60
                },
                {
                            id: "full",
                            name: "Full Life Comprehensive Reading",
                            price: 2499,
                            badge: "BEST VALUE",
                            subtitle: "90-min Zoom deep-dive — all life areas, Lal Kitab, divisional charts.",
                            bullets: ["90-min deep-dive session", "All 16 divisional charts", "Lal Kitab + Vedic combined", "Full written PDF report", "30-day follow-up window"],
                            cta: "Book Full Reading",
                            gst_note: "incl. GST",
                            active: true,
                            sort: 70
                },
                      ],
              faq: [
                { q: "What do I need to send?", a: "Date, time, place of birth.", active: true, sort: 10 },
                { q: "How accurate is Vedic astrology?", a: "Vedic astrology uses your exact birth chart and is highly precise when birth data is accurate.", active: true, sort: 20 },
                      ],
              testimonials: [
                { name: "Rahul", city: "Delhi", text: "Accurate & practical guidance.", active: true, sort: 10 },
                { name: "Priya", city: "Mumbai", text: "Life-changing consultation.", active: true, sort: 20 },
                      ],
      };

      return json(fallback, 200);
    } catch (err) {
          return json({ error: err?.message || "Config failed" }, 500);
    }
}
