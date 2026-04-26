import { Router, type IRouter } from "express";
import { SendContactMessageBody, SendContactMessageResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { createContactMessage } from "../lib/store";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SendContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Honeypot: if a bot fills it, silently accept.
  if (parsed.data.company && parsed.data.company.trim().length > 0) {
    res.json(SendContactMessageResponse.parse({ ok: true }));
    return;
  }

  try {
    await createContactMessage({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    res.json(SendContactMessageResponse.parse({ ok: true }));
  } catch (err) {
    logger.error({ err }, "Failed to store contact message");
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to send message" });
  }
});

export default router;
