export async function onRequestPost({ request, env }) {
  try {
    const token = request.headers.get("x-admin-token");
    if (!token || token !== env.ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" }
      });
    }

    const form = await request.formData();
    const file = form.get("file");
    const variant = form.get("variant"); // "desktop" | "mobile"

    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    if (!["desktop", "mobile"].includes(variant)) {
      return new Response(JSON.stringify({ error: "Invalid variant" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    // Fixed filenames so frontend never changes
    const key = variant === "desktop"
      ? "banners/hero-desktop.jpg"
      : "banners/hero-mobile.jpg";

    const contentType = file.type || "image/jpeg";
    const arrayBuffer = await file.arrayBuffer();

    await env.APK_R2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000"
      }
    });

    const base = env.CDN_BASE_URL; // e.g. https://cdn.apkajyotish.com
    const url = `${base}/${key}`;

    return new Response(JSON.stringify({ success: true, key, url }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Upload failed" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
}
