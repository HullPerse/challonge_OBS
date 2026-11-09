import { SNAPSHOT_CACHE_LIMIT } from "@/configs/server/tournament.config";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import { desc, eq } from "drizzle-orm";
import { snapshotSchema } from "@/lib/schemas/server/tournament.schema";
import VisibilityUtils from "@/lib/server/visibility.utils";
import type { CachedSnapshot } from "@/types/server/tournament";
import type {
  TournamentSnapshot,
  TournamentSummary,
  TournamentVisibility,
} from "@/types/tournament";
import type { DatabaseClient } from "../db/client.db";
import { tournaments, tournamentVisibility } from "../db/schema.db";

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
        key: tournaments.key,
        slug: tournaments.slug,
        host: tournaments.host,
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

  exists(key: string): boolean {
    const data = this.database.orm
      .select({ key: tournaments.key })
      .from(tournaments)
      .where(eq(tournaments.key, key))
      .get();

    return !!data;
  }

  /** Loads a snapshot from memory, or parses and caches it once. */
  get(key: string): TournamentSnapshot | null {
    const cached = this.snapshots.get(key);

    if (cached) {
      this.touch(key, cached);
      return cached.snapshot;
    }

    return this.read(key)?.snapshot ?? null;
  }

  private read(key: string): CachedSnapshot | null {
    const data = this.database.orm
      .select({ snapshot: tournaments.snapshot })
      .from(tournaments)
      .where(eq(tournaments.key, key))
      .get();

    if (!data) return null;

    const [parse, parseError] = attemptSync<unknown>(() => JSON.parse(data.snapshot));

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

    this.snapshots.delete(snapshot.key);
    this.snapshots.set(snapshot.key, cached);

    if (this.snapshots.size > SNAPSHOT_CACHE_LIMIT) {
      const oldest = this.snapshots.keys().next().value;
      if (oldest !== undefined) this.snapshots.delete(oldest);
    }

    return cached;
  }

  private touch(key: string, cached: CachedSnapshot) {
    this.snapshots.delete(key);
    this.snapshots.set(key, cached);
  }

  save(snapshot: TournamentSnapshot): TournamentSnapshot {
    const key = snapshot.key;
    const host = key.slice(0, key.indexOf("/"));

    const values = {
      slug: snapshot.slug,
      host,
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
      .values({ key, ...values })
      .onConflictDoUpdate({
        target: tournaments.key,
        set: values,
      })
      .run();

    this.cache(snapshot);
    return snapshot;
  }

  /** Deletes a snapshot and its visibility; returns false when missing. */
  remove(key: string): boolean {
    const removed = this.database.orm.transaction((transaction) => {
      const existing = transaction
        .select({ key: tournaments.key })
        .from(tournaments)
        .where(eq(tournaments.key, key))
        .get();

      if (!existing) return false;

      transaction.delete(tournamentVisibility).where(eq(tournamentVisibility.key, key)).run();

      transaction.delete(tournaments).where(eq(tournaments.key, key)).run();

      return true;
    });

    if (removed) this.snapshots.delete(key);
    return removed;
  }

  getVisibility(key: string): TournamentVisibility {
    const row = this.database.orm
      .select({
        hiddenMatches: tournamentVisibility.hiddenMatches,
        hiddenRounds: tournamentVisibility.hiddenRounds,
      })
      .from(tournamentVisibility)
      .where(eq(tournamentVisibility.key, key))
      .get();

    if (!row) return VisibilityUtils.empty();

    return {
      hiddenMatches: VisibilityUtils.parseIds(row.hiddenMatches),
      hiddenRounds: VisibilityUtils.parseIds(row.hiddenRounds),
    };
  }

  /** Saves normalized visibility pruned to the snapshot. */
  saveVisibility(key: string, visibility: TournamentVisibility): TournamentVisibility {
    const normalized = VisibilityUtils.normalize(visibility);
    const cached = this.snapshots.get(key) ?? this.read(key);

    let pruned = normalized;
    if (cached) {
      pruned = VisibilityUtils.pruneIds(normalized, cached.matchIds, cached.roundNumbers);
    }

    const values = {
      key,
      hiddenMatches: JSON.stringify(pruned.hiddenMatches),
      hiddenRounds: JSON.stringify(pruned.hiddenRounds),
    };

    const config = {
      target: tournamentVisibility.key,
      set: {
        hiddenMatches: values.hiddenMatches,
        hiddenRounds: values.hiddenRounds,
      },
    };

    this.database.orm.insert(tournamentVisibility).values(values).onConflictDoUpdate(config).run();

    return pruned;
  }
}
