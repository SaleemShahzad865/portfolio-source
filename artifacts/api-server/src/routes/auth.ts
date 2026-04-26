import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { createSession, deleteSession, getSession } from "../lib/store";

const router: IRouter = Router();

router.get("/auth/user", async (req: Request, res: Response) => {
  const sid = req.cookies?.sid;
  const session = sid ? await getSession(sid) : null;

  res.json(
    GetCurrentAuthUserResponse.parse({
      user: session?.user ?? null,
    }),
  );
});

router.get("/login", (_req: Request, res: Response) => {
  res.redirect("/admin/login");
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const email =
    typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password.trim() : "";

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";

  const expectedUser = process.env.ADMIN_USERNAME ?? (isProduction ? "" : "admin");
  const expectedPass = process.env.ADMIN_PASSWORD ?? (isProduction ? "" : "admin");

  if (isProduction && (!expectedUser || !expectedPass)) {
    res.status(500).json({
      error:
        "Server is missing ADMIN_USERNAME/ADMIN_PASSWORD env vars. Set them in your host (e.g. Vercel) and redeploy.",
    });
    return;
  }

  if (email !== expectedUser || password !== expectedPass) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const user = {
    id: "local-admin",
    email: expectedUser.includes("@") ? expectedUser : null,
    firstName: "Local",
    lastName: "Admin",
    profileImageUrl: null,
  };

  const sid = await createSession(user);

  res.cookie("sid", sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ user });
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = req.cookies?.sid;
  if (sid) {
    await deleteSession(sid);
  }

  res.clearCookie("sid", { path: "/" });
  res.redirect("/admin/login");
});

export default router;
