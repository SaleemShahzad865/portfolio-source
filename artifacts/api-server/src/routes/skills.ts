import { Router, type IRouter } from "express";
import { GetSkillsResponse, UpsertSkillsBody } from "@workspace/api-zod";
import { getSectionByKey, upsertSection } from "../lib/store";

const router: IRouter = Router();

const SKILLS_SECTION_KEY = "skills_config";

const defaultSkills = GetSkillsResponse.parse({
  categories: [
    {
      id: "embedded",
      title: "Embedded Systems",
      icon: "Cpu",
      skills: [
        { id: "mcu", name: "Microcontrollers (STM32, AVR, PIC)", level: 95 },
        { id: "esp", name: "ESP32 & ESP8266", level: 90 },
        { id: "rtos", name: "RTOS (FreeRTOS, Zephyr)", level: 85 },
        { id: "baremetal", name: "Bare-metal Programming", level: 90 },
        { id: "lowpower", name: "Low Power Optimization", level: 80 },
      ],
    },
    {
      id: "hardware",
      title: "PCB & Hardware",
      icon: "CircuitBoard",
      skills: [
        { id: "cad", name: "Altium Designer / KiCad", level: 90 },
        { id: "hs", name: "High-Speed Routing", level: 75 },
        { id: "circuits", name: "Analog & Digital Circuit Design", level: 85 },
        { id: "emc", name: "EMI/EMC Compliance", level: 70 },
        { id: "rework", name: "Soldering & SMD Rework", level: 95 },
      ],
    },
    {
      id: "programming",
      title: "Programming",
      icon: "Code2",
      skills: [
        { id: "cpp", name: "C / C++", level: 95 },
        { id: "py", name: "Python", level: 85 },
        { id: "asm", name: "Assembly", level: 65 },
        { id: "rust", name: "Rust (Embedded)", level: 60 },
      ],
    },
    {
      id: "tools",
      title: "Protocols & Tools",
      icon: "Radio",
      skills: [
        { id: "buses", name: "I2C, SPI, UART, CAN, Modbus", level: 95 },
        { id: "rf", name: "BLE, Wi-Fi, LoRa, MQTT", level: 85 },
        { id: "lab", name: "Oscilloscopes & Logic Analyzers", level: 90 },
        { id: "git", name: "Git & CI/CD", level: 80 },
      ],
    },
  ],
});

function safeParseSkills(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    return GetSkillsResponse.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

router.get("/skills", async (_req, res): Promise<void> => {
  const section = await getSectionByKey(SKILLS_SECTION_KEY);
  const parsed = safeParseSkills(section?.value);
  res.json(parsed ?? defaultSkills);
});

router.put("/skills", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpsertSkillsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await upsertSection(SKILLS_SECTION_KEY, JSON.stringify(parsed.data));
  res.json(parsed.data);
});

export default router;

