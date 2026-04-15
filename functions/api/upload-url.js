import { AwsClient } from "./_aws4fetch.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { filename, contentType } = body;
  if (!filename || !contentType) {
    return new Response(
      JSON.stringify({ error: "filename and contentType required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const r2 = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });

  const bucketUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/pia-olli/${key}`;
  const url = new URL(bucketUrl);
  url.searchParams.set("X-Amz-Expires", "3600");

  const signed = await r2.sign(
    new Request(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
    }),
    { aws: { signQuery: true } }
  );

  return new Response(
    JSON.stringify({ url: signed.url, key }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
