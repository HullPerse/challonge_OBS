import { EMPTY_VISIBILITY } from "@/configs/store.config";
import type {
  EventHandlers,
  OverlayEvent,
  OverlayScene,
  OverlayScenePatch,
  OverlayState,
} from "@/types/overlay";

const updateScene = (
  previous: OverlayScene | null,
  revision: number,
  patch: OverlayScenePatch = {},
): OverlayScene | null => {
  if (!previous) return null;

  const { state: statePatch, ...scenePatch } = patch;

  return {
    ...previous,
    ...scenePatch,
    state: {
      ...previous.state,
      ...statePatch,
      revision,
      updatedAt: Date.now(),
    },
  };
};

const handlers: EventHandlers = {
  sync: (_, event) => ({
    state: event.state,
    tournament: event.tournament,
    visibility: event.visibility,
  }),

  state: (previous, event) => ({
    state: event.state,
    tournament: event.tournament ?? previous?.tournament ?? null,
    visibility: event.visibility ?? previous?.visibility ?? EMPTY_VISIBILITY,
  }),

  pointer: (previous, event) =>
    updateScene(previous, event.revision, {
      state: { pointer: event.pointer },
    }),

  focus: (previous, event) =>
    updateScene(previous, event.revision, {
      state: {
        highlightedPlayerId: event.highlightedPlayerId,
        modal: event.modal,
      },
    }),

  modules: (previous, event) =>
    updateScene(previous, event.revision, {
      state: {
        modules: event.modules,
        view: event.view,
        pointer: event.pointer,
      },
    }),

  tournament: (previous, event) =>
    updateScene(previous, event.revision, {
      tournament: event.tournament,
      visibility: event.visibility,
    }),

  visibility: (previous, event) =>
    updateScene(previous, event.revision, {
      visibility: event.visibility,
    }),
};

/** Reduces SSE events into the query-cache overlay state. */
export const applyStateEvent = (
  previous: OverlayState | undefined,
  event: OverlayEvent,
): OverlayState | undefined => {
  if (event.type === "tournament" || event.type === "visibility") return previous;

  if (!previous) {
    return event.type === "sync" || event.type === "state" ? event.state : previous;
  }

  if (event.type === "sync" || event.type === "state") {
    return event.state.revision >= previous.revision ? event.state : previous;
  }

  if (event.revision < previous.revision) return previous;

  if (event.type === "pointer") {
    return {
      ...previous,
      pointer: event.pointer,
      revision: event.revision,
      updatedAt: Date.now(),
    };
  }

  if (event.type === "focus") {
    return {
      ...previous,
      highlightedPlayerId: event.highlightedPlayerId,
      modal: event.modal,
      revision: event.revision,
      updatedAt: Date.now(),
    };
  }

  return {
    ...previous,
    modules: event.modules,
    view: event.view,
    pointer: event.pointer,
    revision: event.revision,
    updatedAt: Date.now(),
  };
};

const applyEvent = (previous: OverlayScene | null, event: OverlayEvent): OverlayScene | null => {
  switch (event.type) {
    case "sync":
      return handlers.sync(previous, event);

    case "state":
      return handlers.state(previous, event);

    case "pointer":
      return handlers.pointer(previous, event);

    case "focus":
      return handlers.focus(previous, event);

    case "modules":
      return handlers.modules(previous, event);

    case "tournament":
      return handlers.tournament(previous, event);

    case "visibility":
      return handlers.visibility(previous, event);

    default: {
      return event satisfies never;
    }
  }
};

export { applyEvent };
