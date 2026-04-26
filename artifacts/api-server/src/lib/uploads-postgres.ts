import crypto from "node:crypto";
import path from "node:path";
import { db, uploadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

function safeBaseFromFilename(filename: string): string {
  return (
    path
      .basename(filename, path.extname(filename))
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "file"
  );
}

export async function saveUploadToPostgres(opts: {
  filename: string;
  mime: string;
  buffer: Buffer;
}): Promise<{ key: string; url: string }> {
  const ext = path.extname(opts.filename).toLowerCase();
  const safeBase = safeBaseFromFilename(opts.filename);
  const uniqueName = `${Date.now()}-${safeBase}-${crypto.randomBytes(4).toString("hex")}${ext || ""}`;

  await db.insert(uploadsTable).values({
    key: uniqueName,
    mime: opts.mime,
    base64: opts.buffer.toString("base64"),
  });

  return { key: uniqueName, url: `/uploads/${uniqueName}` };
}

export async function getUploadByKey(key: string): Promise<{
  key: string;
  mime: string;
  bytes: Buffer;
  createdAt: Date;
} | null> {
  const [row] = await db.select().from(uploadsTable).where(eq(uploadsTable.key, key));
  if (!row) return null;
  return {
    key: row.key,
    mime: row.mime,
    bytes: Buffer.from(row.base64, "base64"),
    createdAt: row.createdAt,
  };
}
