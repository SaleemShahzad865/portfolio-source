import path from "node:path";
import { fileURLToPath } from "node:url";

function computeApiServerRoot(): string {
  if (process.env.VERCEL) {
    // In Vercel Serverless Functions, files are read-only except /tmp.
    // Treat the function bundle root as the server root.
    return process.cwd();
  }

  const here = path.dirname(fileURLToPath(import.meta.url));

  // When running from source (rare in this repo), this file lives at:
  //   artifacts/api-server/src/lib/runtimePaths.ts
  // so api-server root is two levels up from `src/lib`.
  if (
    path.basename(here) === "lib" &&
    path.basename(path.dirname(here)) === "src"
  ) {
    return path.resolve(here, "..", "..");
  }

  // When running the bundled build, `import.meta.url` points at:
  //   artifacts/api-server/dist/index.mjs
  // so api-server root is one level up from `dist`.
  if (path.basename(here) === "dist") {
    return path.resolve(here, "..");
  }

  // Fallback: best-effort.
  return path.resolve(here, "..");
}

export const apiServerRoot = computeApiServerRoot();

export const uploadsDir = process.env.VERCEL
  ? path.join("/tmp", "portfolio", "uploads")
  : path.join(apiServerRoot, "public", "uploads");

export const dataDir = process.env.VERCEL
  ? path.join("/tmp", "portfolio", "data")
  : path.join(apiServerRoot, "data");

export const legacyUploadsDir = path.resolve(
  apiServerRoot,
  "..",
  "portfolio",
  "public",
  "uploads",
);

export const legacyDataFile = path.resolve(
  apiServerRoot,
  "..",
  "data",
  "local-db.json",
);

export const frontendDistDir = path.resolve(
  process.env.VERCEL ? apiServerRoot : apiServerRoot,
  process.env.VERCEL ? "artifacts/portfolio/dist/public" : "../portfolio/dist/public",
);
