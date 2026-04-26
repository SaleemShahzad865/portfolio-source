import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
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
