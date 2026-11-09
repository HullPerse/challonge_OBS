import { MAX_GROUPS } from "@/configs/server/validation.config";
import { z } from "zod";

export const snapshotPlayerSchema = z.object({
  id: z.number().int(),
  seed: z.number().int(),
  name: z.string(),
  avatar: z.string().nullable(),
});

export const snapshotRoundSchema = z.object({
  number: z.number().int(),
  title: z.string(),
  side: z.enum(["winners", "losers"]),
  order: z.number().int(),
});

export const snapshotEntrantSchema = snapshotPlayerSchema.extend({
  score: z.number().nullable(),
  rank: z.number().int().nullable(),
});

export const snapshotMatchSchema = z.object({
  id: z.number().int(),
  identifier: z.number().int().nullable(),
  rawIdentifier: z.string().nullable(),
  round: z.number().int(),
  side: z.enum(["winners", "losers", "finals"]),
  order: z.number().int(),
  state: z.string(),
  player1: snapshotPlayerSchema.nullable(),
  player2: snapshotPlayerSchema.nullable(),
  entrants: z.array(snapshotEntrantSchema).optional(),
  group: z.string().optional(),
  placeholder1: z.string().nullable(),
  placeholder2: z.string().nullable(),
  score1: z.number().nullable(),
  score2: z.number().nullable(),
  winnerId: z.number().int().nullable(),
  loserId: z.number().int().nullable(),
  scheduledTime: z.string().nullable(),
  station: z.string().nullable(),
  prereq1: z.number().int().nullable(),
  prereq2: z.number().int().nullable(),
  prereq1IsLoser: z.boolean(),
  prereq2IsLoser: z.boolean(),
  md5: z.string().nullable(),
});

/** A nested group-stage bracket. */
export const snapshotGroupSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  matches: z.array(snapshotMatchSchema),
});

/** Lenient shape used when reading snapshots saved by older app versions. */
export const snapshotSchema = z.object({
  version: z.literal(1),
  key: z.string().min(1),
  tournamentId: z.number().int().positive().optional(),
  sourceUrl: z.string().min(1),
  slug: z.string().min(1),
  name: z.string(),
  tournamentType: z.string(),
  state: z.string(),
  participants: z.array(snapshotPlayerSchema),
  fetchedAt: z.number(),
  hideSeeds: z.boolean(),
  hideIdentifiers: z.boolean(),
  rounds: z.array(snapshotRoundSchema),
  matches: z.array(snapshotMatchSchema),
  groups: z.array(snapshotGroupSchema).max(MAX_GROUPS).optional(),
});

export const tournamentSummarySchema = z.object({
  key: z.string(),
  slug: z.string(),
  host: z.string(),
  name: z.string(),
  tournamentType: z.string(),
  fetchedAt: z.number(),
  matchCount: z.number().int(),
  updatedAt: z.number(),
});

export const tournamentSummaryListSchema = z.array(tournamentSummarySchema);

export const visibilityShape = {
  hiddenMatches: z.array(z.number().int()),
  hiddenRounds: z.array(z.number().int()),
};

export const tournamentVisibilitySchema = z.object(visibilityShape);
