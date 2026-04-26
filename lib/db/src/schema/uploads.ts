import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const uploadsTable = pgTable("uploads", {
  key: text("key").primaryKey(),
  mime: text("mime").notNull(),
  base64: text("base64").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Upload = typeof uploadsTable.$inferSelect;
export type InsertUpload = typeof uploadsTable.$inferInsert;
