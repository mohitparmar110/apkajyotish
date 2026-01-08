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

  const csvToObjects = (csv) => {
    const lines = csv.split("\n").map(l => l.trim()).filter(Boolean);
    const headers = lines.shift().split(",").map(h => h.trim());
    return lines.map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, i) => obj[h] = (values[i] || "").trim());
      return obj;
    });
  };

  try {
    const services = csvToObjects(await fetchCsv("services"));
    const banners = csvToObjects(await fetchCsv("banners"));
    const faq = csvToObjects(await fetchCsv("faq"));
    const testimonials = csvToObjects(await fetchCsv("testimonials"));

    return new Response(JSON.stringify({ currency: "INR", services, banners, faq, testimonials }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

