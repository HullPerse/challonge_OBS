import { OVERLAY_CURSOR_SIZE } from "@/configs/overlay.config";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tournaments = sqliteTable("tournaments", {
  key: text("key").primaryKey(),
  slug: text("slug").notNull(),
  host: text("host").notNull(),
  name: text("name").notNull(),
  tournamentType: text("tournament_type").notNull(),
  sourceUrl: text("source_url").notNull(),
  fetchedAt: integer("fetched_at").notNull(),
  matchCount: integer("match_count").notNull(),
  snapshot: text("snapshot").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const tournamentVisibility = sqliteTable("tournament_visibility", {
  key: text("key")
    .primaryKey()
    .references(() => tournaments.key, { onDelete: "cascade" }),
  hiddenMatches: text("hidden_matches").notNull().default("[]"),
  hiddenRounds: text("hidden_rounds").notNull().default("[]"),
});

export const overlayState = sqliteTable("overlay_state", {
  id: integer("id").primaryKey(),
  activeKey: text("active_key").references(() => tournaments.key, {
    onDelete: "set null",
  }),
  view: text("view").notNull(),
  pointer: text("pointer").notNull(),
  pointerSize: integer("pointer_size").notNull().default(OVERLAY_CURSOR_SIZE.default),
  modules: text("modules").notNull(),
  revision: integer("revision").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
