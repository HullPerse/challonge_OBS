import { afterAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { snapshotSchema } from "@/lib/schemas/server/tournament.schema";
import type { Match, TournamentSnapshot } from "@/types/tournament";
import { createApp } from "../app.server";
import { createDatabase } from "../db/client.db";
import { tournaments, tournamentVisibility } from "../db/schema.db";

const database = createDatabase(":memory:");
const app = createApp(database);
const ORIGIN = "http://127.0.0.1:8787";

afterAll(() => {
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

const snapshot = (slug: string, host = "challonge.com"): TournamentSnapshot => ({
  version: 1,
  key: `${host}/${slug}`,
  tournamentId: 1,
  sourceUrl: `https://${host}/${slug}`,
  slug,
  name: `Tournament ${slug}`,
  tournamentType: "double elimination",
  state: "pending",
  participants: [],
  fetchedAt: 1,
  hideSeeds: false,
  hideIdentifiers: false,
  rounds: [
    { number: 1, title: "Round 1", side: "winners", order: 1 },
    { number: 2, title: "Round 2", side: "winners", order: 2 },
    { number: -1, title: "Losers Round 1", side: "losers", order: 1 },
  ],
  matches: [match(1, 1), match(3, -1)],
});

const request = (path: string, init?: RequestInit): Promise<Response> =>
  app.handle(new Request(`${ORIGIN}${path}`, init));

const putJson = (path: string, body: unknown, headers?: HeadersInit): Promise<Response> => {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("content-type", "application/json");

  return request(path, {
    method: "PUT",
    headers: requestHeaders,
    body: JSON.stringify(body),
  });
};

const createTournament = async (slug: string): Promise<void> => {
  const response = await putJson(`/api/tournaments/challonge.com/${slug}`, snapshot(slug));
  expect(response.status).toBe(200);
};

describe("tournament API", () => {
  test("round-trips a validated snapshot", async () => {
    await createTournament("round-trip");

    const response = await request("/api/tournaments/challonge.com/round-trip");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot("round-trip"));
  });

  test("round-trips nested group-stage matches", async () => {
    const grouped = snapshot("grouped");
    const player = (id: number, name: string) => ({ id, seed: id, name, avatar: null });
    const groupMatch: Match = {
      ...match(10, 1),
      group: "Group A",
      state: "complete",
      player1: player(1, "Alpha"),
      player2: player(2, "Bravo"),
      score1: 2,
      score2: 0,
      winnerId: 1,
    };
    grouped.groups = [{ id: 5, name: "Group A", matches: [groupMatch] }];

    const saved = await putJson("/api/tournaments/challonge.com/grouped", grouped);
    expect(saved.status).toBe(200);

    const response = await request("/api/tournaments/challonge.com/grouped");
    const loaded = snapshotSchema.parse(await response.json());

    expect(loaded.groups).toHaveLength(1);
    expect(loaded.groups?.[0]?.name).toBe("Group A");
    expect(loaded.groups?.[0]?.matches[0]?.group).toBe("Group A");
    expect(loaded.groups?.[0]?.matches[0]?.winnerId).toBe(1);
  });

  test("normalizes and persists visibility", async () => {
    await createTournament("visibility");

    const saved = await putJson("/api/tournaments/challonge.com/visibility/visibility", {
      hiddenMatches: [3, 1, 3],
      hiddenRounds: [-1, 2, -1],
    });

    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({
      hiddenMatches: [1, 3],
      hiddenRounds: [-1, 2],
    });

    const loaded = await request("/api/tournaments/challonge.com/visibility/visibility");

    expect(loaded.status).toBe(200);
    expect(await loaded.json()).toEqual({
      hiddenMatches: [1, 3],
      hiddenRounds: [-1, 2],
    });
  });

  test("drops visibility ids that are not in the snapshot", async () => {
    await createTournament("prune");

    const saved = await putJson("/api/tournaments/challonge.com/prune/visibility", {
      hiddenMatches: [1, 999],
      hiddenRounds: [2, 99],
    });

    expect(await saved.json()).toEqual({
      hiddenMatches: [1],
      hiddenRounds: [2],
    });
  });

  test("rejects malformed visibility and snapshots", async () => {
    await createTournament("validation");

    const badVisibility = await putJson("/api/tournaments/challonge.com/validation/visibility", {
      hiddenMatches: [1, 1.5, "x"],
      hiddenRounds: [],
    });
    expect(badVisibility.status).toBe(400);

    const badSnapshot = await putJson("/api/tournaments/challonge.com/validation", {
      ...snapshot("validation"),
      matches: [{}],
    });
    expect(badSnapshot.status).toBe(400);
  });

  test("keeps tournaments with the same slug on different subdomains", async () => {
    const main = snapshot("same-slug", "challonge.com");
    const cup = snapshot("same-slug", "cup.challonge.com");

    expect((await putJson("/api/tournaments/challonge.com/same-slug", main)).status).toBe(200);
    expect((await putJson("/api/tournaments/cup.challonge.com/same-slug", cup)).status).toBe(200);

    const mainResponse = await request("/api/tournaments/challonge.com/same-slug");
    const cupResponse = await request("/api/tournaments/cup.challonge.com/same-slug");

    expect(snapshotSchema.parse(await mainResponse.json()).name).toBe("Tournament same-slug");
    expect(snapshotSchema.parse(await cupResponse.json()).sourceUrl).toBe(
      "https://cup.challonge.com/same-slug",
    );

    const list = z
      .array(z.object({ key: z.string() }))
      .parse(await (await request("/api/tournaments")).json());
    expect(list.some((item) => item.key === "challonge.com/same-slug")).toBe(true);
    expect(list.some((item) => item.key === "cup.challonge.com/same-slug")).toBe(true);
  });

  test("returns 404 for a missing tournament and its visibility", async () => {
    expect((await request("/api/tournaments/challonge.com/missing")).status).toBe(404);
    expect((await request("/api/tournaments/challonge.com/missing/visibility")).status).toBe(404);
  });

  test("deletes the tournament and its visibility", async () => {
    await createTournament("delete-me");
    await putJson("/api/tournaments/challonge.com/delete-me/visibility", {
      hiddenMatches: [1],
      hiddenRounds: [],
    });

    expect(
      (await request("/api/tournaments/challonge.com/delete-me", { method: "DELETE" })).status,
    ).toBe(200);
    expect((await request("/api/tournaments/challonge.com/delete-me")).status).toBe(404);
    expect((await request("/api/tournaments/challonge.com/delete-me/visibility")).status).toBe(404);
  });

  test("cascades visibility when a tournament row is removed directly", async () => {
    await createTournament("cascade");
    await putJson("/api/tournaments/challonge.com/cascade/visibility", {
      hiddenMatches: [3],
      hiddenRounds: [],
    });

    database.orm.delete(tournaments).where(eq(tournaments.key, "challonge.com/cascade")).run();

    const rows = database.orm
      .select()
      .from(tournamentVisibility)
      .where(eq(tournamentVisibility.key, "challonge.com/cascade"))
      .all();
    expect(rows).toHaveLength(0);
  });

  test("rejects unsupported methods", async () => {
    expect((await request("/api/tournaments", { method: "POST" })).status).toBe(405);
    expect((await request("/api/challonge", { method: "POST" })).status).toBe(405);
  });

  test("rejects malformed JSON with the API error shape", async () => {
    const response = await request("/api/tournaments/challonge.com/malformed", {
      body: "{",
      headers: { "content-type": "application/json" },
      method: "PUT",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body" });
  });
});

describe("health", () => {
  test("reports database availability", async () => {
    const response = await request("/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, db: "up" });
  });
});

describe("request boundary", () => {
  test("rejects a foreign host and origin", async () => {
    const foreignHost = await app.handle(new Request("http://evil.example/api/tournaments"));
    expect(foreignHost.status).toBe(403);

    const foreignOrigin = await putJson(
      "/api/tournaments/challonge.com/round-trip",
      snapshot("round-trip"),
      {
        origin: "http://evil.example",
      },
    );
    expect(foreignOrigin.status).toBe(403);
  });

  test("rejects a proxy target outside Challonge", async () => {
    const response = await request(
      `/api/challonge?url=${encodeURIComponent("https://evil.example/test/module")}`,
    );

    expect(response.status).toBe(403);
  });

  test("rejects a non-module Challonge path", async () => {
    const response = await request(
      `/api/challonge?url=${encodeURIComponent("https://challonge.com/test")}`,
    );

    expect(response.status).toBe(403);
  });

  test("does not serve files outside dist", async () => {
    const response = await request("/%2e%2e%2fpackage.json");

    expect(response.status).toBe(404);
  });

  test("returns 404 for unknown API routes and unsupported non-API methods", async () => {
    expect((await request("/api/nope")).status).toBe(404);
    expect((await request("/missing", { method: "POST" })).status).toBe(404);
  });
});
