import { MAX_KEY_LENGTH, TOURNAMENT_KEY } from "@/configs/server/validation.config";
import {
  overlayModalSchema,
  overlayModulesSchema,
  overlayPointerSchema,
  overlayStateSchema,
  overlayViewSchema,
} from "@/lib/schemas/overlay.schema";
import { OVERLAY_CURSOR_SIZE } from "@/configs/overlay.config";
import { z } from "zod";

export { overlayPointerSchema };

export const overlaySetViewSchema = z.object({
  activeKey: z.string().max(MAX_KEY_LENGTH).regex(TOURNAMENT_KEY).nullable(),
  view: overlayViewSchema,
});

export const overlayModulesPatchSchema = overlayModulesSchema.partial();

export const overlayFocusPatchSchema = z
  .object({
    highlightedPlayerId: z.number().int().nullable().optional(),
    modal: overlayModalSchema.nullable().optional(),
  })
  .strict();

const overlayActiveKeySchema = z.string().max(MAX_KEY_LENGTH).regex(TOURNAMENT_KEY).nullable();

export const overlayPointerSizeSchema = z
  .object({
    pointerSize: z.number().int().min(OVERLAY_CURSOR_SIZE.min).max(OVERLAY_CURSOR_SIZE.max),
  })
  .strict();

/** Persisted row shape; transient focus fields are not stored. */
export const overlayPersistedStateSchema = overlayStateSchema
  .omit({ highlightedPlayerId: true, modal: true })
  .extend({
    activeKey: overlayActiveKeySchema,
  });
