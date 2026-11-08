import type { DatabaseClient } from "../db/client.db";
import ChallongeService from "./challonge.service";
import OverlayService from "./overlay.service";
import StaticService from "./static.service";
import TournamentService from "./tournament.service";

/** Creates the service graph for one database connection. */
export const createServices = (database: DatabaseClient) => {
  const tournaments = new TournamentService(database);
  const overlay = new OverlayService(tournaments, database);
  const challonge = new ChallongeService();
  const staticFiles = new StaticService();

  return {
    tournaments,
    overlay,
    challonge,
    staticFiles,
  };
};
