import type { overlayPersistedStateSchema } from "@/lib/schemas/server/overlay.schema";
import type { Database } from "bun:sqlite";

export type PersistedOverlayState = ReturnType<typeof overlayPersistedStateSchema.parse>;

export type DatabaseMigration = {
  version: number;
  run: (sqlite: Database) => void;
};

export type LegacyTournament = {
  slug: string;
  name: string;
  tournament_type: string;
  source_url: string;
  fetched_at: number;
  match_count: number;
  snapshot: string;
  updated_at: number;
};

export type LegacyVisibility = {
  slug: string;
  hidden_matches: string;
  hidden_rounds: string;
};

export type LegacyOverlay = {
  id: number;
  active_slug: string | null;
  view: string;
  pointer: string;
  modules: string;
  revision: number;
  updated_at: number;
  pointer_size?: number;
};
