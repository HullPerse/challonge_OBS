import type { ImportStage, Match } from "@/types/tournament";

/** Tournament slug format and length limit shared by the client and the server. */
export const SLUG = /^[a-z0-9][a-z0-9_-]*$/i;
export const MAX_SLUG_LENGTH = 200;
/** Unique tournament identity: `host/slug`. */
export const TOURNAMENT_KEY = /^[a-z0-9][a-z0-9.-]*\/[a-z0-9][a-z0-9_-]*$/i;
/** Maximum length of a pasted Challonge URL. */
export const MAX_SOURCE_URL_LENGTH = 500;
export const MAX_KEY_LENGTH = MAX_SOURCE_URL_LENGTH;
/** Root domain accepted for tournament links and pages. */
export const CHALLONGE_DOMAIN = "challonge.com";
/** Reserved subdomains that do not host tournament pages. */
const CHALLONGE_RESERVED_SUBDOMAINS = new Set(["api"]);

/** True for challonge.com and tournament subdomains like "cup.challonge.com". */
export const isChallongeHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase();
  if (host === CHALLONGE_DOMAIN) return true;

  const suffix = `.${CHALLONGE_DOMAIN}`;
  if (!host.endsWith(suffix)) return false;

  return !CHALLONGE_RESERVED_SUBDOMAINS.has(host.slice(0, -suffix.length));
};

/** Trailing site suffix removed from Challonge page titles. */
export const CHALLONGE_TITLE_SUFFIX = /\s*-\s*Challonge\s*$/i;

export const LOCALE_SEGMENTS = new Set([
  "ar",
  "cs",
  "da",
  "de",
  "es",
  "fi",
  "fr",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "lv-LV",
  "nl",
  "no",
  "pl",
  "pt",
  "pt_BR",
  "ro",
  "ru",
  "sk",
  "sv",
  "th",
  "tr",
  "uk",
  "vi",
  "zh_CN",
  "zh_TW",
]);

/** Tournament types that have an elimination tree. Everything else is shown as round rows. */
export const ELIMINATION_TOURNAMENT_TYPES = new Set(["single elimination", "double elimination"]);

export const isEliminationTournament = (type: string): boolean => {
  return ELIMINATION_TOURNAMENT_TYPES.has(type.trim().toLowerCase());
};

export const ORGANIZATOR_NAME = "PodPivasGaming";
export const NO_TOURNAMENT_VALUE = "__none__";
export const IMPORT_ACTION_LABELS = {
  save: "Сохранить",
  overwrite: "Перезаписать",
  checkHtml: "Проверить HTML",
  checkUrl: "Проверить ссылку",
} as const;

export const IMPORT_STAGE_LABELS: Record<ImportStage | "idle", string> = {
  idle: "Готовлю импорт…",
  fetch: "Скачиваю страницу с Challonge…",
  parse: "Разбираю турнир…",
  save: "Сохраняю в SQLite…",
};

export const SIDE_ORDER: Record<Match["side"], number> = {
  winners: 0,
  losers: 1,
  finals: 2,
};
