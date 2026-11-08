import type { OverlayModules, OverlayPointer, OverlayView } from "@/types/overlay";
import type { Match, Player, Round, TournamentSnapshot } from "@/types/tournament";

export type BracketPoint = {
  x: number;
  y: number;
};

export type BracketSize = {
  width: number;
  height: number;
};

export type BracketCamera = {
  zoom: number;
  pan: BracketPoint;
};

export type BracketCameraOptions = {
  snapshot: TournamentSnapshot | null;
  sceneView?: OverlayView;
  onViewChange?: (view: OverlayView) => void;
  onPointerChange?: (pointer: OverlayPointer) => void;
};

export type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  panX: number;
  panY: number;
};

/** Presentational switches shared by the control panel and the overlay. */
export type MatchCardView = Pick<
  OverlayModules,
  "seeds" | "avatars" | "scores" | "matchNumbers" | "schedule" | "stations" | "completedDim"
>;

/** Match-detail fields shared by the control panel and the overlay. */
export type MatchDialogView = Pick<
  OverlayModules,
  "seeds" | "avatars" | "scores" | "matchNumbers" | "schedule" | "stations"
>;

export type PlayerHistoryView = Pick<MatchDialogView, "avatars" | "scores" | "matchNumbers">;

export type PlacedMatch = {
  match: Match;
  x: number;
  y: number;
};

export type RawPlacement = {
  match: Match;
  x: number;
  y: number;
};

export type Connector = {
  id: string;
  d: string;
  fromIds: number[];
  fromRounds: number[];
  toId: number;
  toRound: number;
};

export type BracketSection = {
  side: "winners" | "losers" | "finals";
  top: number;
  height: number;
  width: number;
  rounds: Round[];
  matches: PlacedMatch[];
};

export type BracketLayout = {
  width: number;
  height: number;
  sections: BracketSection[];
  connectors: Connector[];
};

export type SectionSide = Round["side"];

export type SectionMatches = {
  winners: Match[];
  losers: Match[];
  finals: Match[];
};

export type BracketResult = {
  winner: Player;
  loser: Player | null;
  score: string;
};

export type HiddenIds = {
  hiddenMatches: ReadonlySet<number>;
  hiddenRounds: ReadonlySet<number>;
};
