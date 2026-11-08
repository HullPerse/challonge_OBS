import type {
  OverlayLimits,
  OverlayModuleKey,
  OverlayModules,
  OverlayPointer,
  OverlayRange,
  OverlayView,
} from "@/types/overlay";
/** Overlay feature toggles shown in the UI. */
export const OVERLAY_MODULE_KEYS = [
  "camera",
  "pointer",
  "background",
  "scores",
  "seeds",
  "matchNumbers",
  "stations",
  "schedule",
  "avatars",
  "roundTitles",
  "header",
  "liveBadge",
  "completedDim",
] as const;

/** Module grouping and copy used by the control-panel switches. */
export const OVERLAY_MODULE_GROUPS = [
  {
    label: "Сцена",
    keys: ["camera", "pointer", "background"],
  },
  {
    label: "Сетка",
    keys: [
      "scores",
      "seeds",
      "matchNumbers",
      "stations",
      "schedule",
      "avatars",
      "roundTitles",
      "completedDim",
    ],
  },
  {
    label: "Шапка",
    keys: ["header", "liveBadge"],
  },
] as const satisfies readonly {
  label: string;
  keys: readonly OverlayModuleKey[];
}[];

export const OVERLAY_MODULE_LABELS: Record<OverlayModuleKey, string> = {
  camera: "Камера",
  pointer: "Курсор",
  background: "Фон",
  scores: "Счёт",
  seeds: "Seed",
  matchNumbers: "Номера матчей",
  stations: "Столы",
  schedule: "Расписание",
  avatars: "Аватары",
  roundTitles: "Раунды",
  header: "Шапка",
  liveBadge: "Метка LIVE",
  completedDim: "Завершённые матчи",
};

/** Fixed overlay stage size in CSS pixels. */
export const OVERLAY_STAGE_WIDTH: number = 1920;
export const OVERLAY_STAGE_HEIGHT: number = 1080;

/** Cursor image size limits and the default, in overlay stage pixels. */
export const OVERLAY_CURSOR_SIZE = {
  min: 32,
  max: 64,
  step: 2,
  default: 48,
} as const;

/** Element id of the server-inlined first-paint state. */
export const OVERLAY_BOOTSTRAP_ID = "overlay-bootstrap";

/** Offsets that put the visible cursor tip on the synced pointer coordinate. */
export const OVERLAY_CURSOR_OFFSETS: Record<OverlayPointer["cursor"], { x: number; y: number }> = {
  default: { x: -2.625, y: -1.5 },
  link: { x: -15.75, y: -12.75 },
};

/** Allowed zoom and center ranges. */
export const OVERLAY_VIEW_LIMITS: OverlayLimits = {
  zoom: { min: 0.05, max: 5 },
  centerX: { min: -2, max: 3 },
  centerY: { min: -2, max: 3 },
};

/** Normalized pointer coordinate range. */
export const OVERLAY_POINTER_RANGE: OverlayRange = {
  min: 0,
  max: 1,
};

/** Initial camera state. */
export const DEFAULT_VIEW: OverlayView = {
  zoom: 1,
  centerX: 0.5,
  centerY: 0.5,
};

/** Initial pointer state, hidden until the first move. */
export const DEFAULT_POINTER: OverlayPointer = {
  x: 0.5,
  y: 0.5,
  visible: false,
  cursor: "default",
};

/** Every module enabled by default. */
export const DEFAULT_MODULES = {
  camera: true,
  pointer: true,
  background: true,
  scores: true,
  seeds: true,
  matchNumbers: true,
  stations: true,
  schedule: true,
  avatars: true,
  roundTitles: true,
  header: true,
  liveBadge: true,
  completedDim: true,
} satisfies OverlayModules;
