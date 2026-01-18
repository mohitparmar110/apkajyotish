// functions/api/admin/upload-banner.js

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

export async function onRequestOptions() {
  return json({ ok: true }, 200);
}

export async function onRequestPost({ request, env }) {
  try {
    const token = request.headers.get("x-admin-token");
    if (!token || token !== env.ADMIN_TOKEN) {
      return json({ error: "Unauthorized" }, 401);
    }

    const form = await request.formData();
    const file = form.get("file");
    const variant = form.get("variant"); // "desktop" | "mobile"

    if (!file || typeof file === "string") {
      return json({ error: "Missing file" }, 400);
    }

    if (!["desktop", "mobile"].includes(variant)) {
      return json({ error: "Invalid variant" }, 400);
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

    // Prefer CDN_BASE_URL (your custom domain/CDN), else fallback if provided
    const base =
      env.CDN_BASE_URL ||
      env.R2_PUBLIC_BASE_URL || // optional: set this if you want
      "";

    if (!base) {
      // If you forget to set base URLs, we still return the key
      return json({ success: true, key, url: "" }, 200);
    }

    const url = `${base.replace(/\/+$/,"")}/${key}`;

    return json({ success: true, key, url }, 200);
  } catch (e) {
    return json({ error: e.message || "Upload failed" }, 500);
  }
}
