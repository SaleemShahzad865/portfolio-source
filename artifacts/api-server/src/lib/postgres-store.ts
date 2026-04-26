import {
  db,
  contactMessagesTable,
  postsTable,
  projectsTable,
  sectionsTable,
  sessionsTable,
} from "@workspace/db";
import { asc, desc, eq, sql } from "drizzle-orm";
import crypto from "node:crypto";
import type {
  AuthUser,
  ContactMessage,
  CreatePostInput,
  CreateProjectInput,
  Post,
  Project,
  Section,
  UpdateContactMessageInput,
  UpdatePostInput,
  UpdateProjectInput,
} from "@workspace/api-zod";

const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;
const demoSeedKey = "__demo_seed_v1";

let demoSeedPromise: Promise<void> | null = null;

async function ensureDemoContentOnce(): Promise<void> {
  if (demoSeedPromise) return demoSeedPromise;

  demoSeedPromise = (async () => {
    // Acquire a distributed "seed lock" using the sections table (key is PK).
    // If another instance already seeded, this insert will conflict and return no rows.
    const [lock] = await db
      .insert(sectionsTable)
      .values({ key: demoSeedKey, value: new Date().toISOString() })
      .onConflictDoNothing({ target: sectionsTable.key })
      .returning();

    if (!lock) return;

    const [{ count: postCountRaw }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(postsTable);
    const postCount = Number(postCountRaw ?? 0);

    if (postCount === 0) {
      await db
        .insert(postsTable)
        .values([
          {
            slug: "demo-getting-started-with-embedded-systems",
            title: "Getting Started with Embedded Systems",
            excerpt:
              "A practical roadmap for building real hardware projects: tools, boards, and the habits that speed up debugging.",
            coverImage: "/images/blog-schematic-pcb.png",
            publishedAt: "2026-04-01",
            readTimeMinutes: 7,
            tags: ["Embedded", "Hardware"],
            content:
              "Embedded systems blend software, electronics, and testing. Start with a simple microcontroller project, learn basic debugging with a serial console, and iterate quickly with small milestones.\n\nKey topics: GPIO, UART, I2C, power integrity, and documenting your experiments.",
            isPublished: true,
          },
          {
            slug: "demo-pcb-design-checklist",
            title: "PCB Design Checklist (Before You Order)",
            excerpt:
              "A quick pre-flight checklist to catch the most common board-killing mistakes before fabrication.",
            coverImage: "/images/blog-pcb-design.png",
            publishedAt: "2026-04-05",
            readTimeMinutes: 6,
            tags: ["PCB", "Checklist"],
            content:
              "Checklist: verify net classes, clearances, footprints, polarity, layer stackup, DRC settings, and test points. Double-check power rails and connector pinouts.\n\nIf you do nothing else: print the schematic and do a manual review.",
            isPublished: true,
          },
          {
            slug: "demo-esp32-iot-basics",
            title: "ESP32 IoT Basics: Wi‑Fi, MQTT, and Reliability",
            excerpt:
              "Moving from a prototype to a reliable device means thinking about reconnects, timeouts, and power loss.",
            coverImage: "/images/blog-esp32-arduino.png",
            publishedAt: "2026-04-10",
            readTimeMinutes: 8,
            tags: ["ESP32", "IoT", "MQTT"],
            content:
              "Reliable IoT is mostly edge cases: Wi‑Fi drops, broker restarts, DNS failures, and brownouts. Add reconnect backoff, watchdogs, and safe state defaults.\n\nAlso: log what matters and keep OTA updates in mind early.",
            isPublished: true,
          },
          {
            slug: "demo-debugging-i2c-like-a-pro",
            title: "Debugging I2C Like a Pro",
            excerpt:
              "Bus scans are not enough. Learn how to interpret waveforms, pull-ups, and common failure modes.",
            coverImage: "/images/blog-debugging-i2c.png",
            publishedAt: "2026-04-15",
            readTimeMinutes: 5,
            tags: ["I2C", "Debugging"],
            content:
              "Start with pull-up values and bus capacitance. Confirm voltage levels. Use a logic analyzer to inspect START/STOP conditions and ACK/NACK.\n\nCommon issues: wrong address, mixed voltage domains, and missing pull-ups.",
            isPublished: true,
          },
          {
            slug: "demo-low-power-design-notes",
            title: "Low Power Design Notes for Battery Devices",
            excerpt:
              "Sleep modes, leakage paths, and measuring current correctly can extend battery life by months.",
            coverImage: "/images/blog-low-power.png",
            publishedAt: "2026-04-20",
            readTimeMinutes: 9,
            tags: ["Low Power", "Battery"],
            content:
              "Measure first: profile active vs sleep current, then remove wake sources and leakage. Choose regulators with low IQ and validate sleep current at temperature.\n\nA small change in firmware duty cycle often beats hardware changes.",
            isPublished: true,
          },
        ])
        .onConflictDoNothing({ target: postsTable.slug });
    }

    const [{ count: projectCountRaw }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectsTable);
    const projectCount = Number(projectCountRaw ?? 0);

    if (projectCount === 0) {
      const categories: Array<Project["category"]> = [
        "pcb",
        "iot",
        "esp32",
        "arm",
        "arduino",
        "simulation",
      ];

      const demoProjects: Array<Omit<Project, "id" | "createdAt" | "updatedAt">> =
        [];

      let sortOrder = 1000;
      let imageIndex = 1;

      for (const category of categories) {
        for (let i = 1; i <= 3; i++) {
          demoProjects.push({
            title: `Demo ${category.toUpperCase()} Project ${i}`,
            description:
              "Demo project entry used to populate the portfolio page. Replace with your real work when ready.",
            details:
              "This is placeholder content to validate UI layout, filtering, and admin CRUD. Update title, description, images, and links with real project details.",
            category,
            image: `/images/project-${imageIndex}.png`,
            tags: [category.toUpperCase(), "Demo"],
            link: `https://example.com/demo/${category}/${i}`,
            sortOrder: sortOrder++,
          });

          imageIndex++;
          if (imageIndex > 6) imageIndex = 1;
        }
      }

      await db.insert(projectsTable).values(demoProjects);
    }
  })();

  return demoSeedPromise;
}

function coercePost(row: typeof postsTable.$inferSelect): Post {
  // Dates become ISO strings over JSON anyway; keep native Date objects here.
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    coverImage: row.coverImage ?? "",
    publishedAt: row.publishedAt ?? "",
    readTimeMinutes: row.readTimeMinutes ?? 5,
    tags: row.tags ?? [],
    content: row.content ?? "",
    isPublished: row.isPublished ?? true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function coerceProject(row: typeof projectsTable.$inferSelect): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    details: row.details ?? "",
    category: (row.category ?? "iot") as Project["category"],
    image: row.image ?? "",
    tags: row.tags ?? [],
    link: row.link ?? "",
    sortOrder: row.sortOrder ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function coerceSection(row: typeof sectionsTable.$inferSelect): Section {
  return {
    key: row.key,
    value: row.value ?? "",
    updatedAt: row.updatedAt,
  };
}

function coerceContactMessage(
  row: typeof contactMessagesTable.$inferSelect,
): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject ?? "",
    message: row.message ?? "",
    isRead: row.isRead ?? false,
    createdAt: row.createdAt,
  };
}

export async function listPosts(): Promise<Post[]> {
  await ensureDemoContentOnce();
  const rows = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.publishedAt), desc(postsTable.id));
  return rows.map(coercePost);
}

export async function getPostById(id: number): Promise<Post | null> {
  const [row] = await db.select().from(postsTable).where(eq(postsTable.id, id));
  return row ? coercePost(row) : null;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const [row] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.slug, slug));
  return row ? coercePost(row) : null;
}

export async function createPost(data: CreatePostInput): Promise<Post> {
  const [row] = await db
    .insert(postsTable)
    .values({
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt ?? "",
      coverImage: data.coverImage ?? "",
      publishedAt: data.publishedAt ?? "",
      readTimeMinutes: data.readTimeMinutes ?? 5,
      tags: data.tags ?? [],
      content: data.content ?? "",
      isPublished: data.isPublished ?? true,
    })
    .returning();

  return coercePost(row);
}

export async function updatePost(
  id: number,
  data: UpdatePostInput,
): Promise<Post | null> {
  const [row] = await db
    .update(postsTable)
    .set({
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
      ...(data.coverImage !== undefined ? { coverImage: data.coverImage } : {}),
      ...(data.publishedAt !== undefined ? { publishedAt: data.publishedAt } : {}),
      ...(data.readTimeMinutes !== undefined
        ? { readTimeMinutes: data.readTimeMinutes }
        : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
    })
    .where(eq(postsTable.id, id))
    .returning();

  return row ? coercePost(row) : null;
}

export async function deletePost(id: number): Promise<Post | null> {
  const [row] = await db
    .delete(postsTable)
    .where(eq(postsTable.id, id))
    .returning();
  return row ? coercePost(row) : null;
}

export async function listProjects(): Promise<Project[]> {
  await ensureDemoContentOnce();
  const rows = await db
    .select()
    .from(projectsTable)
    .orderBy(asc(projectsTable.sortOrder), asc(projectsTable.id));
  return rows.map(coerceProject);
}

export async function getProjectById(id: number): Promise<Project | null> {
  const [row] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, id));
  return row ? coerceProject(row) : null;
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  const [row] = await db
    .insert(projectsTable)
    .values({
      title: data.title,
      description: data.description ?? "",
      details: data.details ?? "",
      category: data.category,
      image: data.image ?? "",
      tags: data.tags ?? [],
      link: data.link ?? "",
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  return coerceProject(row);
}

export async function updateProject(
  id: number,
  data: UpdateProjectInput,
): Promise<Project | null> {
  const [row] = await db
    .update(projectsTable)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.details !== undefined ? { details: data.details } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.link !== undefined ? { link: data.link } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    })
    .where(eq(projectsTable.id, id))
    .returning();

  return row ? coerceProject(row) : null;
}

export async function deleteProject(id: number): Promise<Project | null> {
  const [row] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, id))
    .returning();
  return row ? coerceProject(row) : null;
}

export async function listContactMessages(
  opts?: { unreadOnly?: boolean },
): Promise<ContactMessage[]> {
  const unreadOnly = opts?.unreadOnly === true;
  const query = db
    .select()
    .from(contactMessagesTable)
    .orderBy(desc(contactMessagesTable.createdAt), desc(contactMessagesTable.id));

  const rows = unreadOnly
    ? await query.where(eq(contactMessagesTable.isRead, false))
    : await query;

  return rows.map(coerceContactMessage);
}

export async function getContactMessageById(
  id: number,
): Promise<ContactMessage | null> {
  const [row] = await db
    .select()
    .from(contactMessagesTable)
    .where(eq(contactMessagesTable.id, id));
  return row ? coerceContactMessage(row) : null;
}

export async function createContactMessage(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactMessage> {
  const [row] = await db
    .insert(contactMessagesTable)
    .values({
      name: data.name,
      email: data.email,
      subject: data.subject ?? "",
      message: data.message ?? "",
      isRead: false,
    })
    .returning();
  return coerceContactMessage(row);
}

export async function updateContactMessage(
  id: number,
  data: UpdateContactMessageInput,
): Promise<ContactMessage | null> {
  const [row] = await db
    .update(contactMessagesTable)
    .set({ isRead: data.isRead })
    .where(eq(contactMessagesTable.id, id))
    .returning();

  return row ? coerceContactMessage(row) : null;
}

export async function deleteContactMessage(
  id: number,
): Promise<ContactMessage | null> {
  const [row] = await db
    .delete(contactMessagesTable)
    .where(eq(contactMessagesTable.id, id))
    .returning();
  return row ? coerceContactMessage(row) : null;
}

export async function listSections(): Promise<Section[]> {
  const rows = await db.select().from(sectionsTable);
  return rows.map(coerceSection);
}

export async function getSectionByKey(key: string): Promise<Section | null> {
  const [row] = await db
    .select()
    .from(sectionsTable)
    .where(eq(sectionsTable.key, key));
  return row ? coerceSection(row) : null;
}

export async function upsertSection(key: string, value: string): Promise<Section> {
  const [row] = await db
    .insert(sectionsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: sectionsTable.key,
      set: { value },
    })
    .returning();
  return coerceSection(row);
}

export async function createSession(user: AuthUser): Promise<string> {
  const sid = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({
    sid,
    sess: { user } as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + sessionTtlMs),
  });
  return sid;
}

export async function getSession(
  sid: string,
): Promise<{ sid: string; user: AuthUser } | null> {
  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, sid));

  if (!row) return null;

  if (row.expire.getTime() <= Date.now()) {
    await deleteSession(sid);
    return null;
  }

  const sess = row.sess as unknown as { user?: AuthUser };
  if (!sess.user?.id) return null;

  return { sid: row.sid, user: sess.user };
}

export async function deleteSession(sid: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}
