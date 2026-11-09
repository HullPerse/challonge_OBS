import { overlayPersistedStateSchema } from "@/lib/schemas/server/overlay.schema";
import type { PersistedOverlayState } from "@/types/server/database";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import { eq } from "drizzle-orm";
import type { DatabaseClient } from "./client.db";
import { overlayState } from "./schema.db";

/** Reads and validates the single persisted overlay row. */
export const readOverlayState = (database: DatabaseClient): PersistedOverlayState | null => {
  const row = database.orm.select().from(overlayState).where(eq(overlayState.id, 1)).get();

  if (!row) return null;

  const [view, viewError] = attemptSync<unknown>(() => JSON.parse(row.view));
  const [pointer, pointerError] = attemptSync<unknown>(() => JSON.parse(row.pointer));
  const [modules, modulesError] = attemptSync<unknown>(() => JSON.parse(row.modules));

  if (viewError || pointerError || modulesError) return null;

  const parsed = overlayPersistedStateSchema.safeParse({
    activeKey: row.activeKey,
    view,
    pointer,
    pointerSize: row.pointerSize,
    modules,
    revision: row.revision,
    updatedAt: row.updatedAt,
  });
  return parsed.success ? parsed.data : null;
};

export const writeOverlayState = (database: DatabaseClient, state: PersistedOverlayState): void => {
  const values = {
    id: 1,
    activeKey: state.activeKey,
    view: JSON.stringify(state.view),
    pointer: JSON.stringify(state.pointer),
    pointerSize: state.pointerSize,
    modules: JSON.stringify(state.modules),
    revision: state.revision,
    updatedAt: state.updatedAt,
  };

  database.orm
    .insert(overlayState)
    .values(values)
    .onConflictDoUpdate({
      target: overlayState.id,
      set: {
        activeKey: values.activeKey,
        view: values.view,
        pointer: values.pointer,
        pointerSize: values.pointerSize,
        modules: values.modules,
        revision: values.revision,
        updatedAt: values.updatedAt,
      },
    })
    .run();
};
