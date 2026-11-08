import { afterAll, describe, expect, test } from "bun:test";
import type { OverlayEvent } from "@/types/overlay";
import type { Match, TournamentSnapshot } from "@/types/tournament";
import { Application } from "../app.server";
import { createDatabase } from "../db/client.db";
import OverlayService from "../services/overlay.service";
import TournamentService from "../services/tournament.service";

const database = createDatabase(":memory:");
const application = new Application(database);
const app = application.create();
const ORIGIN = "http://127.0.0.1:8787";

afterAll(() => {
  application.close();
  database.close();
});

const match = (id: number, round: number): Match => ({
  id,
  identifier: id,
  rawIdentifier: null,
  round,
  side: round > 0 ? "winners" : "losers",
  order: id,
  state: "pending",
  player1: null,
  player2: null,
  placeholder1: null,
  placeholder2: null,
  score1: null,
  score2: null,
  winnerId: null,
  loserId: null,
  scheduledTime: null,
  station: null,
  prereq1: null,
  prereq2: null,
  prereq1IsLoser: false,
  prereq2IsLoser: false,
  md5: null,
});

const snapshot = (slug: string, name = `Tournament ${slug}`): TournamentSnapshot => ({
  version: 1,
  tournamentId: 1,
  sourceUrl: `https://challonge.com/${slug}`,
  slug,
  name,
  tournamentType: "double elimination",
  state: "pending",
  participants: [],
  fetchedAt: 1,
  hideSeeds: false,
  hideIdentifiers: false,
  rounds: [
    { number: 1, title: "Round 1", side: "winners", order: 1 },
    { number: -1, title: "Losers Round 1", side: "losers", order: 1 },
  ],
  matches: [match(1, 1), match(3, -1)],
});

const request = (path: string, init?: RequestInit): Promise<Response> =>
  app.handle(new Request(`${ORIGIN}${path}`, init));

const putJson = (path: string, body: unknown): Promise<Response> =>
  request(path, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });

const createTournament = async (slug: string, name?: string): Promise<void> => {
  const response = await putJson(`/api/tournaments/${slug}`, snapshot(slug, name));
  expect(response.status).toBe(200);
};

const createEventReader = (
  reader: ReadableStreamDefaultReader<Uint8Array>,
): (() => Promise<OverlayEvent>) => {
  const decoder = new TextDecoder();
  let buffer = "";

  const nextFrame = async (): Promise<string> => {
    for (;;) {
      const boundary = buffer.indexOf("\n\n");
      if (boundary >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        return frame;
      }

      const { done, value } = await reader.read();
      if (done) throw new Error("Overlay stream ended before the next event");
      buffer += decoder.decode(value, { stream: true });
    }
  };

  return async () => {
    for (;;) {
      const frame = await nextFrame();
      const data = frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");

      if (data) return JSON.parse(data) as OverlayEvent;
    }
  };
};

describe("overlay sync", () => {
  test("streams the full sync and every display update", async () => {
    await createTournament("overlay-live");

    const response = await request("/api/overlay/events");
    expect(response.headers.get("content-type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Overlay response has no body");
    const nextEvent = createEventReader(reader);

    const sync = await nextEvent();
    expect(sync.type).toBe("sync");
    if (sync.type !== "sync") throw new Error("Expected sync event");
    expect(sync.state.activeSlug).toBeNull();
    expect(sync.state.pointer.visible).toBe(false);
    expect(sync.state.pointer.cursor).toBe("default");
    expect(sync.state.pointerSize).toBe(48);
    expect(sync.tournament).toBeNull();

    const stateResponse = await putJson("/api/overlay/state", {
      activeSlug: "overlay-live",
      view: { zoom: 1.2, centerX: 0.4, centerY: 0.6 },
    });
    expect(stateResponse.status).toBe(200);

    const state = await nextEvent();
    expect(state.type).toBe("state");
    if (state.type !== "state") throw new Error("Expected state event");
    expect(state.state.activeSlug).toBe("overlay-live");
    expect(state.state.view).toEqual({ zoom: 1.2, centerX: 0.4, centerY: 0.6 });
    expect(state.tournament?.slug).toBe("overlay-live");
    expect(state.visibility).toEqual({ hiddenMatches: [], hiddenRounds: [] });

    await putJson("/api/overlay/state", {
      activeSlug: "overlay-live",
      view: { zoom: 1.4, centerX: 0.45, centerY: 0.55 },
    });

    const view = await nextEvent();
    expect(view.type).toBe("state");
    if (view.type !== "state") throw new Error("Expected state event");
    expect(view.state.view.zoom).toBe(1.4);
    expect("tournament" in view).toBe(false);

    const pointerResponse = await putJson("/api/overlay/pointer", {
      x: 0.25,
      y: 0.75,
      visible: true,
      cursor: "link",
    });
    expect(pointerResponse.status).toBe(200);

    const pointer = await nextEvent();
    expect(pointer.type).toBe("pointer");
    if (pointer.type !== "pointer") throw new Error("Expected pointer event");
    expect(pointer.pointer).toEqual({ x: 0.25, y: 0.75, visible: true, cursor: "link" });

    await putJson("/api/tournaments/overlay-live/visibility", {
      hiddenMatches: [1],
      hiddenRounds: [],
    });

    const visibility = await nextEvent();
    expect(visibility.type).toBe("visibility");
    if (visibility.type !== "visibility") throw new Error("Expected visibility event");
    expect(visibility.visibility).toEqual({
      hiddenMatches: [1],
      hiddenRounds: [],
    });

    await createTournament("overlay-live", "Overlay live updated");

    const tournament = await nextEvent();
    expect(tournament.type).toBe("tournament");
    if (tournament.type !== "tournament") throw new Error("Expected tournament event");
    expect(tournament.tournament.name).toBe("Overlay live updated");

    await request("/api/tournaments/overlay-live", { method: "DELETE" });

    const removed = await nextEvent();
    expect(removed.type).toBe("state");
    if (removed.type !== "state") throw new Error("Expected state event");
    expect(removed.state.activeSlug).toBeNull();
    expect(removed.tournament).toBeNull();

    await reader.cancel();
  });

  test("returns the current state and rejects bad display input", async () => {
    await createTournament("overlay-state");
    await putJson("/api/overlay/state", {
      activeSlug: "overlay-state",
      view: { zoom: 1, centerX: 0.5, centerY: 0.5 },
    });

    const current = await request("/api/overlay/state");
    expect(current.status).toBe(200);
    expect(await current.json()).toMatchObject({
      activeSlug: "overlay-state",
      pointer: { visible: false },
      modules: { camera: true, pointer: true, background: true, scores: true },
    });

    const modules = await putJson("/api/overlay/modules", {
      pointer: false,
      scores: false,
    });
    expect(modules.status).toBe(200);
    expect(await modules.json()).toMatchObject({
      modules: { pointer: false, scores: false },
    });

    await putJson("/api/overlay/pointer", { x: 0.2, y: 0.3, visible: true });
    const afterPointer = await request("/api/overlay/state");
    expect(await afterPointer.json()).toMatchObject({
      pointer: { x: 0.5, y: 0.5, visible: false },
    });

    const badModules = await putJson("/api/overlay/modules", {
      pointer: "yes",
    });
    expect(badModules.status).toBe(400);

    const missing = await putJson("/api/overlay/state", {
      activeSlug: "missing-overlay",
      view: { zoom: 1, centerX: 0.5, centerY: 0.5 },
    });
    expect(missing.status).toBe(404);

    const badSlug = await putJson("/api/overlay/state", {
      activeSlug: "../escape",
      view: { zoom: 1, centerX: 0.5, centerY: 0.5 },
    });
    expect(badSlug.status).toBe(400);

    const badPointer = await putJson("/api/overlay/pointer", {
      x: 2,
      y: 0.5,
      visible: true,
    });
    expect(badPointer.status).toBe(400);

    const badCursor = await putJson("/api/overlay/pointer", {
      x: 0.5,
      y: 0.5,
      visible: true,
      cursor: "crosshair",
    });
    expect(badCursor.status).toBe(400);

    const pointerSize = await putJson("/api/overlay/pointer-size", {
      pointerSize: 56,
    });
    expect(pointerSize.status).toBe(200);
    expect(await pointerSize.json()).toMatchObject({ pointerSize: 56 });

    const badPointerSize = await putJson("/api/overlay/pointer-size", {
      pointerSize: 100,
    });
    expect(badPointerSize.status).toBe(400);

    expect((await request("/api/overlay/state", { method: "POST" })).status).toBe(405);
  });

  test("keeps the overlay background off when another module changes", async () => {
    await createTournament("overlay-background");

    const off = await putJson("/api/overlay/modules", { background: false });
    expect(off.status).toBe(200);
    expect(await off.json()).toMatchObject({ modules: { background: false } });

    const other = await putJson("/api/overlay/modules", { pointer: false });
    expect(other.status).toBe(200);
    expect(await other.json()).toMatchObject({
      modules: { background: false, pointer: false },
    });

    const state = await request("/api/overlay/state");
    expect(await state.json()).toMatchObject({ modules: { background: false } });
  });

  test("gates camera and pointer updates and publishes module changes", async () => {
    await createTournament("overlay-gates");

    const initialView = { zoom: 1.1, centerX: 0.45, centerY: 0.55 };
    const gatedView = { zoom: 1.7, centerX: 0.3, centerY: 0.7 };
    const cursor = { x: 0.2, y: 0.8, visible: true, cursor: "link" } as const;

    await putJson("/api/overlay/state", {
      activeSlug: "overlay-gates",
      view: initialView,
    });
    await putJson("/api/overlay/modules", {
      camera: true,
      pointer: true,
      scores: true,
    });

    const response = await request("/api/overlay/events");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Overlay response has no body");
    const nextEvent = createEventReader(reader);

    const sync = await nextEvent();
    expect(sync.type).toBe("sync");
    if (sync.type !== "sync") throw new Error("Expected sync event");
    expect(sync.state.activeSlug).toBe("overlay-gates");
    expect(sync.state.view).toEqual(initialView);
    expect(sync.state.modules).toMatchObject({ camera: true, pointer: true, scores: true });

    await putJson("/api/overlay/pointer", cursor);
    const pointer = await nextEvent();
    expect(pointer.type).toBe("pointer");
    if (pointer.type !== "pointer") throw new Error("Expected pointer event");
    expect(pointer.pointer).toEqual(cursor);

    await putJson("/api/overlay/modules", { pointer: false });
    const pointerOff = await nextEvent();
    expect(pointerOff.type).toBe("modules");
    if (pointerOff.type !== "modules") throw new Error("Expected modules event");
    expect(pointerOff.modules.pointer).toBe(false);
    expect(pointerOff.pointer).toEqual({ ...cursor, visible: false });
    expect(pointerOff.view).toEqual(initialView);
    expect(pointerOff.revision).toBeGreaterThan(pointer.revision);

    await putJson("/api/overlay/pointer", { x: 0.9, y: 0.1, visible: true });

    await putJson("/api/overlay/modules", { scores: false });
    const scoresOff = await nextEvent();
    expect(scoresOff.type).toBe("modules");
    if (scoresOff.type !== "modules") throw new Error("Expected modules event");
    expect(scoresOff.modules).toMatchObject({ pointer: false, scores: false });
    expect(scoresOff.pointer).toEqual({ ...cursor, visible: false });
    expect(scoresOff.view).toEqual(initialView);

    const afterIgnoredPointer = await request("/api/overlay/state");
    expect(await afterIgnoredPointer.json()).toMatchObject({
      pointer: { ...cursor, visible: false },
    });

    await putJson("/api/overlay/modules", { camera: false });
    const cameraOff = await nextEvent();
    expect(cameraOff.type).toBe("modules");
    if (cameraOff.type !== "modules") throw new Error("Expected modules event");
    expect(cameraOff.modules.camera).toBe(false);
    expect(cameraOff.view).toEqual(initialView);

    const viewResponse = await putJson("/api/overlay/state", {
      activeSlug: "overlay-gates",
      view: gatedView,
    });
    expect(viewResponse.status).toBe(200);

    const stored = await request("/api/overlay/state");
    expect(await stored.json()).toMatchObject({ view: gatedView });

    await putJson("/api/overlay/modules", { camera: true });
    const cameraOn = await nextEvent();
    expect(cameraOn.type).toBe("modules");
    if (cameraOn.type !== "modules") throw new Error("Expected modules event");
    expect(cameraOn.modules.camera).toBe(true);
    expect(cameraOn.view).toEqual(gatedView);

    await putJson("/api/overlay/state", {
      activeSlug: "overlay-gates",
      view: { zoom: 1.2, centerX: 0.5, centerY: 0.5 },
    });
    const view = await nextEvent();
    expect(view.type).toBe("state");
    if (view.type !== "state") throw new Error("Expected state event");
    expect(view.state.view).toEqual({ zoom: 1.2, centerX: 0.5, centerY: 0.5 });

    await reader.cancel();
  });

  test("restores overlay state from SQLite", () => {
    const localDatabase = createDatabase(":memory:");
    const tournaments = new TournamentService(localDatabase);
    tournaments.save(snapshot("persisted-overlay"));

    const first = new OverlayService(tournaments, localDatabase);
    first.setView({
      activeSlug: "persisted-overlay",
      view: { zoom: 1.6, centerX: 0.3, centerY: 0.7 },
    });
    first.setModules({ scores: false, completedDim: false });
    first.setPointerSize({ pointerSize: 56 });
    first.setPointer({ x: 0.2, y: 0.8, visible: true, cursor: "link" });

    const expected = first.getState();
    const restored = new OverlayService(new TournamentService(localDatabase), localDatabase);
    const actual = restored.getState();

    expect(actual.activeSlug).toBe(expected.activeSlug);
    expect(actual.view).toEqual(expected.view);
    expect(actual.modules).toEqual(expected.modules);
    expect(actual.pointerSize).toBe(56);
    expect(actual.pointer).toEqual({ x: 0.5, y: 0.5, visible: false, cursor: "default" });
    expect(actual.highlightedPlayerId).toBeNull();
    expect(actual.modal).toBeNull();

    first.close();
    restored.close();
    localDatabase.close();
  });
});
