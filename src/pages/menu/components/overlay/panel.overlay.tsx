import { Fragment, useRef, useState } from "react";

import Loader from "@/components/ui/loader.component";
import { Switch } from "@/components/ui/switch.component";
import { OVERLAY_MODULE_GROUPS, OVERLAY_MODULE_LABELS } from "@/configs/overlay.config";
import { usePreviewInApp } from "@/hooks/useOverlayPreview.hook";
import { useSetOverlayModules, useSetPointerSize } from "@/hooks/useOverlay.hook";
import { errorMessage } from "@/lib/error.utils";
import { overlayStore } from "@/stores/overlay.store";
import type { OverlayModuleKey, OverlayState, PendingOverlayModules } from "@/types/overlay";
import CursorSizeRow from "./cursorSize.overlay";

function OverlayPanel({
  state,
  isLoading,
  error,
}: {
  state: OverlayState | null;
  isLoading: boolean;
  error: unknown;
}) {
  const modules = useSetOverlayModules();
  const pointerSize = useSetPointerSize();
  const previewInApp = usePreviewInApp();
  const [pendingModules, setPendingModules] = useState<PendingOverlayModules>({});
  const pendingSequence = useRef<number>(0);
  const persistedSize = state?.pointerSize;

  const enabledCount = state ? Object.values(state.modules).filter(Boolean).length : 0;
  const totalCount = state ? Object.keys(state.modules).length : 0;
  const loadErrorText = errorMessage(error, "Не удалось загрузить настройки оверлея");
  const saveErrorText = errorMessage(
    modules.error ?? pointerSize.error,
    "Не удалось сохранить настройки оверлея",
  );

  const updateModule = (key: OverlayModuleKey, checked: boolean) => {
    const sequence = ++pendingSequence.current;
    const patch: Partial<Record<OverlayModuleKey, boolean>> = {};
    patch[key] = checked;

    setPendingModules((previous) => ({
      ...previous,
      [key]: { value: checked, sequence },
    }));

    modules.mutate(patch, {
      onSettled: () => {
        setPendingModules((previous) => {
          if (previous[key]?.sequence !== sequence) return previous;

          const next = { ...previous };
          delete next[key];
          return next;
        });
      },
    });
  };

  const commitSize = (value: number) => {
    if (value === persistedSize) return;
    pointerSize.mutate({ pointerSize: value });
  };

  return (
    <aside
      id="overlay-settings-panel"
      className="flex h-full w-70 flex-col border-l border-border bg-surface"
    >
      {/* TOP */}
      <section className="flex h-11 flex-row items-center justify-between gap-2 border-b border-border px-3">
        <h2 className="text-xs font-medium text-text-secondary">Оверлей</h2>
        <span className="text-[11px] tabular-nums text-text-muted">
          {state ? `${enabledCount} / ${totalCount}` : "—"}
        </span>
      </section>

      <section className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <label
          htmlFor="overlay-preview-in-app"
          className="min-w-0 cursor-pointer truncate text-xs text-text-secondary"
          title="Применять настройки отображения оверлея к карточкам, модалкам и фону приложения"
        >
          Превью в приложении
        </label>
        <Switch
          id="overlay-preview-in-app"
          size="sm"
          checked={previewInApp}
          onCheckedChange={(checked) => {
            overlayStore.previewInApp.set(checked);
          }}
          disabled={!state}
          aria-label="Показывать настройки оверлея в приложении"
          title="Применять настройки отображения оверлея к карточкам, модалкам и фону приложения"
        />
      </section>

      {!state ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4">
          {isLoading ? (
            <>
              <Loader className="size-5 text-text-muted" />
              <span className="text-xs text-text-muted">Загрузка настроек…</span>
            </>
          ) : (
            <p className="text-center text-xs text-accent">
              {loadErrorText ?? "Настройки оверлея недоступны"}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-2">
            {OVERLAY_MODULE_GROUPS.map((group) => (
              <section key={group.label} className="flex flex-col gap-1">
                <h3 className="px-1 text-[10px] font-medium text-text-muted">{group.label}</h3>
                {group.keys.map((key) => {
                  const id = `overlay-module-${key}`;

                  return (
                    <Fragment key={key}>
                      <div className="flex items-center justify-between gap-3 rounded-ui px-2 py-1.5">
                        <label
                          htmlFor={id}
                          className="min-w-0 cursor-pointer truncate text-xs text-text-secondary"
                        >
                          {OVERLAY_MODULE_LABELS[key]}
                        </label>
                        <Switch
                          id={id}
                          size="sm"
                          checked={pendingModules[key]?.value ?? state.modules[key]}
                          onCheckedChange={(checked) => {
                            updateModule(key, checked);
                          }}
                          aria-label={OVERLAY_MODULE_LABELS[key]}
                        />
                      </div>

                      {key === "pointer" && persistedSize !== undefined && (
                        <CursorSizeRow
                          key={persistedSize}
                          persistedSize={persistedSize}
                          disabled={pointerSize.isPending}
                          onCommit={commitSize}
                        />
                      )}
                    </Fragment>
                  );
                })}
              </section>
            ))}
          </div>

          {saveErrorText && (
            <p
              role="alert"
              className="border-t border-border px-3 py-2 text-[10px] leading-tight text-accent"
            >
              {saveErrorText}
            </p>
          )}
        </>
      )}
    </aside>
  );
}

export default OverlayPanel;
