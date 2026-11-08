import type { TournamentSnapshot, TournamentVisibility } from "@/types/tournament";

export type TournamentRoutesOptions = {
  onSaved?: (snapshot: TournamentSnapshot) => void;
  onVisibilitySaved?: (slug: string, visibility: TournamentVisibility) => void;
  onDeleted?: (slug: string) => void;
};
