// Finalise a multipart upload once all parts are uploaded.
// Body: { key, uploadId, parts: [{ partNumber, etag }] }
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { key, uploadId, parts } = body;
  if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
    return json({ error: "key, uploadId and parts required" }, 400);
  }

  const upload = env.PHOTOS.resumeMultipartUpload(key, uploadId);
  const object = await upload.complete(parts);

  return json({ key, size: object.size });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
