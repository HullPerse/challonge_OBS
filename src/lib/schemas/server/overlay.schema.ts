import { MAX_SLUG_LENGTH, SLUG } from "@/configs/server/validation.config";
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
  activeSlug: z.string().max(MAX_SLUG_LENGTH).regex(SLUG).nullable(),
  view: overlayViewSchema,
});

export const overlayModulesPatchSchema = overlayModulesSchema.partial();

export const overlayFocusPatchSchema = z
  .object({
    highlightedPlayerId: z.number().int().nullable().optional(),
    modal: overlayModalSchema.nullable().optional(),
  })
  .strict();

const overlayActiveSlugSchema = z.string().max(MAX_SLUG_LENGTH).regex(SLUG).nullable();

export const overlayPointerSizeSchema = z
  .object({
    pointerSize: z.number().int().min(OVERLAY_CURSOR_SIZE.min).max(OVERLAY_CURSOR_SIZE.max),
  })
  .strict();

/** Persisted row shape; transient focus fields are not stored. */
export const overlayPersistedStateSchema = overlayStateSchema
  .omit({ highlightedPlayerId: true, modal: true })
  .extend({
    activeSlug: overlayActiveSlugSchema,
  });
