import { MAX_PORT } from "@/configs/server/env.config";
import { z } from "zod";

export const settingsSchema = z
  .object({
    port: z.number().int().min(1).max(MAX_PORT),
    open_browser: z.boolean(),
    db_path: z.string().trim().min(1),
  })
  .partial();
