export async function onRequestGet(context) {
  const { env, params } = context;

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
