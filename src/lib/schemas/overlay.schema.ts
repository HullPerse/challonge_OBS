import {
  OVERLAY_CURSOR_SIZE,
  OVERLAY_POINTER_RANGE,
  OVERLAY_VIEW_LIMITS,
} from "@/configs/overlay.config";
import { snapshotSchema, visibilityShape } from "@/lib/schemas/tournament-snapshot.schema";
import type { OverlayModuleKey, OverlayModules } from "@/types/overlay";
import { z } from "zod";

export const overlayViewSchema = z.object({
  zoom: z.number().min(OVERLAY_VIEW_LIMITS.zoom.min).max(OVERLAY_VIEW_LIMITS.zoom.max),
  centerX: z.number().min(OVERLAY_VIEW_LIMITS.centerX.min).max(OVERLAY_VIEW_LIMITS.centerX.max),
  centerY: z.number().min(OVERLAY_VIEW_LIMITS.centerY.min).max(OVERLAY_VIEW_LIMITS.centerY.max),
});

export const overlayPointerSchema = z.object({
  x: z.number().min(OVERLAY_POINTER_RANGE.min).max(OVERLAY_POINTER_RANGE.max),
  y: z.number().min(OVERLAY_POINTER_RANGE.min).max(OVERLAY_POINTER_RANGE.max),
  visible: z.boolean(),
  cursor: z.enum(["default", "link"]).default("default"),
});

const moduleShape = {
  camera: z.boolean(),
  pointer: z.boolean(),
  background: z.boolean(),
  scores: z.boolean(),
  seeds: z.boolean(),
  matchNumbers: z.boolean(),
  stations: z.boolean(),
  schedule: z.boolean(),
  avatars: z.boolean(),
  roundTitles: z.boolean(),
  header: z.boolean(),
  liveBadge: z.boolean(),
  completedDim: z.boolean(),
} satisfies Record<OverlayModuleKey, z.ZodBoolean>;

export const overlayModulesSchema = z
  .object(moduleShape)
  .strict() satisfies z.ZodType<OverlayModules>;

export const overlayModalSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("match"), matchId: z.number().int() }).strict(),
  z.object({ kind: z.literal("player"), playerId: z.number().int() }).strict(),
]);

export const overlayStateSchema = z.object({
  activeKey: z.string().nullable(),
  view: overlayViewSchema,
  pointer: overlayPointerSchema,
  pointerSize: z
    .number()
    .int()
    .min(OVERLAY_CURSOR_SIZE.min)
    .max(OVERLAY_CURSOR_SIZE.max)
    .default(OVERLAY_CURSOR_SIZE.default),
  modules: overlayModulesSchema,
  highlightedPlayerId: z.number().int().nullable(),
  modal: overlayModalSchema.nullable(),
  revision: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});

const overlayVisibilitySchema = z.object(visibilityShape);

export const overlaySyncEventSchema = z.object({
  type: z.literal("sync"),
  state: overlayStateSchema,
  tournament: snapshotSchema.nullable(),
  visibility: overlayVisibilitySchema,
});

export const overlayEventSchema = z.discriminatedUnion("type", [
  overlaySyncEventSchema,
  z.object({
    type: z.literal("state"),
    state: overlayStateSchema,
    tournament: snapshotSchema.nullable().optional(),
    visibility: overlayVisibilitySchema.optional(),
  }),
  z.object({
    type: z.literal("pointer"),
    pointer: overlayPointerSchema,
    revision: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("focus"),
    highlightedPlayerId: z.number().int().nullable(),
    modal: overlayModalSchema.nullable(),
    revision: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("modules"),
    modules: overlayModulesSchema,
    view: overlayViewSchema,
    pointer: overlayPointerSchema,
    revision: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("tournament"),
    tournament: snapshotSchema,
    visibility: overlayVisibilitySchema,
    revision: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("visibility"),
    visibility: overlayVisibilitySchema,
    revision: z.number().int().nonnegative(),
  }),
]);
