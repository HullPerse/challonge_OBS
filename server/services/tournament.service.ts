import { SNAPSHOT_CACHE_LIMIT } from "@/configs/server/tournament.config";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import { desc, eq } from "drizzle-orm";
import { snapshotSchema } from "@/lib/schemas/server/tournament.schema";
import VisibilityUtils from "@/lib/server/visibility.utils";
import type {
  TournamentSnapshot,
  TournamentSummary,
  TournamentVisibility,
} from "@/types/tournament";
import type { DatabaseClient } from "../db/client.db";
import { tournaments, tournamentVisibility } from "../db/schema.db";

type CachedSnapshot = {
  snapshot: TournamentSnapshot;
  matchIds: Set<number>;
  roundNumbers: Set<number>;
};

/** Stores validated snapshots and visibility in SQLite. */
export default class TournamentService {
  private readonly database: DatabaseClient;
  private readonly snapshots = new Map<string, CachedSnapshot>();

  constructor(database: DatabaseClient) {
    this.database = database;
  }

  /** Returns saved tournaments, newest first. */
  list(): TournamentSummary[] {
    const data = this.database.orm
      .select({
        slug: tournaments.slug,
        name: tournaments.name,
        tournamentType: tournaments.tournamentType,
        fetchedAt: tournaments.fetchedAt,
        matchCount: tournaments.matchCount,
        updatedAt: tournaments.updatedAt,
      })
      .from(tournaments)
      .orderBy(desc(tournaments.updatedAt))
      .all();

    return data;
  }

  exists(slug: string): boolean {
    const data = this.database.orm
      .select({ slug: tournaments.slug })
      .from(tournaments)
      .where(eq(tournaments.slug, slug))
      .get();

    return !!data;
  }

  /** Loads a snapshot from memory, or parses and caches it once. */
  get(slug: string): TournamentSnapshot | null {
    const cached = this.snapshots.get(slug);

    if (cached) {
      this.touch(slug, cached);
      return cached.snapshot;
    }

    return this.read(slug)?.snapshot ?? null;
  }

  private read(slug: string): CachedSnapshot | null {
    const data = this.database.orm
      .select({ snapshot: tournaments.snapshot })
      .from(tournaments)
      .where(eq(tournaments.slug, slug))
      .get();

    if (!data) return null;

    const [parse, parseError] = attemptSync(() => JSON.parse(data.snapshot) as unknown);

    if (parseError) return null;

    const parsed = snapshotSchema.safeParse(parse);

    if (parsed.error) return null;
    return this.cache(parsed.data);
  }

  private cache(snapshot: TournamentSnapshot): CachedSnapshot {
    const cached: CachedSnapshot = {
      snapshot,
      matchIds: new Set(snapshot.matches.map(({ id }) => id)),
      roundNumbers: new Set(snapshot.rounds.map(({ number }) => number)),
    };

    this.snapshots.delete(snapshot.slug);
    this.snapshots.set(snapshot.slug, cached);

    if (this.snapshots.size > SNAPSHOT_CACHE_LIMIT) {
      const oldest = this.snapshots.keys().next().value;
      if (oldest !== undefined) this.snapshots.delete(oldest);
    }

    return cached;
  }

  private touch(slug: string, cached: CachedSnapshot) {
    this.snapshots.delete(slug);
    this.snapshots.set(slug, cached);
  }

  save(snapshot: TournamentSnapshot): TournamentSnapshot {
    const slug = snapshot.slug;

    const values = {
      name: snapshot.name,
      tournamentType: snapshot.tournamentType,
      sourceUrl: snapshot.sourceUrl,
      fetchedAt: snapshot.fetchedAt,
      matchCount: snapshot.matches.length,
      snapshot: JSON.stringify(snapshot),
      updatedAt: Date.now(),
    };

    this.database.orm
      .insert(tournaments)
      .values({ slug, ...values })
      .onConflictDoUpdate({
        target: tournaments.slug,
        set: values,
      })
      .run();

    this.cache(snapshot);
    return snapshot;
  }

  /** Deletes a snapshot and its visibility; returns false when missing. */
  remove(slug: string): boolean {
    const removed = this.database.orm.transaction((transaction) => {
      const existing = transaction
        .select({ slug: tournaments.slug })
        .from(tournaments)
        .where(eq(tournaments.slug, slug))
        .get();

      if (!existing) return false;

      transaction.delete(tournamentVisibility).where(eq(tournamentVisibility.slug, slug)).run();

      transaction.delete(tournaments).where(eq(tournaments.slug, slug)).run();

      return true;
    });

    if (removed) this.snapshots.delete(slug);
    return removed;
  }

  getVisibility(slug: string): TournamentVisibility {
    const row = this.database.orm
      .select({
        hiddenMatches: tournamentVisibility.hiddenMatches,
        hiddenRounds: tournamentVisibility.hiddenRounds,
      })
      .from(tournamentVisibility)
      .where(eq(tournamentVisibility.slug, slug))
      .get();

    if (!row) return VisibilityUtils.empty();

    return {
      hiddenMatches: VisibilityUtils.parseIds(row.hiddenMatches),
      hiddenRounds: VisibilityUtils.parseIds(row.hiddenRounds),
    };
  }

  /** Saves normalized visibility pruned to the snapshot. */
  saveVisibility(slug: string, visibility: TournamentVisibility): TournamentVisibility {
    const normalized = VisibilityUtils.normalize(visibility);
    const cached = this.snapshots.get(slug) ?? this.read(slug);

    let pruned = normalized;
    if (cached) {
      pruned = VisibilityUtils.pruneIds(normalized, cached.matchIds, cached.roundNumbers);
    }

    const values = {
      slug,
      hiddenMatches: JSON.stringify(pruned.hiddenMatches),
      hiddenRounds: JSON.stringify(pruned.hiddenRounds),
    };

    const config = {
      target: tournamentVisibility.slug,
      set: {
        hiddenMatches: values.hiddenMatches,
        hiddenRounds: values.hiddenRounds,
      },
    };

    this.database.orm.insert(tournamentVisibility).values(values).onConflictDoUpdate(config).run();

    return pruned;
  }
}
