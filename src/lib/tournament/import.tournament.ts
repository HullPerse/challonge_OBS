import { api } from "@/api/index.api";
import { CHALLONGE_MODULE_THEME } from "@/configs/api.config";
import type {
  ImportInput,
  ImportStageHandler,
  TournamentSnapshot,
  TournamentSnapshotWrite,
} from "@/types/tournament";
import { TournamentParser } from "./parse.tournament";
import { canonicalSlug } from "./slug.tournament";


/** Builds the Challonge module URL for an already canonical slug. */
const buildModuleUrl = (slug: string): string => {
  return `https://challonge.com/${slug}/module?theme=${CHALLONGE_MODULE_THEME}`;
};

/** Downloads the module page and wraps the HTML into a parser. */
const fetchParser = async (
  sourceUrl: string,
  onStage?: ImportStageHandler,
): Promise<TournamentParser> => {
  const slug = canonicalSlug(sourceUrl);
  onStage?.("fetch");

  const html = await api.challonge.getModuleHtml(buildModuleUrl(slug));
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
export const refreshTournamentBySlug = async (
  slug: string,
  onStage?: ImportStageHandler,
): Promise<TournamentSnapshot> => {
  const parser = await fetchParser(`https://challonge.com/${slug}`, onStage);
  onStage?.("save");

  return api.tournaments.save(parser.toSnapshot());
};

export const refreshTournament = (snapshot: TournamentSnapshot): Promise<TournamentSnapshot> => {
  return refreshTournamentBySlug(snapshot.slug);
};
