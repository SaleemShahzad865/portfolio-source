import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import contactRouter from "./contact";
import contactMessagesRouter from "./contact-messages";
import postsRouter from "./posts";
import projectsRouter from "./projects";
import skillsRouter from "./skills";
import sectionsRouter from "./sections";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(contactRouter);
router.use(contactMessagesRouter);
router.use(postsRouter);
router.use(projectsRouter);
router.use(skillsRouter);
router.use(sectionsRouter);
router.use(uploadsRouter);

export default router;
