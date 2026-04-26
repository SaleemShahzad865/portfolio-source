// Vercel Node Serverless Function entrypoint for the Express API.
//
// Why this exists:
// On some Vercel static builds, dynamic function routes like `api/[...path].ts`
// behave like a single-segment matcher (e.g. `/api/posts`) and do not receive
// nested paths (e.g. `/api/posts/1`). We route all `/api/*` traffic to this
// single endpoint via `vercel.json` rewrites and reconstruct the intended
// Express path from the `path` query parameter.

let cachedExpressApp: any | null = null;

async function getExpressApp() {
  if (cachedExpressApp) return cachedExpressApp;
  // @ts-expect-error - bundled ESM module has no `.d.ts` during Vercel build
  const mod = await import("../artifacts/api-server/dist/app.mjs");
  cachedExpressApp = (mod as any).default ?? mod;
  return cachedExpressApp;
}

export default async function handler(req: any, res: any) {
  let expressApp: any;

  try {
    expressApp = await getExpressApp();
  } catch (_err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error:
          "Failed to load API server bundle. Ensure `artifacts/api-server` builds during Vercel deploy.",
      }),
    );
    return;
  }

  const rawUrl = typeof req.url === "string" ? req.url : "";
  const queryIndex = rawUrl.indexOf("?");
  const rawQuery = queryIndex >= 0 ? rawUrl.slice(queryIndex + 1) : "";

  const queryParts = rawQuery ? rawQuery.split("&") : [];
  const queryPairs: Array<[string, string]> = [];
  let rewrittenPath = "";

  for (const part of queryParts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const rawKey = eq >= 0 ? part.slice(0, eq) : part;
    const rawValue = eq >= 0 ? part.slice(eq + 1) : "";

    const key = decodeURIComponent(rawKey.replace(/\+/g, " "));
    const value = decodeURIComponent(rawValue.replace(/\+/g, " "));

    if (key === "path") {
      rewrittenPath = value;
      continue;
    }

    queryPairs.push([key, value]);
  }

  const cleanedPath = rewrittenPath
    .split("/")
    .filter(Boolean)
    .join("/");

  const suffix = queryPairs.length
    ? `?${queryPairs
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&")}`
    : "";

  req.url = cleanedPath ? `/api/${cleanedPath}${suffix}` : `/api${suffix}`;

  // If we reached this handler via a rewrite for `/uploads/*`, convert the internal
  // Vercel path into the actual Express static mount.
  if (typeof req.url === "string" && req.url.startsWith("/api/uploads-static/")) {
    req.url = req.url.replace("/api/uploads-static", "/uploads");
  }

  return expressApp(req, res);
}
