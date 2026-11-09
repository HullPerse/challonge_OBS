import {
  CHALLONGE_DOMAIN,
  isChallongeHost,
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

/** Unique tournament identity made from its host and slug. */
export const tournamentKey = (host: string, slug: string): string => {
  return `${host.trim().toLowerCase()}/${slug.trim().toLowerCase()}`;
};

/** Resolves a host/slug key from a Challonge URL, falling back to the main domain. */
export const keyFromSourceUrl = (sourceUrl: string): string => {
  const url = parseUrl(sourceUrl.trim());
  const host = url && isChallongeHost(url.hostname) ? url.hostname.toLowerCase() : CHALLONGE_DOMAIN;

  return tournamentKey(host, canonicalSlug(sourceUrl));
};

/** Splits a host/slug key into its validated parts. */
export const splitTournamentKey = (key: string): { host: string; slug: string } | null => {
  const separator = key.indexOf("/");
  if (separator <= 0) return null;

  const host = key.slice(0, separator).toLowerCase();
  const slug = key.slice(separator + 1).toLowerCase();

  if (!isChallongeHost(host) || !SLUG.test(slug) || slug.length > MAX_SLUG_LENGTH) {
    return null;
  }

  return { host, slug };
};

/** True when the input is a URL hosted on a Challonge domain. */
export const isChallongeUrl = (input: string): boolean => {
  const url = parseUrl(input.trim());

  return (
    url !== null &&
    (url.protocol === "https:" || url.protocol === "http:") &&
    isChallongeHost(url.hostname)
  );
};
