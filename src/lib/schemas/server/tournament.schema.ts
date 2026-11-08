import {
  MAX_HIDDEN_MATCHES,
  MAX_HIDDEN_ROUNDS,
  MAX_MATCHES,
  MAX_NAME_LENGTH,
  MAX_PARTICIPANTS,
  MAX_ROUNDS,
  MAX_SLUG_LENGTH,
  MAX_SOURCE_URL_LENGTH,
  MAX_STATE_LENGTH,
  MAX_TOURNAMENT_TYPE_LENGTH,
  SLUG,
} from "@/configs/server/validation.config";
import {
  snapshotMatchSchema,
  snapshotPlayerSchema,
  snapshotRoundSchema,
  snapshotSchema,
  visibilityShape,
} from "@/lib/schemas/tournament-snapshot.schema";
import { canonicalSlug, isChallongeUrl } from "@/lib/tournament/slug.tournament";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import { z } from "zod";

export { snapshotSchema };

export const visibilitySchema = z.object({
  hiddenMatches: visibilityShape.hiddenMatches.max(
    MAX_HIDDEN_MATCHES,
    `Expected at most ${MAX_HIDDEN_MATCHES} identifiers`,
  ),
  hiddenRounds: visibilityShape.hiddenRounds.max(
    MAX_HIDDEN_ROUNDS,
    `Expected at most ${MAX_HIDDEN_ROUNDS} identifiers`,
  ),
});

const sourceMatchesSlug = (snapshot: { slug: string; sourceUrl: string }): boolean => {
  const [slug, error] = attemptSync(() => canonicalSlug(snapshot.sourceUrl));

  return !error && isChallongeUrl(snapshot.sourceUrl) && slug === snapshot.slug;
};

/** Strict shape accepted when writing a snapshot to the server. */
export const snapshotWriteSchema = snapshotSchema
  .extend({
    slug: z.string().min(1).max(MAX_SLUG_LENGTH).regex(SLUG),
    sourceUrl: z.string().url().max(MAX_SOURCE_URL_LENGTH),
    name: z.string().trim().min(1).max(MAX_NAME_LENGTH),
    tournamentId: z.number().int().positive(),
    tournamentType: z.string().trim().min(1).max(MAX_TOURNAMENT_TYPE_LENGTH),
    state: z.string().trim().min(1).max(MAX_STATE_LENGTH),
    participants: z.array(snapshotPlayerSchema).max(MAX_PARTICIPANTS),
    rounds: z.array(snapshotRoundSchema).max(MAX_ROUNDS),
    matches: z.array(snapshotMatchSchema).max(MAX_MATCHES),
  })
  .superRefine((snapshot, ctx) => {
    if (!sourceMatchesSlug(snapshot)) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "sourceUrl must be a Challonge URL for the same slug",
      });
    }

    const isFallbackName = snapshot.name === `Challonge ${snapshot.slug}`;
    if (isFallbackName && snapshot.matches.length === 0 && snapshot.participants.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: "Snapshot does not look like a tournament",
      });
    }
  });
