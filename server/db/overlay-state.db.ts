import { overlayPersistedStateSchema } from "@/lib/schemas/server/overlay.schema";
import { attemptSync } from "@hullperse/hp_utils/attempt";
import { eq } from "drizzle-orm";
import type { DatabaseClient } from "./client.db";
import { overlayState } from "./schema.db";

export type PersistedOverlayState = ReturnType<typeof overlayPersistedStateSchema.parse>;

/** Reads and validates the single persisted overlay row. */
export const readOverlayState = (database: DatabaseClient): PersistedOverlayState | null => {
  const row = database.orm.select().from(overlayState).where(eq(overlayState.id, 1)).get();

  if (!row) return null;

  const [state, parseError] = attemptSync(() => ({
    activeSlug: row.activeSlug,
    view: JSON.parse(row.view) as unknown,
    pointer: JSON.parse(row.pointer) as unknown,
    pointerSize: row.pointerSize,
    modules: JSON.parse(row.modules) as unknown,
    revision: row.revision,
    updatedAt: row.updatedAt,
  }));

  if (parseError) return null;

  const parsed = overlayPersistedStateSchema.safeParse(state);
  return parsed.success ? parsed.data : null;
};

export const writeOverlayState = (
  database: DatabaseClient,
  state: PersistedOverlayState,
): void => {
  const values = {
    id: 1,
    activeSlug: state.activeSlug,
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
        activeSlug: values.activeSlug,
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
