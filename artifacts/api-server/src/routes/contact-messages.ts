import { Router, type IRouter } from "express";
import {
  DeleteContactMessageParams,
  GetContactMessageParams,
  ListContactMessagesQueryParams,
  UpdateContactMessageBody,
  UpdateContactMessageParams,
} from "@workspace/api-zod";
import {
  deleteContactMessage,
  getContactMessageById,
  listContactMessages,
  updateContactMessage,
} from "../lib/store";

const router: IRouter = Router();

router.get("/contact-messages", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = ListContactMessagesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const messages = await listContactMessages({ unreadOnly: parsed.data.unreadOnly });
  res.json(messages);
});

router.get("/contact-messages/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = GetContactMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const message = await getContactMessageById(params.data.id);
  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  res.json(message);
});

router.patch("/contact-messages/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = UpdateContactMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateContactMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updated = await updateContactMessage(params.data.id, body.data);
  if (!updated) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  res.json(updated);
});

router.delete("/contact-messages/:id", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const params = DeleteContactMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const removed = await deleteContactMessage(params.data.id);
  if (!removed) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

