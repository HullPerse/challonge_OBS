import type { ImportStage, Match } from "@/types/tournament";

/** Tournament slug format and length limit shared by the client and the server. */
export const SLUG = /^[a-z0-9][a-z0-9_-]*$/i;
export const MAX_SLUG_LENGTH = 200;
/** Maximum length of a pasted Challonge URL. */
export const MAX_SOURCE_URL_LENGTH = 500;
/** Hosts accepted as Challonge links. */
export const CHALLONGE_HOSTS = new Set(["challonge.com", "www.challonge.com"]);

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

export const ORGANIZATOR_NAME = "PodPivasGaming";
export const NO_TOURNAMENT_VALUE = "__none__";
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
