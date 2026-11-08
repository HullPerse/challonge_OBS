import type { OVERLAY_MODULE_KEYS } from "@/configs/overlay.config";
import type { TournamentSnapshot, TournamentVisibility } from "@/types/tournament";

export type OverlayView = {
  zoom: number;
  centerX: number;
  centerY: number;
};

type OverlayPointerCursor = "default" | "link";

export type OverlayPointer = {
  x: number;
  y: number;
  visible: boolean;
  cursor: OverlayPointerCursor;
};

export type OverlayModuleKey = (typeof OVERLAY_MODULE_KEYS)[number];

export type OverlayModules = Record<OverlayModuleKey, boolean>;

export type OverlayModulesPatch = Partial<OverlayModules>;

export type OverlayPointerSizeInput = {
  pointerSize: number;
};

export type OverlaySetViewInput = {
  activeSlug: string | null;
  view: OverlayView;
};

export type OverlayModal =
  | { kind: "match"; matchId: number }
  | { kind: "player"; playerId: number };

export type OverlayFocusPatch = {
  highlightedPlayerId?: number | null;
  modal?: OverlayModal | null;
};

export type OverlayState = {
  activeSlug: string | null;
  view: OverlayView;
  pointer: OverlayPointer;
  pointerSize: number;
  modules: OverlayModules;
  highlightedPlayerId: number | null;
  modal: OverlayModal | null;
  revision: number;
  updatedAt: number;
};

export type OverlaySyncEvent = {
  type: "sync";
  state: OverlayState;
  tournament: TournamentSnapshot | null;
  visibility: TournamentVisibility;
};

export type OverlayStateEvent = {
  type: "state";
  state: OverlayState;
  tournament?: TournamentSnapshot | null;
  visibility?: TournamentVisibility;
};

type OverlayPointerEvent = {
  type: "pointer";
  pointer: OverlayPointer;
  revision: number;
};

type OverlayFocusEvent = {
  type: "focus";
  highlightedPlayerId: number | null;
  modal: OverlayModal | null;
  revision: number;
};

type OverlayModulesEvent = {
  type: "modules";
  modules: OverlayModules;
  view: OverlayView;
  pointer: OverlayPointer;
  revision: number;
};

type OverlayTournamentEvent = {
  type: "tournament";
  tournament: TournamentSnapshot;
  visibility: TournamentVisibility;
  revision: number;
};

type OverlayVisibilityEvent = {
  type: "visibility";
  visibility: TournamentVisibility;
  revision: number;
};

export type OverlayViewResult =
  | { ok: true; state: OverlayState }
  | { ok: false; status: 404; error: string };

export type OverlayRange = { min: number; max: number };
export type OverlayLimits = {
  zoom: OverlayRange;
  centerX: OverlayRange;
  centerY: OverlayRange;
};

export type OverlayScene = {
  state: OverlayState;
  tournament: TournamentSnapshot | null;
  visibility: TournamentVisibility;
};

export type OverlayEvent =
  | OverlaySyncEvent
  | OverlayStateEvent
  | OverlayPointerEvent
  | OverlayFocusEvent
  | OverlayModulesEvent
  | OverlayTournamentEvent
  | OverlayVisibilityEvent;

type OverlayEventMap = {
  [Event in OverlayEvent as Event["type"]]: Event;
};

export type EventHandlers = {
  [K in keyof OverlayEventMap]: (
    previous: OverlayScene | null,
    event: OverlayEventMap[K],
  ) => OverlayScene | null;
};

export type OverlayScenePatch = Partial<Omit<OverlayScene, "state">> & {
  state?: Partial<OverlayState>;
};
