import type { TournamentVisibility } from "@/types/tournament";

type VisibilityVariables = {
  slug: string;
  visibility: TournamentVisibility;
};

export type PendingVisibility = VisibilityVariables & {
  previous: TournamentVisibility;
};
