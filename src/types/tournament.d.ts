import type z from "zod";
import type {
  rawMatchSchema,
  rawPlayerSchema,
  rawStoreSchema,
} from "@/lib/schemas/tournament.schema";

type BracketSide = "winners" | "losers" | "finals";

export type RoundSide = "winners" | "losers";

export type Player = {
  id: number;
  seed: number;
  name: string;
  avatar: string | null;
};

/** Resolved active-tournament selection; each state carries only its own data. */
export type SelectionState =
  | { status: "loading" }
  | { status: "selecting"; targetSlug: string }
  | { status: "ready"; slug: string | null }
  | { status: "failed" };

export type Match = {
  id: number;
  identifier: number | null;
  rawIdentifier: string | null;
  round: number;
  side: BracketSide;
  order: number;
  state: string;
  player1: Player | null;
  player2: Player | null;
  placeholder1: string | null;
  placeholder2: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
  loserId: number | null;
  scheduledTime: string | null;
  station: string | null;
  prereq1: number | null;
  prereq2: number | null;
  prereq1IsLoser: boolean;
  prereq2IsLoser: boolean;
  md5: string | null;
};

export type Round = {
  number: number;
  title: string;
  side: RoundSide;
  order: number;
};

export type TournamentSnapshot = {
  version: 1;
  /** Challonge tournament id; absent in snapshots saved before this field existed. */
  tournamentId?: number;
  sourceUrl: string;
  slug: string;
  name: string;
  tournamentType: string;
  state: string;
  participants: Player[];
  fetchedAt: number;
  hideSeeds: boolean;
  hideIdentifiers: boolean;
  rounds: Round[];
  matches: Match[];
};

/** Snapshot shape accepted by the server; `tournamentId` is required on write. */
export type TournamentSnapshotWrite = TournamentSnapshot & { tournamentId: number };

export type TournamentVisibility = {
  hiddenMatches: number[];
  hiddenRounds: number[];
};

export type TournamentSummary = {
  slug: string;
  name: string;
  tournamentType: string;
  fetchedAt: number;
  matchCount: number;
  updatedAt: number;
};

export type ImportInput = {
  url: string;
  html: string;
};

export type MatchIdentity = Pick<
  Match,
  "id" | "identifier" | "rawIdentifier" | "round" | "side" | "order" | "state"
>;

export type MatchParticipants = Pick<
  Match,
  | "player1"
  | "player2"
  | "placeholder1"
  | "placeholder2"
  | "score1"
  | "score2"
  | "winnerId"
  | "loserId"
>;

export type MatchMetadata = Pick<
  Match,
  "scheduledTime" | "station" | "prereq1" | "prereq2" | "prereq1IsLoser" | "prereq2IsLoser" | "md5"
>;

export type ImportStage = "fetch" | "parse" | "save";

export type ImportStageHandler = (stage: ImportStage) => void;

export type RawPlayer = z.infer<typeof rawPlayerSchema>;
export type RawMatch = z.infer<typeof rawMatchSchema>;
export type RawStore = z.infer<typeof rawStoreSchema>;
