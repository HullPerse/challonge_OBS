import { OVERLAY_CURSOR_SIZE } from "@/configs/overlay.config";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tournaments = sqliteTable("tournaments", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  tournamentType: text("tournament_type").notNull(),
  sourceUrl: text("source_url").notNull(),
  fetchedAt: integer("fetched_at").notNull(),
  matchCount: integer("match_count").notNull(),
  snapshot: text("snapshot").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const tournamentVisibility = sqliteTable("tournament_visibility", {
  slug: text("slug")
    .primaryKey()
    .references(() => tournaments.slug, { onDelete: "cascade" }),
  hiddenMatches: text("hidden_matches").notNull().default("[]"),
  hiddenRounds: text("hidden_rounds").notNull().default("[]"),
});

export const overlayState = sqliteTable("overlay_state", {
  id: integer("id").primaryKey(),
  activeSlug: text("active_slug").references(() => tournaments.slug, {
    onDelete: "set null",
  }),
  view: text("view").notNull(),
  pointer: text("pointer").notNull(),
  pointerSize: integer("pointer_size").notNull().default(OVERLAY_CURSOR_SIZE.default),
  modules: text("modules").notNull(),
  revision: integer("revision").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
