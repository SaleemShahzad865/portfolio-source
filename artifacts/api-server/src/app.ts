import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import type { NextFunction, Request, Response } from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { frontendDistDir, uploadsDir } from "./lib/runtimePaths";

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

// Persistent uploads in Postgres (Neon): serve from DB when DATABASE_URL is set.
// Falls back to the local uploads dir for local dev / non-DB runs.
app.get("/uploads/:key", async (req: Request, res: Response, next: NextFunction) => {
  if (!process.env.DATABASE_URL) return next();
  const key = typeof req.params.key === "string" ? req.params.key : "";
  if (!key) return next();

  try {
    const { getUploadByKey } = await import("./lib/uploads-postgres");
    const upload = await getUploadByKey(key);
    if (!upload) return next();

    res.setHeader("Content-Type", upload.mime);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.status(200).send(upload.bytes);
  } catch (err) {
    logger.error({ err }, "Failed to serve upload");
    next();
  }
});

// Serve uploaded assets from the API so production can run on a single host.
app.use(
  "/uploads",
  express.static(uploadsDir, {
    fallthrough: true,
  }),
);

app.use("/api", router);

// Optional: serve the built frontend (Vite) from the same server in production.
const frontendDir = frontendDistDir;
const frontendIndex = path.join(frontendDir, "index.html");
if (existsSync(frontendIndex)) {
  app.use(express.static(frontendDir));
  // Express 5 / path-to-regexp rejects "*" and also rejects string wildcards like "/*".
  // A regex route works reliably for SPA fallback.
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(frontendIndex);
  });
}

export default app;
