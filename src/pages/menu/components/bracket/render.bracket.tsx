import { useCallback } from "react";
import { AlertTriangle, RefreshCw, Trophy } from "lucide-react";

import Button from "@/components/ui/button.component";
import Loader from "@/components/ui/loader.component";
import { DEFAULT_VIEW } from "@/configs/overlay.config";
import { useActiveTournamentContext } from "@/components/shared/activeTournament.provider";
import { useOverlayFocusSync } from "@/hooks/useOverlayFocusSync.hook";
import { useAppBracketView } from "@/hooks/useOverlayPreview.hook";
import {
  useSetOverlayPointer,
  useSetOverlayView,
} from "@/hooks/useOverlay.hook";
import { errorMessage } from "@/lib/error.utils";
import type { OverlayPointer, OverlayView } from "@/types/overlay";
import ControlBracket from "./control.bracket";
import ResultBracket from "./result.bracket";
import StatePanel from "./state.bracket";

function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <StatePanel>
      <AlertTriangle className="size-7 text-accent" />
      <h2 className="text-sm font-medium text-text-primary">{title}</h2>
      <p className="max-w-md text-xs leading-relaxed text-text-muted">
        {message}
      </p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        <RefreshCw className="size-3.5" />
        Повторить
      </Button>
    </StatePanel>
  );
}

const RenderBracket = () => {
  const {
    snapshot,
    slug,
    overlayState,
    isLoading,
    notFound,
    error,
    selectionError,
    retry,
    retrySelection,
  } = useActiveTournamentContext();
  const { mutate: setOverlayView } = useSetOverlayView();
  const { mutate: setOverlayPointer } = useSetOverlayPointer();
  const pointerEnabled = overlayState?.modules.pointer ?? false;
  useOverlayFocusSync(overlayState);
  const { cardView, showRoundTitles } = useAppBracketView(
    overlayState,
    snapshot,
  );

  const errorText = errorMessage(error, "Не удалось загрузить данные турнира");
  const errorSelection = errorMessage(
    selectionError,
    "Не удалось переключить турнир",
  );

  const handleSceneView = useCallback(
    (view: OverlayView) => {
      if (slug) setOverlayView({ activeSlug: slug, view });
    },
    [setOverlayView, slug],
  );

  const handleScenePointer = useCallback(
    (pointer: OverlayPointer) => {
      setOverlayPointer(pointer);
    },
    [setOverlayPointer],
  );

  const cameraEnabled = overlayState?.modules.camera ?? false;

  const handleViewChange = useCallback(
    (view: OverlayView) => {
      if (cameraEnabled) handleSceneView(view);
    },
    [cameraEnabled, handleSceneView],
  );

  const handlePointerChange = useCallback(
    (pointer: OverlayPointer) => {
      if (pointerEnabled) handleScenePointer(pointer);
    },
    [handleScenePointer, pointerEnabled],
  );

  if (errorText) {
    return (
      <ErrorState
        title="Не удалось загрузить данные"
        message={errorText}
        onRetry={retry}
      />
    );
  }

  if (errorSelection && !snapshot) {
    return (
      <ErrorState
        title="Не удалось выбрать турнир"
        message={errorSelection}
        onRetry={retrySelection}
      />
    );
  }

  if (isLoading) {
    return (
      <StatePanel>
        <Loader className="size-5 text-text-muted" />
        <span className="text-xs text-text-muted">Загрузка турнира…</span>
      </StatePanel>
    );
  }

  if (snapshot?.matches.length === 0) {
    return (
      <StatePanel>
        <Trophy className="size-5 text-text-muted" />
        <p className="text-xs text-text-muted">В турнире пока нет матчей</p>
      </StatePanel>
    );
  }

  if (snapshot) {
    return (
      <div className="flex h-full w-full flex-col">
        <ResultBracket snapshot={snapshot} />
        <div className="min-h-0 flex-1">
          <ControlBracket
            key={snapshot.slug}
            snapshot={snapshot}
            sceneView={overlayState?.view ?? DEFAULT_VIEW}
            cardView={cardView}
            showRoundTitles={showRoundTitles}
            onViewChange={handleViewChange}
            onPointerChange={handlePointerChange}
          />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <StatePanel>
        <Trophy className="text-text-muted" />
        <h2 className="text-sm font-medium text-text-primary">
          Турнир не найден
        </h2>
      </StatePanel>
    );
  }

  return null;
};

export default RenderBracket;
