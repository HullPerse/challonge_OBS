import type { TournamentSnapshot } from "@/types/tournament";

export type CachedSnapshot = {
  snapshot: TournamentSnapshot;
  matchIds: Set<number>;
  roundNumbers: Set<number>;
};
