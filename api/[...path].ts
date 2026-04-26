// Vercel's TypeScript build for Serverless Functions is stricter than our app's tsconfig
// and requires declarations for ESM `.mjs` imports. The bundled Express app is runtime-safe.
//
// Important: depending on how Vercel transpiles this file, a static `import` may be
// converted into a CommonJS `require()`, which can fail for ESM-only `.mjs` bundles.
// Using `import()` at runtime works in both CJS and ESM function outputs.
let cachedExpressApp: any | null = null;

async function getExpressApp() {
  if (cachedExpressApp) return cachedExpressApp;

  // @ts-expect-error - bundled ESM module has no `.d.ts` during Vercel build
  const mod = await import("../artifacts/api-server/dist/app.mjs");
  cachedExpressApp = (mod as any).default ?? mod;
  return cachedExpressApp;
}

// Vercel Serverless Function entrypoint.
// This file intentionally exports a default handler (req, res) compatible with Express.
export default async function handler(req: any, res: any) {
  const url = typeof req.url === "string" ? req.url : "";
  let expressApp: any;

  try {
    expressApp = await getExpressApp();
  } catch (err) {
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

  // If we reached this handler via a rewrite for `/uploads/*`, convert the internal
  // Vercel path into the actual Express static mount.
  if (url.startsWith("/api/uploads-static/")) {
    req.url = url.replace("/api/uploads-static", "/uploads");
    return expressApp(req, res);
  }

  // Some runtimes forward `/api/*` as `/*` to the function. Normalize to keep our
  // existing Express mounting at `/api` working.
  if (url && !url.startsWith("/api/") && url !== "/api") {
    req.url = `/api${url.startsWith("/") ? "" : "/"}${url}`;
  }

  // Defensive: avoid double-prefixes if a platform already included `/api` in `req.url`
  // but routed into this function under `/api/*` again.
  if (typeof req.url === "string" && req.url.startsWith("/api/api/")) {
    req.url = req.url.replace("/api/api/", "/api/");
  }

  return expressApp(req, res);
}
