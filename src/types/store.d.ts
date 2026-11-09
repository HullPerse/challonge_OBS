import type { TournamentVisibility } from "@/types/tournament";

type VisibilityVariables = {
  key: string;
  visibility: TournamentVisibility;
};

export type PendingVisibility = VisibilityVariables & {
  previous: TournamentVisibility;
};
