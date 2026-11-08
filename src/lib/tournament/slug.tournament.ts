import {
  CHALLONGE_HOSTS,
  LOCALE_SEGMENTS,
  MAX_SLUG_LENGTH,
  SLUG,
} from "@/configs/tournament.config";
import { attemptSync } from "@hullperse/hp_utils/attempt";

const parseUrl = (value: string): URL | null => {
  const [url, error] = attemptSync(() => new URL(value));
  return error ? null : url;
};

/** Extracts the lowercase Challonge slug from a URL or a slug input. */
export const canonicalSlug = (input: string): string => {
  const trimmed = input.trim();
  const path = parseUrl(trimmed)?.pathname ?? trimmed;
  const segment = path
    .split("/")
    .filter(Boolean)
    .find((part) => !LOCALE_SEGMENTS.has(part) && part !== "module" && part !== "fullscreen");
  const slug = (segment ?? "").toLowerCase();

  if (slug.length > MAX_SLUG_LENGTH || !SLUG.test(slug)) {
    throw new Error("Введите ссылку на турнир Challonge");
  }

  return slug;
};

/** True when the input parses as an absolute URL. */
export const isUrl = (input: string): boolean => {
  return parseUrl(input.trim()) !== null;
};

/** True when the input is a URL hosted on a Challonge domain. */
export const isChallongeUrl = (input: string): boolean => {
  const url = parseUrl(input.trim());

  return (
    url !== null &&
    (url.protocol === "https:" || url.protocol === "http:") &&
    CHALLONGE_HOSTS.has(url.hostname.toLowerCase())
  );
};
