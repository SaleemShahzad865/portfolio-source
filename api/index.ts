// Vercel Node Serverless Function entrypoint for the Express API.
//
// Why this exists:
// On some Vercel static builds, dynamic function routes like `api/[...path].ts`
// behave like a single-segment matcher (e.g. `/api/posts`) and do not receive
// nested paths (e.g. `/api/posts/1`). We route all `/api/*` traffic to this
// single endpoint via `vercel.json` rewrites and reconstruct the intended
// Express path from the `path` query parameter.

import { URL } from "node:url";

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
  const parsed = new URL(rawUrl, "http://localhost");

  const rewrittenPath = parsed.searchParams.get("path") ?? "";
  parsed.searchParams.delete("path");

  const cleanedPath = rewrittenPath
    .split("/")
    .filter(Boolean)
    .join("/");

  const search = parsed.searchParams.toString();
  const suffix = search ? `?${search}` : "";

  req.url = cleanedPath ? `/api/${cleanedPath}${suffix}` : `/api${suffix}`;

  // If we reached this handler via a rewrite for `/uploads/*`, convert the internal
  // Vercel path into the actual Express static mount.
  if (typeof req.url === "string" && req.url.startsWith("/api/uploads-static/")) {
    req.url = req.url.replace("/api/uploads-static", "/uploads");
  }

  return expressApp(req, res);
}
