import { IMPORT_STAGE_LABELS, MAX_SOURCE_URL_LENGTH } from "@/configs/tournament.config";
import { canonicalSlug, isChallongeUrl, isUrl } from "./tournament/slug.tournament";
import { errorMessage } from "./error.utils";
import type { ImportStage, TournamentSnapshot } from "@/types/tournament";
import { attemptSync } from "@hullperse/hp_utils/attempt";

export const validateSource = (value: string): string | null => {
  const trimmed = value.trim();

  if (trimmed.length === 0) return "Введите ссылку на турнир";
  if (trimmed.length > MAX_SOURCE_URL_LENGTH) return "Ссылка слишком длинная";

  if (isUrl(trimmed) && !isChallongeUrl(trimmed)) {
    return "Ссылка должна вести на challonge.com";
  }

  const [, error] = attemptSync(() => canonicalSlug(trimmed));
  if (error) {
    return errorMessage(error, "Введите ссылку на турнир Challonge");
  }

  return null;
};

export const getVisibleUrlError = (
  error: string | null,
  attempted: boolean,
  url: string,
): string | undefined => {
  if (!attempted && url.trim().length === 0) return undefined;

  if (!error) return undefined;
  return error;
};

export const listHasTournament = (
  items: readonly { slug: string }[],
  preview: TournamentSnapshot | null,
): boolean => {
  return preview !== null && items.some((item) => item.slug === preview.slug);
};

export const getActionLabel = (
  preview: TournamentSnapshot | null,
  overwrite: boolean,
  hasHtml: boolean,
): string => {
  if (preview) return overwrite ? "Перезаписать" : "Сохранить";
  return hasHtml ? "Проверить HTML" : "Проверить ссылку";
};

export const getStageLabel = (saving: boolean, stage: ImportStage | null): string => {
  return saving ? IMPORT_STAGE_LABELS.save : IMPORT_STAGE_LABELS[stage ?? "idle"];
};
