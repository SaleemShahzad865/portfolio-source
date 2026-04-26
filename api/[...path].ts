// Vercel's TypeScript build for Serverless Functions is stricter than our app's tsconfig
// and requires declarations for ESM `.mjs` imports. The bundled Express app is runtime-safe.
// @ts-expect-error - bundled ESM module has no `.d.ts` during Vercel build
import app from "../artifacts/api-server/dist/app.mjs";

// Vercel Serverless Function entrypoint.
// This file intentionally exports a default handler (req, res) compatible with Express.
export default function handler(req: any, res: any) {
  const url = typeof req.url === "string" ? req.url : "";
  const expressApp = app as any;

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

  return expressApp(req, res);
}
