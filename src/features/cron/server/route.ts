import { Hono } from "hono";

import { createAdminClient } from "@/lib/appwrite";
import { notifyTasksDueSoon } from "@/features/notifications/server/due-soon";

const app = new Hono().get("/due-soon", async (c) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || c.req.header("Authorization") !== `Bearer ${secret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { databases } = await createAdminClient();
  const notified = await notifyTasksDueSoon(databases);

  return c.json({ data: { notified } });
});

export default app;
