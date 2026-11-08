import Button from "@/components/ui/button.component";
import Loader from "@/components/ui/loader.component";
import TournamentRow from "./tournament.manager";
import { useActiveTournamentContext } from "@/components/shared/activeTournament.provider";
import { useTournamentList } from "@/hooks/useTournamentList.hook";
import { modalStore } from "@/stores/modal.store";
import { Plus } from "lucide-react";

function ManagerHeader({ onAdd }: { onAdd: () => void }) {
  const { slug, selectTournament } = useActiveTournamentContext();
  const {
    items,
    isPending,
    errorText,
    deleteErrorText,
    refreshErrorText,
    pendingDelete,
    deleting,
    refreshingSlug,
    askDelete,
    cancelDelete,
    refreshTournament,
    confirmDelete,
  } = useTournamentList();

  const choose = (next: string) => {
    selectTournament(next);
    modalStore.close();
  };

  const getComponent = () => {
    if (isPending) {
      return (
        <div className="flex justify-center py-10">
          <Loader className="size-5 text-text-muted" />
        </div>
      );
    }

    if (errorText) {
      return <p className="py-6 text-sm text-accent">{errorText}</p>;
    }

    if (items.length === 0) {
      return <p className="py-6 text-sm text-text-muted">Турниров нет</p>;
    }

    return (
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <TournamentRow
            key={item.slug}
            item={item}
            active={item.slug === slug}
            confirming={pendingDelete === item.slug}
            deleting={deleting}
            refreshing={refreshingSlug === item.slug}
            onSelect={choose}
            onRefresh={refreshTournament}
            onAskDelete={askDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
          />
        ))}
      </ul>
    );
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-end">
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <Plus className="size-3.5" />
          Добавить турнир
        </Button>
      </div>

      {getComponent()}

      {deleteErrorText && <p className="text-xs text-accent">{deleteErrorText}</p>}

      {refreshErrorText && <p className="text-xs text-accent">{refreshErrorText}</p>}
    </div>
  );
}

export default ManagerHeader;
