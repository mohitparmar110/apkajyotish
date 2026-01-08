export async function onRequestGet(context) {
  const 1xaxPN93fX8nH2igr_7YFFtspyBhxRycCLTw_C7zwWe0 = context.env.1xaxPN93fX8nH2igr_7YFFtspyBhxRycCLTw_C7zwWe0;

  const fetchCsv = async (sheet) => {
    const url = `https://docs.google.com/spreadsheets/d/1xaxPN93fX8nH2igr_7YFFtspyBhxRycCLTw_C7zwWe0/gviz/tq?tqx=out:csv&sheet=services`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${sheet}`);
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

    return new Response(JSON.stringify({
      currency: "INR",
      services,
      banners,
      faq,
      testimonials
    }), {
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=60"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
