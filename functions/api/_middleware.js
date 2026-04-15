const PASSWORD = "liebe";

export async function onRequest(context) {
  const { request } = context;

  // Allow GET requests to /api/files/* without auth (needed for <img src="...">)
  const url = new URL(request.url);
  if (request.method === "GET" && url.pathname.startsWith("/api/files/")) {
    return context.next();
  }

  const auth = request.headers.get("X-Auth");
  if (!auth || auth.toLowerCase() !== PASSWORD) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return context.next();
}
