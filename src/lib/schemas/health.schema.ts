import { z } from "zod";

export const healthSchema = z.object({
  ok: z.boolean(),
  db: z.enum(["up", "down"]),
});
