import { db, postsTable, projectsTable, sectionsTable } from "@workspace/db";

const posts = [
  {
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
  },
  {
    slug: "esp32-vs-arduino-choosing-right-board",
    title: "ESP32 vs Arduino: Choosing the Right Board",
    excerpt:
      "The Arduino Uno is a classic, but the ESP32 is a powerhouse. When should you use which for your next IoT project?",
    coverImage: "/images/blog-esp32-arduino.png",
    publishedAt: "2024-04-28",
    readTimeMinutes: 6,
    tags: ["ESP32", "Arduino", "IoT"],
    isPublished: true,
    content: `The microcontroller landscape has exploded in recent years, but two names constantly come up in the maker and prototyping communities: Arduino (specifically the ATmega328P-based Uno) and the Espressif ESP32.

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
- **Connectivity:** Built-in Wi-Fi and Bluetooth (Classic & BLE).
- **Memory:** 520KB SRAM, plus often MBs of external flash.
- **Peripherals:** Hardware touch sensors, Hall effect sensors, multiple UART/SPI/I2C buses.

**Cons:**
- **3.3V Logic:** Requires care when interfacing with 5V sensors.
- **Complexity:** It runs FreeRTOS under the hood.
- **Power Hungry:** While it has excellent deep sleep modes, its active power consumption is much higher than a bare ATmega.

### The Verdict

If you are building a simple mechanical controller, the **Arduino** is still a great, robust choice.

If your device needs to talk to the internet, process audio, serve a webpage, or do heavy math, the **ESP32** is the undisputed champion.`,
  },
  {
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

1. **Kill the Quiescent Current (Iq):** Every voltage regulator consumes power just by existing. You need ultra-low Iq regulators that consume nanoamps.
2. **Load Switches:** Don't just put sensors to sleep; physically cut their power.
3. **Pull-up/Pull-down Resistors:** Use higher values (100k - 1M) if speed isn't an issue.

### Firmware Tricks

1. **Sleep 99.9% of the Time:** Your MCU should be in its deepest sleep state almost constantly.
2. **Race to Sleep:** Run your MCU clock faster so you finish calculations and return to deep sleep sooner.
3. **Smart Radio Usage:** Batch your data instead of transmitting on every sample.

Low power design is a game of accounting. You must map out every state your device enters, calculate the current draw and duration of that state, and optimize relentlessly.`,
  },
  {
    slug: "schematic-to-manufactured-board",
    title: "From Schematic to Manufactured Board: A Walkthrough",
    excerpt:
      "A comprehensive guide on taking a circuit idea from a conceptual schematic to a physical, manufactured PCB in your hands.",
    coverImage: "/images/blog-schematic-pcb.png",
    publishedAt: "2024-02-02",
    readTimeMinutes: 12,
    tags: ["PCB Design", "Manufacturing", "Hardware"],
    isPublished: true,
    content: `The journey from a breadboard prototype to a polished, manufactured PCB is the defining process of hardware engineering.

### Phase 1: Component Selection and Schematic Capture

Before drawing any wires, you read datasheets. You select your MCU, your power regulators, your sensors, and your passives.

### Phase 2: PCB Layout

This is where physics enters the chat. Group related components logically. Keep decoupling caps right next to IC power pins.

### Phase 3: Verification (DRC & ERC)

Run your Electrical Rules Check (ERC) on the schematic and Design Rules Check (DRC) on the layout.

### Phase 4: Generating Manufacturing Files

Export Gerber files (one for every layer) and NC Drill files. For assembly: BOM and Pick-and-Place file.

### Phase 5: Fabrication and Assembly

Upload the files to a fab house. They print the copper, apply the solder mask, drill the holes, and optionally solder the components.

A few weeks later, a box arrives, and the moment of truth begins: bringing the board up.`,
  },
];

const projects = [
  {
    title: "High-Speed Data Acquisition PCB",
    description:
      "Custom 6-layer PCB design for industrial data logging. Features an STM32H7, precise analog front-end, and gigabit ethernet PHY.",
    image: "/images/project-1.png",
    tags: ["Altium", "STM32", "High-Speed Routing", "Analog Design"],
    link: "https://github.com/saleemshahzad",
    sortOrder: 1,
  },
  {
    title: "ESP32 Distributed Weather Station",
    description:
      "A network of solar-powered environmental nodes communicating via ESP-NOW. Central hub pushes aggregated data to AWS IoT.",
    image: "/images/project-2.png",
    tags: ["ESP32", "ESP-NOW", "FreeRTOS", "AWS IoT", "Solar Power"],
    link: "https://github.com/saleemshahzad",
    sortOrder: 2,
  },
  {
    title: "Smart Home Automation Hub",
    description:
      "Arduino Mega based centralized home automation controller with custom relay shield, supporting MQTT and physical fallback switches.",
    image: "/images/project-3.png",
    tags: ["Arduino C++", "MQTT", "Relay Control", "Home Assistant"],
    link: "https://github.com/saleemshahzad",
    sortOrder: 3,
  },
  {
    title: "DIN-Rail Smart Energy Meter",
    description:
      "Industrial prototype for monitoring three-phase power consumption. Real-time calculations of active, reactive, and apparent power.",
    image: "/images/project-4.png",
    tags: ["DSP", "Current Transformers", "Modbus RTU", "C"],
    link: "https://github.com/saleemshahzad",
    sortOrder: 4,
  },
  {
    title: "BLE Bio-Signal Wearable",
    description:
      "Miniature wearable device for tracking heart rate and SpO2. Features a custom flexible PCB and nRF52 series MCU for low power BLE.",
    image: "/images/project-5.png",
    tags: ["nRF52", "BLE", "Flexible PCB", "Zephyr RTOS"],
    link: "https://github.com/saleemshahzad",
    sortOrder: 5,
  },
  {
    title: "Harsh-Environment Sensor Node",
    description:
      "IP67 rated industrial sensor node for vibration and temperature monitoring. Designed for longevity in factories.",
    image: "/images/project-6.png",
    tags: ["Mechanical Design", "Low Power", "I2C/SPI", "LoRaWAN"],
    link: "https://github.com/saleemshahzad",
    sortOrder: 6,
  },
];

const sections: Record<string, string> = {
  home_role: "Electrical Engineer — Embedded Systems",
  home_tagline:
    "I design circuits, lay out PCBs, and write firmware that brings hardware to life. Specializing in Arduino, ESP32, and Altium-based PCB design.",
  home_name: "Saleem Shahzad",
  about_intro:
    "I am a passionate Electrical Engineer who finds beauty in the intersection of hardware and software. There is nothing quite like the feeling of designing a circuit on a screen, holding the fabricated PCB in your hands, and writing the code that brings it to life.",
  about_philosophy:
    "Embedded systems engineering is more than just connecting pins and writing loops. It's about constraints — power, memory, timing, and cost. It's about understanding the physics of the signals travelling across your traces, while simultaneously managing complex state machines in C/C++.\n\nI approach every project with a system-level mindset. A brilliant piece of firmware is useless if the hardware design introduces noise, and a perfect PCB layout cannot save inefficient code. My goal is always harmony between the physical board and the digital logic.",
  contact_email: "saleem.shahzad@example.com",
  contact_location: "Pakistan",
  contact_github: "https://github.com/saleemshahzad",
  contact_linkedin: "https://linkedin.com/in/saleemshahzad",
};

async function main() {
  const existingPosts = await db.select().from(postsTable);
  if (existingPosts.length === 0) {
    await db.insert(postsTable).values(posts);
    console.log(`Seeded ${posts.length} posts`);
  } else {
    console.log(`Skipped posts (${existingPosts.length} already exist)`);
  }

  const existingProjects = await db.select().from(projectsTable);
  if (existingProjects.length === 0) {
    await db.insert(projectsTable).values(projects);
    console.log(`Seeded ${projects.length} projects`);
  } else {
    console.log(`Skipped projects (${existingProjects.length} already exist)`);
  }

  const existingSections = await db.select().from(sectionsTable);
  const existingKeys = new Set(existingSections.map((s) => s.key));
  const toInsert = Object.entries(sections)
    .filter(([k]) => !existingKeys.has(k))
    .map(([key, value]) => ({ key, value }));
  if (toInsert.length > 0) {
    await db.insert(sectionsTable).values(toInsert);
    console.log(`Seeded ${toInsert.length} sections`);
  } else {
    console.log("Skipped sections (already seeded)");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
