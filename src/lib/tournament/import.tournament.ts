import { api } from "@/api/index.api";
import { CHALLONGE_MODULE_THEME } from "@/configs/api.config";
import { CHALLONGE_DOMAIN, isChallongeHost } from "@/configs/tournament.config";
import type {
  ImportInput,
  ImportStageHandler,
  TournamentSnapshot,
  TournamentSnapshotWrite,
} from "@/types/tournament";
import { TournamentParser } from "./parse.tournament";
import { canonicalSlug, splitTournamentKey } from "./slug.tournament";
import { attemptSync } from "@hullperse/hp_utils/attempt";

/** Keeps the tournament subdomain when building the module URL. */
const sourceHost = (sourceUrl: string): string => {
  const [url] = attemptSync(() => new URL(sourceUrl.trim()));
  return url && isChallongeHost(url.hostname) ? url.hostname.toLowerCase() : CHALLONGE_DOMAIN;
};

/** Builds the Challonge module URL for an already canonical slug. */
const buildModuleUrl = (sourceUrl: string, slug: string): string => {
  return `https://${sourceHost(sourceUrl)}/${slug}/module?theme=${CHALLONGE_MODULE_THEME}`;
};

/** Downloads the module page and wraps the HTML into a parser. */
const fetchParser = async (
  sourceUrl: string,
  onStage?: ImportStageHandler,
): Promise<TournamentParser> => {
  const slug = canonicalSlug(sourceUrl);
  onStage?.("fetch");

  const html = await api.challonge.getModuleHtml(buildModuleUrl(sourceUrl, slug));
  onStage?.("parse");

  return new TournamentParser(html, sourceUrl);
};

/** Picks the parser source: pasted HTML is parsed as is, otherwise it is fetched. */
const buildParser = async (
  { url, html }: ImportInput,
  onStage?: ImportStageHandler,
): Promise<TournamentParser> => {
  if (html.trim().length === 0) return fetchParser(url, onStage);

  onStage?.("parse");
  return new TournamentParser(html, url);
};

/** Parses pasted HTML or fetches the module page without saving it. */
export const parseTournament = async (
  input: ImportInput,
  onStage?: ImportStageHandler,
): Promise<TournamentSnapshotWrite> => {
  const parser = await buildParser(input, onStage);
  return parser.toSnapshot();
};

/** Fetches the latest module page for a slug and saves the updated snapshot. */
const refreshTournamentSource = async (
  sourceUrl: string,
  onStage?: ImportStageHandler,
): Promise<TournamentSnapshot> => {
  const parser = await fetchParser(sourceUrl, onStage);
  onStage?.("save");

  return api.tournaments.save(parser.toSnapshot());
};

export const refreshTournamentByKey = (
  key: string,
  onStage?: ImportStageHandler,
): Promise<TournamentSnapshot> => {
  const parts = splitTournamentKey(key);
  if (!parts) throw new Error("Некорректный идентификатор турнира");

  return refreshTournamentSource(`https://${parts.host}/${parts.slug}`, onStage);
};

/** Refreshes from the stored source URL so subdomain tournaments keep their host. */
export const refreshTournament = (snapshot: TournamentSnapshot): Promise<TournamentSnapshot> => {
  return refreshTournamentSource(snapshot.sourceUrl);
};
