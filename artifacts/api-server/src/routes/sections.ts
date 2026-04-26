import { Router, type IRouter } from "express";
import {
  GetSectionParams,
  UpsertSectionParams,
  UpsertSectionBody,
} from "@workspace/api-zod";
import {
  getSectionByKey,
  listSections,
  upsertSection,
} from "../lib/store";

const router: IRouter = Router();

router.get("/sections", async (_req, res): Promise<void> => {
  const items = await listSections();
  res.json(items);
});

router.get("/sections/:key", async (req, res): Promise<void> => {
  const parsed = GetSectionParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const item = await getSectionByKey(parsed.data.key);
  if (!item) {
    res.status(404).json({ error: "Section not found" });
    return;
  }
  res.json(item);
});

router.put("/sections/:key", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = UpsertSectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpsertSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const item = await upsertSection(params.data.key, parsed.data.value);
  res.json(item);
});

export default router;
