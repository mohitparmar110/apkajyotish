export async function onRequestGet(context) {
  const SHEET_ID = context.env.SHEET_ID;

  if (!SHEET_ID) {
    return new Response(JSON.stringify({ error: "SHEET_ID missing in env vars" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const fetchCsv = async (sheetName) => {
    const url =
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq` +
      `?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Failed to fetch "${sheetName}" (${res.status}): ${txt.slice(0, 120)}`);
    }
    return await res.text();
  };

  // Basic CSV (works fine as long as your cells don't contain commas in text)
  const splitCsvLine = (line) =>
  line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/); // splits commas outside quotes

const clean = (v) =>
  String(v ?? "")
    .trim()
    .replace(/^\uFEFF/, "")          // remove BOM if any
    .replace(/^"(.*)"$/, "$1")       // strip wrapping quotes
    .replace(/""/g, '"');            // unescape double quotes

const csvToObjects = (csv) => {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const headers = splitCsvLine(lines.shift()).map(clean);

  return lines.map((line) => {
    const values = splitCsvLine(line).map(clean);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = values[i] ?? ""));
    return obj;
  });
};

    });
  };

  const toBool = (v) => String(v).trim().toLowerCase() === "true";
  const toNum = (v) => {
    const n = Number(String(v).trim());
    return Number.isFinite(n) ? n : null;
  };

  try {
    const servicesRaw = csvToObjects(await fetchCsv("services"));
    const bannersRaw = csvToObjects(await fetchCsv("banners"));
    const faqRaw = csvToObjects(await fetchCsv("faq"));
    const testimonialsRaw = csvToObjects(await fetchCsv("testimonials"));

    const services = servicesRaw
      .map(s => ({
        id: s.id,
        name: s.name,
        price: toNum(s.price),
        badge: s.badge || "",
        active: toBool(s.active),
        sort: toNum(s.sort) ?? 999,
      }))
      .filter(s => s.id && s.name && s.price != null && s.active)
      .sort((a, b) => a.sort - b.sort);

    const banners = {};
    bannersRaw.forEach(b => {
      if (b.key) banners[b.key] = b.value ?? "";
    });

    const faq = faqRaw
      .map(f => ({
        q: f.q,
        a: f.a,
        active: toBool(f.active),
        sort: toNum(f.sort) ?? 999,
      }))
      .filter(f => f.q && f.a && f.active)
      .sort((a, b) => a.sort - b.sort);

    const testimonials = testimonialsRaw
      .map(t => ({
        name: t.name,
        city: t.city,
        text: t.text,
        active: toBool(t.active),
        sort: toNum(t.sort) ?? 999,
      }))
      .filter(t => t.name && t.text && t.active)
      .sort((a, b) => a.sort - b.sort);

    return new Response(JSON.stringify({ currency: "INR", services, banners, faq, testimonials }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60",
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
