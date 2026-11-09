import z from "zod";

export const rawPlayerSchema = z
  .object({
    id: z.number(),
    seed: z.number().nullish(),
    display_name: z.string(),
    portrait_url: z.string().nullish(),
  })
  .loose();

const rawEntrantSchema = rawPlayerSchema.extend({
  scores: z.array(z.number()).nullish(),
  final_rank: z.number().nullish(),
});

const rawStationSchema = z
  .object({
    id: z.number().nullish(),
    name: z.string().nullish(),
  })
  .loose();

export const rawMatchSchema = z
  .object({
    id: z.number().nullish(),
    identifier: z.number().nullish(),
    raw_identifier: z.string().nullish(),
    round: z.number(),
    state: z.string(),
    scheduled_time: z.string().nullish(),
    station: z.union([z.string(), z.number(), rawStationSchema]).nullish(),
    player1: rawPlayerSchema.nullish(),
    player2: rawPlayerSchema.nullish(),
    participants: z.array(rawEntrantSchema).nullish(),
    player1_prereq_identifier: z.number().nullish(),
    player2_prereq_identifier: z.number().nullish(),
    player1_is_prereq_match_loser: z.boolean().nullish(),
    player2_is_prereq_match_loser: z.boolean().nullish(),
    player1_placeholder_text: z.string().nullish(),
    player2_placeholder_text: z.string().nullish(),
    scores: z.array(z.number()).nullish(),
    winner_id: z.number().nullish(),
    loser_id: z.number().nullish(),
    md5: z.string().nullish(),
  })
  .loose();

const rawRoundSchema = z
  .object({
    number: z.number(),
    title: z.string(),
  })
  .loose();

const rawTournamentSchema = z
  .object({
    id: z.number().int().positive(),
    state: z.string(),
    tournament_type: z.string(),
    hide_seeds: z.boolean().nullish(),
    hide_identifiers: z.boolean().nullish(),
    show_station_and_time: z.boolean().nullish(),
  })
  .loose();

const rawGroupSchema = z
  .object({
    name: z.string().nullish(),
    tournament: rawTournamentSchema.nullish(),
    rounds: z.array(rawRoundSchema).nullish(),
    matches_by_round: z.record(z.string(), z.array(rawMatchSchema)).default({}),
    participants: z.array(rawPlayerSchema).nullish(),
    scorecard_html: z.string().nullish(),
  })
  .loose();

export const rawStoreSchema = z
  .object({
    tournament: rawTournamentSchema,
    rounds: z.array(rawRoundSchema),
    matches_by_round: z.record(z.string(), z.array(rawMatchSchema)),
    participants: z.array(rawPlayerSchema).nullish(),
    groups: z.array(rawGroupSchema).nullish(),
  })
  .loose();
