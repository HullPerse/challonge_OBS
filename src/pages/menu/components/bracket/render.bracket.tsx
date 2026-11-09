import { useCallback } from "react";
import { Trophy } from "lucide-react";

import Loader from "@/components/ui/loader.component";
import {
  activeTournamentSelectors,
  useActiveTournamentActions,
  useActiveTournamentSelector,
} from "@/hooks/useActiveTournament.hook";
import { useOverlayFocusSync } from "@/hooks/useOverlayFocusSync.hook";
import { useAppBracketView } from "@/hooks/useOverlayPreview.hook";
import { useSetOverlayPointer, useSetOverlayView } from "@/hooks/useOverlay.hook";
import { errorMessage } from "@/lib/error.utils";
import type { OverlayPointer, OverlayView } from "@/types/overlay";
import ErrorState from "./error.bracket";
import StatePanel from "./state.bracket";
import BracketView from "./view.bracket";

const RenderBracket = () => {
  const snapshot = useActiveTournamentSelector(activeTournamentSelectors.snapshot);
  const key = useActiveTournamentSelector(activeTournamentSelectors.key);
  const overlayState = useActiveTournamentSelector(activeTournamentSelectors.overlayState);
  const isLoading = useActiveTournamentSelector(activeTournamentSelectors.isLoading);
  const notFound = useActiveTournamentSelector(activeTournamentSelectors.notFound);
  const error = useActiveTournamentSelector(activeTournamentSelectors.error);
  const selectionError = useActiveTournamentSelector(activeTournamentSelectors.selectionError);
  const { retry, retrySelection } = useActiveTournamentActions();
  const { mutate: setOverlayView } = useSetOverlayView();
  const { mutate: setOverlayPointer } = useSetOverlayPointer();
  const pointerEnabled = overlayState?.modules.pointer ?? false;
  useOverlayFocusSync(overlayState);
  const { cardView, showRoundTitles, showBackground } = useAppBracketView(overlayState, snapshot);

  const errorText = errorMessage(error, "Не удалось загрузить данные турнира");
  const errorSelection = errorMessage(selectionError, "Не удалось переключить турнир");

  const handleSceneView = useCallback(
    (view: OverlayView) => {
      if (key) setOverlayView({ activeKey: key, view });
    },
    [key, setOverlayView],
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
    return <ErrorState title="Не удалось загрузить данные" message={errorText} onRetry={retry} />;
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

  if (snapshot?.matches.length === 0 && !snapshot.groups?.length) {
    return (
      <StatePanel>
        <Trophy className="size-5 text-text-muted" />
        <p className="text-xs text-text-muted">В турнире пока нет матчей</p>
      </StatePanel>
    );
  }

  if (snapshot) {
    return (
      <BracketView
        snapshot={snapshot}
        overlayState={overlayState}
        cardView={cardView}
        showRoundTitles={showRoundTitles}
        showBackground={showBackground}
        onViewChange={handleViewChange}
        onPointerChange={handlePointerChange}
      />
    );
  }

  if (notFound) {
    return (
      <StatePanel>
        <Trophy className="text-text-muted" />
        <h2 className="text-sm font-medium text-text-primary">Турнир не найден</h2>
      </StatePanel>
    );
  }

  return null;
};

export default RenderBracket;
