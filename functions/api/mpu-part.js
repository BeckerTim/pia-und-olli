// Upload a single part of a multipart upload through the worker.
// Query params: key, uploadId, partNumber. Body is the raw chunk.
export async function onRequestPut(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const key = url.searchParams.get("key");
  const uploadId = url.searchParams.get("uploadId");
  const partNumber = parseInt(url.searchParams.get("partNumber"), 10);

  if (!key || !uploadId || !partNumber) {
    return json({ error: "key, uploadId and partNumber required" }, 400);
  }

  const upload = env.PHOTOS.resumeMultipartUpload(key, uploadId);
  const buf = await request.arrayBuffer();
  const part = await upload.uploadPart(partNumber, buf);

  return json({ partNumber: part.partNumber, etag: part.etag });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
