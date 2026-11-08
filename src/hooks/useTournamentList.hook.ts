import { useState } from "react";
import { errorMessage } from "@/lib/error.utils";
import {
  useDeleteTournament,
  useRefreshTournamentBySlug,
  useSavedTournaments,
} from "./useTournament.hook";

/** Saved tournament list with delete/refresh state for the manager modal. */
export const useTournamentList = () => {
  const saved = useSavedTournaments();
  const remove = useDeleteTournament();
  const refresh = useRefreshTournamentBySlug();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const items = saved.data ?? [];

  const refreshTournament = (target: string) => {
    refresh.reset();
    refresh.mutate(target);
  };

  const confirmDelete = (target: string) => {
    remove.reset();
    remove.mutate(target, {
      onSuccess: () => {
        setPendingDelete(null);
      },
    });
  };

  return {
    items,
    isPending: saved.isPending,
    errorText: errorMessage(saved.error, "Не удалось загрузить турниры"),
    deleteErrorText: errorMessage(remove.error, "Не удалось удалить турнир"),
    refreshErrorText: errorMessage(refresh.error, "Не удалось обновить турнир"),
    pendingDelete,
    deleting: remove.isPending,
    refreshingSlug: refresh.isPending ? refresh.variables : null,
    askDelete: (slug: string) => {
      setPendingDelete(slug);
    },
    cancelDelete: () => {
      setPendingDelete(null);
    },
    refreshTournament,
    confirmDelete,
  };
};
