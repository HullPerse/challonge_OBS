import type { TournamentSnapshot, TournamentVisibility } from "@/types/tournament";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import ValidationUtils from "@/lib/server/validation.utils";

/** Helpers for the hidden matches/rounds visibility state. */
export default class VisibilityUtils {
  /** Deduplicates and sorts ids ascending. */
  static normalizeIds(ids: number[]): number[] {
    return [...new Set(ids)].sort((a, b) => a - b);
  }

  /** Parses a stored JSON id list, ignoring invalid values. */
  static parseIds(raw: string): number[] {
    const [data, error] = attemptSync<unknown>(() => JSON.parse(raw));
    if (error || !Array.isArray(data)) return [];

    return VisibilityUtils.normalizeIds(
      data.filter((value) => ValidationUtils.isSafeInteger(value)),
    );
  }

  static normalize(visibility: TournamentVisibility): TournamentVisibility {
    return {
      hiddenMatches: VisibilityUtils.normalizeIds(visibility.hiddenMatches),
      hiddenRounds: VisibilityUtils.normalizeIds(visibility.hiddenRounds),
    };
  }

  /** Returns a shallow copy of the visibility state. */
  static clone(visibility: TournamentVisibility): TournamentVisibility {
    return {
      hiddenMatches: [...visibility.hiddenMatches],
      hiddenRounds: [...visibility.hiddenRounds],
    };
  }

  static empty(): TournamentVisibility {
    return { hiddenMatches: [], hiddenRounds: [] };
  }

  static prune(
    visibility: TournamentVisibility,
    snapshot: TournamentSnapshot,
  ): TournamentVisibility {
    return VisibilityUtils.pruneIds(
      visibility,
      new Set(snapshot.matches.map(({ id }) => id)),
      new Set(snapshot.rounds.map(({ number }) => number)),
    );
  }

  /** Drops ids against already-built snapshot id sets. */
  static pruneIds(
    visibility: TournamentVisibility,
    matchIds: ReadonlySet<number>,
    roundNumbers: ReadonlySet<number>,
  ): TournamentVisibility {
    return {
      hiddenMatches: visibility.hiddenMatches.filter((id) => matchIds.has(id)),
      hiddenRounds: visibility.hiddenRounds.filter((round) => roundNumbers.has(round)),
    };
  }
}
