import { AlertTriangle, RefreshCw } from "lucide-react";

import Button from "@/components/ui/button.component";
import {
  activeTournamentSelectors,
  useActiveTournamentActions,
  useActiveTournamentSelector,
} from "@/hooks/useActiveTournament.hook";
import { errorMessage } from "@/lib/error.utils";

function RefreshButton() {
  const snapshot = useActiveTournamentSelector(activeTournamentSelectors.snapshot);
  const isRefreshing = useActiveTournamentSelector(activeTournamentSelectors.isRefreshing);
  const refreshError = useActiveTournamentSelector(activeTournamentSelectors.refreshError);
  const { refresh } = useActiveTournamentActions();
  const refreshErrorMessage = errorMessage(refreshError, "Не удалось обновить турнир с Challonge");
  const refreshFailed = refreshError !== null && refreshError !== undefined;
  const refreshLabel = refreshFailed
    ? (refreshErrorMessage ?? "Ошибка обновления")
    : "Обновить турнир";

  return (
    <Button
      size="icon"
      variant={refreshFailed ? "error" : "secondary"}
      className={refreshFailed ? "size-9 border-accent/60 bg-accent/10" : "size-9"}
      onClick={refresh}
      disabled={!snapshot || isRefreshing}
      aria-label={refreshLabel}
      title={refreshErrorMessage ?? "Обновить турнир с Challonge"}
    >
      {refreshFailed ? (
        <AlertTriangle className="size-4" />
      ) : (
        <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
      )}
    </Button>
  );
}

export default RefreshButton;
