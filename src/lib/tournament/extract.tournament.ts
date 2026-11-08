import { attemptSync } from "@hullperse/hp_utils/attempt";
import { flattenMarkup } from "@hullperse/hp_utils/text";

import { CHALLONGE_TITLE_SUFFIX } from "@/configs/tournament.config";
import type { RawStore } from "@/types/tournament";
import { rawStoreSchema } from "../schemas/tournament.schema";

/** Narrows unknown values to plain records. */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

/** Parses JSON without throwing; `undefined` means the input was not valid JSON. */
const parseJson = (value: string): unknown => {
  const [parsed, error] = attemptSync(() => JSON.parse(value) as unknown);
  return error ? undefined : parsed;
};

/** Finds the closing brace of the object starting at `start`, skipping braces inside strings. */
const findObjectEnd = (source: string, start: number): number => {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
};

const unwrapStore = (value: unknown): unknown => {
  return isRecord(value) && "TournamentStore" in value ? value.TournamentStore : value;
};

/** Extracts the TournamentStore object from pasted JSON or page HTML. */
const extractRawStore = (input: string): unknown => {
  const direct = parseJson(input.trim());
  if (direct !== undefined) return unwrapStore(direct);

  const markerIndex = input.indexOf("TournamentStore");
  if (markerIndex < 0) {
    throw new Error("Не найден TournamentStore. Вставьте HTML страницы турнира или JSON");
  }

  const equalsIndex = input.indexOf("=", markerIndex);
  const start = equalsIndex < 0 ? -1 : input.indexOf("{", equalsIndex);
  if (start < 0) {
    throw new Error("Не найден объект TournamentStore в HTML");
  }

  const end = findObjectEnd(input, start);
  if (end < 0) {
    throw new Error("TournamentStore обрезан или содержит некорректный JSON");
  }

  const parsed = parseJson(input.slice(start, end + 1));
  if (parsed === undefined) {
    throw new Error("Не удалось разобрать JSON турнира");
  }

  return unwrapStore(parsed);
};

/** Flattens page markup and drops the trailing " - Challonge" suffix. */
const stripChallongeSuffix = (value: string): string => {
  return flattenMarkup(value).replace(CHALLONGE_TITLE_SUFFIX, "").trim();
};

/** Reads the tournament title from `og:title` or `<title>`; empty string when absent. */
export const extractName = (input: string): string => {
  const metaTags = input.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    if (!/property=["']og:title["']/i.test(tag)) continue;

    const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
    if (content) return stripChallongeSuffix(content);
  }

  const title = input.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? stripChallongeSuffix(title) : "";
};

/** Reads the canonical tournament URL from `og:url` or `<link rel="canonical">`. */
export const extractCanonicalUrl = (input: string): string | null => {
  const metaTags = input.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    if (!/property=["']og:url["']/i.test(tag)) continue;

    const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
    if (content) return content;
  }

  const linkTags = input.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    if (!/rel=["']canonical["']/i.test(tag)) continue;

    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) return href;
  }

  return null;
};

/** Validates the extracted store, throwing a UI-ready message on a shape mismatch. */
export const parseStore = (input: string): RawStore => {
  const parsed = rawStoreSchema.safeParse(extractRawStore(input));

  if (!parsed.success) {
    throw new Error("Формат турнира не совпал с ожидаемым. Проверьте, что вставлен HTML Challonge");
  }

  return parsed.data;
};
