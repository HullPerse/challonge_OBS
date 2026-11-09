import type {
  Match,
  Player,
  RawStore,
  Round,
  TournamentGroup,
  TournamentSnapshotWrite,
} from "@/types/tournament";

import { CHALLONGE_DOMAIN, isChallongeHost } from "@/configs/tournament.config";
import { extractCanonicalUrl, extractName, parseStore } from "./extract.tournament";
import {
  canonicalSlug as resolveSlug,
  isChallongeUrl,
  isUrl,
  tournamentKey,
} from "./slug.tournament";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import { collectParticipants, toGroups, toMatches, toRounds } from "./map.tournament";

/** True when pasted input looks like an HTML document. */
const looksLikeHtml = (input: string): boolean => {
  return /<\s*(?:!doctype|html|head|meta|title)\b/i.test(input);
};

/** Counts matches across all rounds of a raw store. */
const countStoreMatches = (store: RawStore): number => {
  return Object.values(store.matches_by_round).reduce(
    (total, matches) => total + matches.length,
    0,
  );
};

/** Compares two sources by their canonical slug. */
const sameSlug = (input: string, expected: string): boolean => {
  const [slug, error] = attemptSync(() => resolveSlug(input));
  return !error && slug === expected;
};

/** Keeps the tournament subdomain, falling back to the main domain for bare slugs. */
const resolveHost = (sourceUrl: string, canonicalUrl: string | null): string => {
  const [source] = attemptSync(() => new URL(sourceUrl.trim()));
  if (source && isChallongeHost(source.hostname)) return source.hostname.toLowerCase();

  if (canonicalUrl) {
    const [canonical] = attemptSync(() => new URL(canonicalUrl.trim()));
    if (canonical && isChallongeHost(canonical.hostname)) return canonical.hostname.toLowerCase();
  }

  return CHALLONGE_DOMAIN;
};

/** Parses Challonge module HTML/JSON into a tournament snapshot. */
export class TournamentParser {
  /** Lowercase Challonge slug derived from the source URL. */
  readonly slug: string;

  /** Challonge host, so subdomain tournaments keep their own refresh URL. */
  readonly host: string;

  /** Tournament title from the page metadata or a slug-based fallback. */
  readonly name: string;

  /** Matches in store order, with the `finals` side already resolved. */
  readonly matches: Match[];

  /** Rounds sorted winners-first, with missing entries rebuilt from matches. */
  readonly rounds: Round[];

  /** Nested group-stage brackets. */
  readonly groups: TournamentGroup[];

  /** Unique participants from the store and matches, sorted by seed. */
  readonly participants: Player[];

  private readonly store: RawStore;
  constructor(input: string, sourceUrl: string) {
    this.store = parseStore(input);

    if (isUrl(sourceUrl) && !isChallongeUrl(sourceUrl)) {
      throw new Error("Ссылка должна вести на challonge.com");
    }

    this.slug = resolveSlug(sourceUrl);

    const title = extractName(input);
    const isEmptyStore =
      countStoreMatches(this.store) === 0 && (this.store.participants?.length ?? 0) === 0;

    if (!title && looksLikeHtml(input)) {
      throw new Error(
        "Не удалось найти заголовок турнира в HTML. Вставьте сохранённую страницу Challonge",
      );
    }

    if (!title && isEmptyStore) {
      throw new Error("Данные не похожи на турнир: нет заголовка и матчей");
    }

    this.name = title || `Challonge ${this.slug}`;

    const canonicalUrl = extractCanonicalUrl(input);

    this.host = resolveHost(sourceUrl, canonicalUrl);

    if (canonicalUrl && (!isChallongeUrl(canonicalUrl) || !sameSlug(canonicalUrl, this.slug))) {
      throw new Error("Ссылка и HTML относятся к разным турнирам");
    }

    this.matches = toMatches(this.store);
    this.groups = toGroups(this.store);
    this.rounds = toRounds(this.store.rounds, this.matches);
    this.participants = collectParticipants(this.store.participants, this.matches, this.groups);
  }

  /** Unique tournament identity. */
  get key(): string {
    return tournamentKey(this.host, this.slug);
  }

  /** Public Challonge URL normalized from the slug. */
  get sourceUrl(): string {
    return `https://${this.host}/${this.slug}`;
  }

  /** Projects the parsed tournament into the stored snapshot format. */
  toSnapshot(): TournamentSnapshotWrite {
    const { tournament } = this.store;

    return {
      version: 1,
      key: this.key,
      tournamentId: tournament.id,
      sourceUrl: this.sourceUrl,
      slug: this.slug,
      name: this.name,
      tournamentType: tournament.tournament_type,
      state: tournament.state,
      participants: this.participants,
      fetchedAt: Date.now(),
      hideSeeds: tournament.hide_seeds ?? false,
      hideIdentifiers: tournament.hide_identifiers ?? false,
      rounds: this.rounds,
      matches: this.matches,
      ...(this.groups.length > 0 ? { groups: this.groups } : {}),
    };
  }
}
