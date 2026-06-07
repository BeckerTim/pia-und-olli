export async function onRequestGet(context) {
  const { env, params, request } = context;
  const url = new URL(request.url);

  // GET /api/files — list all files
  if (!params.key || params.key.length === 0) {
    const listed = await env.PHOTOS.list({ limit: 1000 });
    const files = listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    }));
    return new Response(JSON.stringify(files), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // GET /api/files/:key — serve single file
  const key = params.key.join("/");
  const width = parseInt(url.searchParams.get("w") || "", 10);

  // Thumbnail request: shrink + re-encode via Cloudflare Image Transformations.
  // The original is fetched from this same endpoint (without ?w) and resized as
  // it passes back through the edge. If transformations aren't enabled on the
  // zone the original is returned unchanged, so this degrades gracefully.
  if (width > 0) {
    const originUrl = `${url.origin}/api/files/${key}`;
    try {
      const resized = await fetch(originUrl, {
        cf: { image: { width, fit: "scale-down", quality: 70, format: "webp" } },
      });
      if (resized.ok) {
        const headers = new Headers(resized.headers);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        return new Response(resized.body, { headers });
      }
    } catch {
      // fall through to serving the original below
    }
  }

  const object = await env.PHOTOS.get(key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
