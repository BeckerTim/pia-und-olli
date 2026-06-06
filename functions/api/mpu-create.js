// Start a multipart upload directly against the R2 binding.
// Returns the object key and an uploadId the client uses for the parts.
export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { filename, contentType } = body;
  if (!filename || !contentType) {
    return json({ error: "filename and contentType required" }, 400);
  }

  const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const upload = await env.PHOTOS.createMultipartUpload(key, {
    httpMetadata: { contentType },
  });

  return json({ key, uploadId: upload.uploadId });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
