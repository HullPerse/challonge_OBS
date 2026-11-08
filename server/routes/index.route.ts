import type { AppServices } from "@/types/server/services";
import { Elysia } from "elysia";
import ChallongeRoutes from "./challonge.route";
import OverlayRoutes from "./overlay.route";
import TournamentRoutes from "./tournaments.route";

export const createApiRoutes = (services: AppServices) => {
  return new Elysia()
    .use(
      new TournamentRoutes(services.tournaments, {
        onDeleted: (slug) => {
          services.overlay.removeTournament(slug);
        },
        onSaved: (snapshot) => {
          services.overlay.updateTournament(snapshot);
        },
        onVisibilitySaved: (slug, visibility) => {
          services.overlay.updateVisibility(slug, visibility);
        },
      }).plugin(),
    )
    .use(new OverlayRoutes(services.overlay).plugin())
    .use(new ChallongeRoutes(services.challonge).plugin());
};
