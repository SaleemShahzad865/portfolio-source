import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const sectionsTable = pgTable("site_sections", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Section = typeof sectionsTable.$inferSelect;
export type InsertSection = typeof sectionsTable.$inferInsert;
