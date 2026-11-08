import type ChallongeService from "../../../server/services/challonge.service";
import type OverlayService from "../../../server/services/overlay.service";
import type StaticService from "../../../server/services/static.service";
import type TournamentService from "../../../server/services/tournament.service";

export type AppServices = {
  tournaments: TournamentService;
  overlay: OverlayService;
  challonge: ChallongeService;
  staticFiles: StaticService;
};
