import HttpApi from "@/lib/http.utils";
import ChallongeApi from "./challonge.api";
import HealthApi from "./health.api";
import OverlayApi from "./overlay.api";
import TournamentApi from "./tournament.api";

const http = new HttpApi();

export const api = {
  tournaments: new TournamentApi(http),
  challonge: new ChallongeApi(http),
  overlay: new OverlayApi(http),
  health: new HealthApi(http),
};
