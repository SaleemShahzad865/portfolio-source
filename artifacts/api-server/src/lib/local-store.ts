import { mkdir, readFile, writeFile } from "node:fs/promises";
import { copyFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { dataDir, legacyDataFile as legacyDataFilePath } from "./runtimePaths";
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

interface LocalSession {
  sid: string;
  user: AuthUser;
  expiresAt: string;
}

interface LocalDatabase {
  posts: Post[];
  projects: Project[];
  sections: Section[];
  contactMessages: ContactMessage[];
  sessions: LocalSession[];
}

const dataFile = path.resolve(dataDir, "local-db.json");
const legacyDataFile = legacyDataFilePath;
const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;

let queue = Promise.resolve();

function nowDate(): Date {
  return new Date();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function inferProjectCategory(tags: string[], title: string): Project["category"] {
  const haystack = `${title} ${tags.join(" ")}`.toLowerCase();
  if (haystack.includes("pcb") || haystack.includes("altium") || haystack.includes("kicad")) return "pcb";
  if (haystack.includes("arduino")) return "arduino";
  if (haystack.includes("esp32") || haystack.includes("esp-")) return "esp32";
  if (/\b(arm|cortex|stm32|rp2040|nrf(5\d|52|53|91)|samd\d+|atsam|imx)\b/.test(haystack) || /\bpico\b/.test(haystack)) return "arm";
  if (haystack.includes("sim") || haystack.includes("simulation") || haystack.includes("matlab") || haystack.includes("simulink")) return "simulation";
  if (haystack.includes("iot") || haystack.includes("mqtt") || haystack.includes("cloud")) return "iot";
  return "iot";
}

function createSeedDatabase(): LocalDatabase {
  const now = nowDate();

  const posts: Post[] = [
    {
      id: 1,
      slug: "designing-first-4-layer-pcb",
      title: "Designing Your First 4-Layer PCB",
      excerpt:
        "Moving from 2 to 4 layers unlocks better signal integrity, power delivery, and compactness. Here's a step-by-step guide to making the jump.",
      coverImage: "/images/blog-pcb-design.png",
      publishedAt: "2024-05-12",
      readTimeMinutes: 8,
      tags: ["PCB Design", "Hardware", "Altium"],
      isPublished: true,
      content: `Moving from 2 to 4 layers is a significant milestone for any hardware engineer. The transition not only allows you to build more compact boards but radically improves your electromagnetic compatibility (EMC) and signal integrity (SI).

### Why 4 Layers?

In a standard 2-layer board, routing power and ground can be a nightmare. You often end up with a Swiss-cheese ground plane, which creates huge return current loops. These loops radiate noise and make your board susceptible to external interference.

With 4 layers, you can dedicate entire internal layers to solid power and ground planes.

### The Stackup

The most common 4-layer stackup is:
1. **Top Layer:** Signal / High-speed routing
2. **Inner Layer 1:** Solid Ground (GND) Plane
3. **Inner Layer 2:** Power (VCC) Plane / Split Power Planes
4. **Bottom Layer:** Signal / Low-speed routing

By placing the GND plane immediately adjacent to the top signal layer, every high-speed trace on the top has a perfectly defined, uninterrupted return path directly underneath it.

### Best Practices

- **Keep the GND plane solid.** Do not route signals on the ground plane.
- **Stitch your planes.** Use vias to connect ground pours on the top and bottom layers to the internal ground plane.
- **Decoupling capacitors.** Place them as close as possible to the IC pins, and drop their ground connections directly to the internal plane with a via.

Designing 4-layer boards might seem daunting due to the increased manufacturing cost, but the benefits in reliability and performance are well worth it for any serious project.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      slug: "esp32-vs-arduino-choosing-right-board",
      title: "ESP32 vs Arduino: Choosing the Right Board",
      excerpt:
        "The Arduino Uno is a classic, but the ESP32 is a powerhouse. When should you use which for your next IoT project?",
      coverImage: "/images/blog-esp32-arduino.png",
      publishedAt: "2024-04-28",
      readTimeMinutes: 6,
      tags: ["ESP32", "Arduino", "IoT"],
      isPublished: true,
      content: `The microcontroller landscape has exploded in recent years, but two names constantly come up in the maker and prototyping communities: Arduino and the ESP32.

### The Arduino Uno: The Old Reliable

**Pros:**
- **5V Logic:** Interfaces easily with a massive legacy ecosystem of sensors, relays, and logic chips without needing level shifters.
- **Simplicity:** No RTOS, no complex clock trees. It runs your loop() and nothing else.
- **Robustness:** The ATmega chips are incredibly tough.

**Cons:**
- **Slow:** 16 MHz.
- **No Connectivity:** No built-in Wi-Fi or Bluetooth.
- **Memory:** 2KB of SRAM is stifling for modern applications.

### The ESP32: The Modern Powerhouse

**Pros:**
- **Speed & Power:** Dual-core 240 MHz processor.
- **Connectivity:** Built-in Wi-Fi and Bluetooth.
- **Memory:** 520KB SRAM, plus often MBs of external flash.
- **Peripherals:** Multiple UART/SPI/I2C buses and plenty of extras.

### The Verdict

If you are building a simple mechanical controller, the Arduino is still a great, robust choice.

If your device needs to talk to the internet, process audio, serve a webpage, or do heavy math, the ESP32 is the stronger option.`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 3,
      slug: "low-power-tricks-battery-iot",
      title: "Low-Power Tricks for Battery-Powered IoT",
      excerpt:
        "Squeezing months or years out of a single battery requires rethinking both your hardware design and firmware architecture.",
      coverImage: "/images/blog-low-power.png",
      publishedAt: "2024-03-15",
      readTimeMinutes: 10,
      tags: ["Power Design", "Firmware", "IoT"],
      isPublished: true,
      content: `Building an IoT device that plugs into the wall is easy. Building one that runs for two years on a coin cell or a small LiPo requires absolute paranoia about every microamp.

### Hardware Tricks

1. **Kill the Quiescent Current (Iq):** Every voltage regulator consumes power just by existing.
2. **Load Switches:** Don't just put sensors to sleep; physically cut their power.
3. **Pull-up/Pull-down Resistors:** Use higher values when speed isn't an issue.

### Firmware Tricks

1. **Sleep 99.9% of the Time:** Your MCU should be in its deepest sleep state almost constantly.
2. **Race to Sleep:** Run your MCU clock faster so you finish calculations and return to deep sleep sooner.
3. **Smart Radio Usage:** Batch your data instead of transmitting on every sample.`,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const projects: Project[] = [
    {
      id: 1,
      title: "High-Speed Data Acquisition PCB",
      description:
        "Custom 6-layer PCB design for industrial data logging. Features an STM32H7, precise analog front-end, and gigabit ethernet PHY.",
      details: `### System Overview

This project focused on stable high-speed capture in a compact industrial form factor.

- 6-layer stackup for cleaner return paths
- STM32H7 processing pipeline
- Ethernet uplink for remote collection
- Careful analog partitioning around the front-end

The full design balanced signal integrity, thermal behavior, and serviceability.`,
      image: "/images/project-1.png",
      category: "pcb",
      tags: ["Altium", "STM32", "High-Speed Routing", "Analog Design"],
      link: "https://github.com/saleemshahzad",
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      title: "ESP32 Distributed Weather Station",
      description:
        "A network of solar-powered environmental nodes communicating via ESP-NOW. Central hub pushes aggregated data to the cloud.",
      details: `### Field Deployment

This system was designed around low-power outdoor telemetry.

- Solar-friendly duty cycle
- Distributed sensing nodes
- Resilient short-range wireless transport
- Central aggregation and reporting

The main challenge was balancing sampling frequency with power budget and weather exposure.`,
      image: "/images/project-2.png",
      category: "esp32",
      tags: ["ESP32", "ESP-NOW", "FreeRTOS", "Solar Power"],
      link: "https://github.com/saleemshahzad",
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 3,
      title: "Smart Home Automation Hub",
      description:
        "Arduino Mega based centralized home automation controller with custom relay shield, supporting MQTT and physical fallback switches.",
      details: `### Control Approach

The hub keeps automations practical even when the network is unreliable.

- Hardware relay control
- MQTT integration
- Manual fallback switching
- Modular expansion approach for new zones

The design goal was a system that still felt dependable for daily use.`,
      image: "/images/project-3.png",
      category: "arduino",
      tags: ["Arduino C++", "MQTT", "Relay Control", "Home Assistant"],
      link: "https://github.com/saleemshahzad",
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const sections: Section[] = [
    { key: "home_name", value: "Saleem Shahzad", updatedAt: now },
    {
      key: "home_role",
      value: "Electrical Engineer - Embedded Systems",
      updatedAt: now,
    },
    {
      key: "home_tagline",
      value:
        "I design circuits, lay out PCBs, and write firmware that brings hardware to life. Specializing in Arduino, ESP32, and production-ready embedded systems.",
      updatedAt: now,
    },
    {
      key: "home_hero_image",
      value: "/images/headshot.png",
      updatedAt: now,
    },
    {
      key: "home_ticker",
      value: JSON.stringify(
        [
          "Altium Designer",
          "KiCad",
          "STM32",
          "ESP32",
          "FreeRTOS",
          "C/C++",
          "Zephyr",
          "LoRaWAN",
          "BLE",
          "I2C/SPI",
        ],
        null,
        2,
      ),
      updatedAt: now,
    },
    {
      key: "home_clients_ticker",
      value: JSON.stringify(
        [
          { name: "Client A", url: "https://example.com", logo: "/images/headshot.png" },
          { name: "Client B", url: "https://example.com", logo: "/images/headshot.png" },
        ],
        null,
        2,
      ),
      updatedAt: now,
    },
    {
      key: "home_testimonials",
      value: JSON.stringify(
        [
          {
            image: "/images/headshot.png",
            name: "Client Name",
            designation: "Founder",
            company: "Company",
            message:
              "Saleem delivered on time with excellent communication and strong attention to detail. The PCB and firmware behaved exactly as expected in the field.",
          },
        ],
        null,
        2,
      ),
      updatedAt: now,
    },
    {
      key: "about_intro",
      value:
        "I am an electrical engineer focused on the place where hardware and software meet. I enjoy building systems that behave well in the real world, not just on paper.",
      updatedAt: now,
    },
    {
      key: "about_philosophy",
      value:
        "Embedded systems engineering is about constraints: power, timing, memory, and reliability. I approach every project with a system-level mindset so the board layout, firmware behavior, and product goals all support each other.",
      updatedAt: now,
    },
    {
      key: "about_timeline",
      value: JSON.stringify(
        [
          {
            role: "Senior Embedded Engineer",
            period: "2022 - Present",
            desc: "Leading firmware development and hardware design for next-generation industrial IoT devices. Architected scalable ESP32-based sensor networks.",
            active: true,
          },
          {
            role: "Hardware Design Engineer",
            period: "2019 - 2022",
            desc: "Designed complex multi-layer PCBs for consumer electronics. Extensive use of Altium Designer and rigorous EMI/EMC compliance testing.",
            active: false,
          },
          {
            role: "B.S. Electrical Engineering",
            period: "2015 - 2019",
            desc: "Specialized in control systems and microelectronics. Graduated with Honors. Capstone project: Autonomous Hexapod Robot.",
            active: false,
          },
        ],
        null,
        2,
      ),
      updatedAt: now,
    },
    {
      key: "contact_email",
      value: "saleemwork123@gmail.com",
      updatedAt: now,
    },
    {
      key: "contact_location",
      value: "Pakistan",
      updatedAt: now,
    },
    {
      key: "contact_github",
      value: "https://github.com/saleemshahzad",
      updatedAt: now,
    },
    {
      key: "contact_linkedin",
      value: "https://linkedin.com/in/saleemshahzad",
      updatedAt: now,
    },
    {
      key: "connect_accounts",
      value: JSON.stringify(
        [
          { name: "GitHub", url: "https://github.com/saleemshahzad" },
          { name: "LinkedIn", url: "https://linkedin.com/in/saleemshahzad" },
          { name: "Email", url: "mailto:saleemwork123@gmail.com" },
        ],
        null,
        2,
      ),
      updatedAt: now,
    },
  ];

  return { posts, projects, sections, contactMessages: [], sessions: [] };
}

function normalizeDatabase(db: LocalDatabase): LocalDatabase {
  return {
    ...db,
    posts: (db.posts ?? []).map((post) => ({
      ...post,
      excerpt: post.excerpt ?? "",
      coverImage: post.coverImage ?? "",
      tags: post.tags ?? [],
      content: post.content ?? "",
      isPublished: post.isPublished ?? true,
      createdAt: post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt),
      updatedAt: post.updatedAt instanceof Date ? post.updatedAt : new Date(post.updatedAt),
    })),
    projects: (db.projects ?? []).map((project) => ({
      ...project,
      description: project.description ?? "",
      details: project.details ?? project.description ?? "",
      image: project.image ?? "",
      tags: project.tags ?? [],
      link: project.link ?? "",
      sortOrder: project.sortOrder ?? 0,
      createdAt:
        project.createdAt instanceof Date ? project.createdAt : new Date(project.createdAt),
      updatedAt:
        project.updatedAt instanceof Date ? project.updatedAt : new Date(project.updatedAt),
      category:
        project.category ?? inferProjectCategory(project.tags ?? [], project.title ?? ""),
    })),
    sections: (db.sections ?? []).map((section) => ({
      ...section,
      value: section.value ?? "",
      updatedAt:
        section.updatedAt instanceof Date ? section.updatedAt : new Date(section.updatedAt),
    })),
    contactMessages: (db.contactMessages ?? []).map((message) => ({
      ...message,
      subject: message.subject ?? "",
      message: message.message ?? "",
      isRead: message.isRead ?? false,
      createdAt:
        message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt),
    })),
    sessions: db.sessions ?? [],
  };
}

async function ensureDatabase(): Promise<void> {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    // Migrate legacy location if present.
    try {
      await copyFile(legacyDataFile, dataFile);
      return;
    } catch {
      // ignore
    }
    await writeFile(dataFile, JSON.stringify(createSeedDatabase(), null, 2));
  }
}

async function readDatabase(): Promise<LocalDatabase> {
  await ensureDatabase();
  const raw = await readFile(dataFile, "utf8");
  return normalizeDatabase(JSON.parse(raw) as LocalDatabase);
}

async function writeDatabase(db: LocalDatabase): Promise<void> {
  await writeFile(dataFile, JSON.stringify(db, null, 2));
}

async function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function nextId(items: Array<{ id: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
  );
}

function sortContactMessages(messages: ContactMessage[]): ContactMessage[] {
  return [...messages].sort(
    (a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime() || b.id - a.id,
  );
}

export async function listPosts(): Promise<Post[]> {
  return runExclusive(async () => sortPosts(clone((await readDatabase()).posts)));
}

export async function getPostById(id: number): Promise<Post | null> {
  return runExclusive(async () => {
    const item = (await readDatabase()).posts.find((post) => post.id === id);
    return item ? clone(item) : null;
  });
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return runExclusive(async () => {
    const item = (await readDatabase()).posts.find((post) => post.slug === slug);
    return item ? clone(item) : null;
  });
}

export async function createPost(data: CreatePostInput): Promise<Post> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const timestamp = nowDate();
    const item: Post = {
      id: nextId(db.posts),
      ...data,
      excerpt: data.excerpt ?? "",
      coverImage: data.coverImage ?? "",
      publishedAt: data.publishedAt ?? "",
      readTimeMinutes: data.readTimeMinutes ?? 5,
      tags: data.tags ?? [],
      content: data.content ?? "",
      isPublished: data.isPublished ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.posts.push(item);
    await writeDatabase(db);
    return clone(item);
  });
}

export async function updatePost(
  id: number,
  data: UpdatePostInput,
): Promise<Post | null> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const index = db.posts.findIndex((post) => post.id === id);
    if (index === -1) return null;
    const current = db.posts[index];
    const updated: Post = {
      ...current,
      ...data,
      updatedAt: nowDate(),
    };
    db.posts[index] = updated;
    await writeDatabase(db);
    return clone(updated);
  });
}

export async function deletePost(id: number): Promise<Post | null> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const index = db.posts.findIndex((post) => post.id === id);
    if (index === -1) return null;
    const [removed] = db.posts.splice(index, 1);
    await writeDatabase(db);
    return clone(removed);
  });
}

export async function listProjects(): Promise<Project[]> {
  return runExclusive(async () =>
    sortProjects(clone((await readDatabase()).projects)),
  );
}

export async function getProjectById(id: number): Promise<Project | null> {
  return runExclusive(async () => {
    const item = (await readDatabase()).projects.find(
      (project) => project.id === id,
    );
    return item ? clone(item) : null;
  });
}

export async function createProject(data: CreateProjectInput): Promise<Project> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const timestamp = nowDate();
    const item: Project = {
      id: nextId(db.projects),
      ...data,
      description: data.description ?? "",
      details: data.details ?? "",
      image: data.image ?? "",
      tags: data.tags ?? [],
      link: data.link ?? "",
      sortOrder: data.sortOrder ?? 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    db.projects.push(item);
    await writeDatabase(db);
    return clone(item);
  });
}

export async function updateProject(
  id: number,
  data: UpdateProjectInput,
): Promise<Project | null> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const index = db.projects.findIndex((project) => project.id === id);
    if (index === -1) return null;
    const updated: Project = {
      ...db.projects[index],
      ...data,
      updatedAt: nowDate(),
    };
    db.projects[index] = updated;
    await writeDatabase(db);
    return clone(updated);
  });
}

export async function deleteProject(id: number): Promise<Project | null> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const index = db.projects.findIndex((project) => project.id === id);
    if (index === -1) return null;
    const [removed] = db.projects.splice(index, 1);
    await writeDatabase(db);
    return clone(removed);
  });
}

export async function listContactMessages(
  opts?: { unreadOnly?: boolean },
): Promise<ContactMessage[]> {
  return runExclusive(async () => {
    const all = clone((await readDatabase()).contactMessages);
    const filtered = opts?.unreadOnly ? all.filter((m) => m.isRead !== true) : all;
    return sortContactMessages(filtered);
  });
}

export async function getContactMessageById(id: number): Promise<ContactMessage | null> {
  return runExclusive(async () => {
    const item = (await readDatabase()).contactMessages.find((message) => message.id === id);
    return item ? clone(item) : null;
  });
}

export async function createContactMessage(
  data: Pick<ContactMessage, "name" | "email" | "subject" | "message">,
): Promise<ContactMessage> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const item: ContactMessage = {
      id: nextId(db.contactMessages),
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      isRead: false,
      createdAt: new Date(),
    };
    db.contactMessages.push(item);
    await writeDatabase(db);
    return clone(item);
  });
}

export async function updateContactMessage(
  id: number,
  data: UpdateContactMessageInput,
): Promise<ContactMessage | null> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const index = db.contactMessages.findIndex((message) => message.id === id);
    if (index === -1) return null;
    const updated: ContactMessage = {
      ...db.contactMessages[index],
      isRead: data.isRead,
    };
    db.contactMessages[index] = updated;
    await writeDatabase(db);
    return clone(updated);
  });
}

export async function deleteContactMessage(id: number): Promise<ContactMessage | null> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const index = db.contactMessages.findIndex((message) => message.id === id);
    if (index === -1) return null;
    const [removed] = db.contactMessages.splice(index, 1);
    await writeDatabase(db);
    return clone(removed);
  });
}

export async function listSections(): Promise<Section[]> {
  return runExclusive(async () => clone((await readDatabase()).sections));
}

export async function getSectionByKey(key: string): Promise<Section | null> {
  return runExclusive(async () => {
    const item = (await readDatabase()).sections.find((section) => section.key === key);
    return item ? clone(item) : null;
  });
}

export async function upsertSection(key: string, value: string): Promise<Section> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const timestamp = nowDate();
    const existing = db.sections.findIndex((section) => section.key === key);
    const item: Section = { key, value, updatedAt: timestamp };

    if (existing === -1) {
      db.sections.push(item);
    } else {
      db.sections[existing] = item;
    }

    await writeDatabase(db);
    return clone(item);
  });
}

export async function createSession(user: AuthUser): Promise<string> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const sid = crypto.randomBytes(32).toString("hex");
    db.sessions = db.sessions.filter(
      (session) => new Date(session.expiresAt).getTime() > Date.now(),
    );
    db.sessions.push({
      sid,
      user,
      expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
    });
    await writeDatabase(db);
    return sid;
  });
}

export async function getSession(
  sid: string,
): Promise<{ sid: string; user: AuthUser } | null> {
  return runExclusive(async () => {
    const db = await readDatabase();
    const session = db.sessions.find((item) => item.sid === sid);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      db.sessions = db.sessions.filter((item) => item.sid !== sid);
      await writeDatabase(db);
      return null;
    }

    return clone({ sid: session.sid, user: session.user });
  });
}

export async function deleteSession(sid: string): Promise<void> {
  await runExclusive(async () => {
    const db = await readDatabase();
    db.sessions = db.sessions.filter((session) => session.sid !== sid);
    await writeDatabase(db);
  });
}
