import { DEFAULT_MODULES } from "@/configs/overlay.config";
import { applyEvent, applyStateEvent } from "@/lib/bracket/overlay.utils";
import type { OverlayState } from "@/types/overlay";
import { describe, expect, test } from "bun:test";

const state: OverlayState = {
  activeSlug: "cup",
  view: { zoom: 1, centerX: 0.5, centerY: 0.5 },
  pointer: { x: 0.5, y: 0.5, visible: false, cursor: "default" },
  pointerSize: 48,
  modules: DEFAULT_MODULES,
  highlightedPlayerId: null,
  modal: null,
  revision: 1,
  updatedAt: 0,
};

describe("overlay state reducers", () => {
  test("applies a pointer event with a newer revision", () => {
    const next = applyStateEvent(state, {
      type: "pointer",
      pointer: { x: 0.25, y: 0.75, visible: true, cursor: "link" },
      revision: 2,
    });

    expect(next?.pointer).toEqual({ x: 0.25, y: 0.75, visible: true, cursor: "link" });
    expect(next?.revision).toBe(2);
  });

  test("ignores an event older than the cached state", () => {
    const next = applyStateEvent(state, {
      type: "pointer",
      pointer: { x: 0.25, y: 0.75, visible: true, cursor: "default" },
      revision: 0,
    });

    expect(next).toEqual(state);
  });

  test("replaces the state on sync", () => {
    const synced = { ...state, revision: 5, pointerSize: 32 };
    const next = applyStateEvent(state, {
      type: "sync",
      state: synced,
      tournament: null,
      visibility: { hiddenMatches: [], hiddenRounds: [] },
    });

    expect(next).toEqual(synced);
  });

  test("applies a focus event through the scene reducer", () => {
    const scene = { state, tournament: null, visibility: { hiddenMatches: [], hiddenRounds: [] } };
    const next = applyEvent(scene, {
      type: "focus",
      highlightedPlayerId: 7,
      modal: { kind: "player", playerId: 7 },
      revision: 3,
    });

    expect(next?.state.highlightedPlayerId).toBe(7);
    expect(next?.state.modal).toEqual({ kind: "player", playerId: 7 });
    expect(next?.state.revision).toBe(3);
  });
});
