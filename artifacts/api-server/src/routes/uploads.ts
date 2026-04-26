import { Router, type IRouter } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import { copyFile, readdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { imageSize } from "image-size";
import { legacyUploadsDir, uploadsDir } from "../lib/runtimePaths";

const router: IRouter = Router();

const mimeExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

function parseDataUrl(value: string): { mime: string; buffer: Buffer } | null {
  // Supports:
  // - data:application/pdf;base64,...
  // - data:application/pdf;name=file.pdf;base64,...
  // - data:image/png;charset=utf-8;base64,...
  // - data:;base64,... (some clients omit mime)
  const match = value.match(/^data:([^;,]*)(?:;[^,]*)*;base64,(.+)$/);
  if (!match) return null;
  return {
    mime: match[1] || "application/octet-stream",
    buffer: Buffer.from(match[2], "base64"),
  };
}

type UploadPurpose = "post_cover" | "project_image" | "generic";

const uploadSpecs: Record<Exclude<UploadPurpose, "generic">, {
  label: string;
  aspect: number;
  minWidth: number;
  minHeight: number;
  examples: string;
}> = {
  post_cover: {
    label: "Post cover",
    aspect: 16 / 9,
    minWidth: 1200,
    minHeight: 675,
    examples: "1600x900 or 1920x1080",
  },
  project_image: {
    label: "Project image",
    aspect: 16 / 10,
    minWidth: 1200,
    minHeight: 750,
    examples: "1600x1000 or 1920x1200",
  },
};

const maxBytes = 6 * 1024 * 1024;
const aspectTolerance = 0.02; // +/- 2%

let didMigrateLegacyUploads = false;

async function migrateLegacyUploads(
  legacyDir: string,
  targetDir: string,
): Promise<void> {
  if (didMigrateLegacyUploads) return;
  didMigrateLegacyUploads = true;

  try {
    const entries = await readdir(legacyDir, { withFileTypes: true });
    if (entries.length === 0) return;

    await mkdir(targetDir, { recursive: true });

    await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map((entry) =>
          copyFile(
            path.join(legacyDir, entry.name),
            path.join(targetDir, entry.name),
          ).catch(() => undefined),
        ),
    );
  } catch {
    // Best-effort migration only.
  }
}

router.post("/uploads", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const purpose: UploadPurpose =
    req.body?.purpose === "post_cover" || req.body?.purpose === "project_image"
      ? req.body.purpose
      : "generic";

  const filename =
    typeof req.body?.filename === "string" ? req.body.filename : "upload";
  const dataUrl =
    typeof req.body?.dataUrl === "string" ? req.body.dataUrl : "";

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    res.status(400).json({ error: "Unsupported upload payload" });
    return;
  }

  if (parsed.buffer.length > maxBytes) {
    res.status(413).json({ error: "Image is too large (max 6MB)" });
    return;
  }

  let extension = mimeExtensions[parsed.mime];

  // Some PDFs arrive as `application/octet-stream` depending on the client/OS.
  // If the filename indicates a PDF, accept it.
  const originalExt = path.extname(filename).toLowerCase();
  if (!extension && parsed.mime === "application/octet-stream" && originalExt === ".pdf") {
    extension = ".pdf";
  }

  if (!extension) {
    res.status(400).json({ error: "Unsupported upload type" });
    return;
  }

  const isImage = parsed.mime.startsWith("image/");

  if (purpose !== "generic" && isImage) {
    const spec = uploadSpecs[purpose];

    let width = 0;
    let height = 0;
    try {
      const size = imageSize(parsed.buffer);
      width = size.width ?? 0;
      height = size.height ?? 0;
    } catch {
      // fallthrough
    }

    if (!width || !height) {
      res.status(400).json({ error: "Unable to read image dimensions" });
      return;
    }

    if (width < spec.minWidth || height < spec.minHeight) {
      res.status(400).json({
        error: `${spec.label} must be at least ${spec.minWidth}x${spec.minHeight} (recommended: ${spec.examples})`,
      });
      return;
    }

    const aspect = width / height;
    const minAspect = spec.aspect * (1 - aspectTolerance);
    const maxAspect = spec.aspect * (1 + aspectTolerance);
    if (aspect < minAspect || aspect > maxAspect) {
      res.status(400).json({
        error: `${spec.label} must be ${Math.round(spec.aspect * 100) / 100}:1 aspect ratio (recommended: ${spec.examples})`,
      });
      return;
    }
  }

  const safeBase = path
    .basename(filename, path.extname(filename))
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "image";

  await migrateLegacyUploads(legacyUploadsDir, uploadsDir);

  await mkdir(uploadsDir, { recursive: true });

  const uniqueName = `${Date.now()}-${safeBase}-${crypto
    .randomBytes(4)
    .toString("hex")}${extension}`;

  await writeFile(path.join(uploadsDir, uniqueName), parsed.buffer);

  res.status(201).json({ url: `/uploads/${uniqueName}` });
});

export default router;
