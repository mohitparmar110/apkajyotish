// functions/api/config.js

function splitCsvLine(line) {
  // split commas that are NOT inside quotes
  return line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
}

function cleanCell(v) {
  return String(v ?? "")
    .replace(/^\uFEFF/, "")     // remove BOM
    .trim()
    .replace(/^"(.*)"$/, "$1")  // remove wrapping quotes
    .replace(/""/g, '"');       // unescape quotes
}

function csvToObjects(csv) {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines.shift()).map(cleanCell);

  return lines.map((line) => {
    const values = splitCsvLine(line).map(cleanCell);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i] ?? ""));
    return obj;
  });
}

const toBool = (v) => ["true", "yes", "1"].includes(String(v).trim().toLowerCase());
const toNum = (v) => {
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
};

export async function onRequestGet({ request, env }) {
  const SHEET_ID = env.SHEET_ID;

  if (!SHEET_ID) {
    return new Response(JSON.stringify({ error: "SHEET_ID missing in Pages env vars" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const urlOf = (sheet) =>
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

  const fetchCsv = async (sheet) => {
    const res = await fetch(urlOf(sheet), {
      headers: {
        // helps avoid weird edge-cases
        "accept": "text/csv,*/*",
      },
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Fetch failed for "${sheet}" (${res.status}): ${text.slice(0, 200)}`);
    }

    // If Google returns HTML/login page instead of CSV
    if (text.trim().startsWith("<!DOCTYPE html") || text.includes("<html")) {
      throw new Error(
        `Google returned HTML (permissions issue). Make sheet "Anyone with link: Viewer". Sheet: ${sheet}`
      );
    }

    return text;
  };

  // Optional: bypass caching while testing
  const noCache = new URL(request.url).searchParams.get("nocache") === "1";

  try {
    const servicesRaw = csvToObjects(await fetchCsv("services"));
    const bannersRaw = csvToObjects(await fetchCsv("banners"));
    const faqRaw = csvToObjects(await fetchCsv("faq"));
    const testimonialsRaw = csvToObjects(await fetchCsv("testimonials"));

    const services = servicesRaw
      .map((s) => ({
        id: s.id,
        name: s.name,
        price: toNum(s.price),
        badge: s.badge || "",
        active: toBool(s.active),
        sort: toNum(s.sort) ?? 999,
      }))
      .filter((s) => s.id && s.name && s.price != null && s.active)
      .sort((a, b) => a.sort - b.sort);

    const banners = {};
    bannersRaw.forEach((b) => {
      if (b.key) banners[b.key] = b.value ?? "";
    });

    const faq = faqRaw
      .map((f) => ({
        q: f.q,
        a: f.a,
        active: toBool(f.active),
        sort: toNum(f.sort) ?? 999,
      }))
      .filter((f) => f.q && f.a && f.active)
      .sort((a, b) => a.sort - b.sort);

    const testimonials = testimonialsRaw
      .map((t) => ({
        name: t.name,
        city: t.city,
        text: t.text,
        active: toBool(t.active),
        sort: toNum(t.sort) ?? 999,
      }))
      .filter((t) => t.name && t.text && t.active)
      .sort((a, b) => a.sort - b.sort);

    return new Response(JSON.stringify({ currency: "INR", services, banners, faq, testimonials }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": noCache ? "no-store" : "public, max-age=60",
        "access-control-allow-origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
