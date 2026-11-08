import Button from "@/components/ui/button.component";
import ImageComponent from "@/components/ui/image.component";
import { ORGANIZATOR_NAME } from "@/configs/tournament.config";
import {
  ExternalLink,
  EyeOff,
  List,
  RefreshCw,
  SidebarClose,
  SidebarOpen,
  SlidersHorizontal,
} from "lucide-react";
import SelectHeader from "./components/select.header";
import { useActiveTournamentContext } from "@/components/shared/activeTournament.provider";
import { useVisibility } from "@/hooks/useVisibility.hook";
import { errorMessage } from "@/lib/error.utils";
import { modalStore } from "@/stores/modal.store";
import HiddenHeader from "./components/hidden.header";
import ManagerHeader from "./components/manager/header.manager";
import ImportHeader from "./components/manager/import.manager";

const menuModal = {
  manager: () => {
    modalStore.open({
      title: "Турниры",
      description: "Управление турнирами",
      className: "w-xl",
      body: <ManagerHeader onAdd={menuModal.import} />,
    });
  },
  import: () => {
    modalStore.open({
      title: "Добавить турнир",
      description: "Ссылка Challonge или HTML страницы турнира",
      className: "w-xl",
      body: <ImportHeader onBack={menuModal.manager} />,
    });
  },
};

function HeaderMenu({
  sidebar,
  onSidebar,
  overlayPanel,
  onOverlayPanel,
}: {
  sidebar: boolean;
  onSidebar: () => void;
  overlayPanel: boolean;
  onOverlayPanel: () => void;
}) {
  const { isRefreshing, refresh, snapshot, refreshError } = useActiveTournamentContext();
  const { hiddenCount } = useVisibility(snapshot?.slug ?? null);

  const refreshErrorMessage = errorMessage(refreshError, "Не удалось обновить турнир с Challonge");

  const openHidden = () => {
    if (!snapshot) return;

    modalStore.open({
      title: "Скрытые матчи и раунды",
      className: "w-lg",
      body: <HiddenHeader snapshot={snapshot} />,
    });
  };

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center h-14 border-b border-border bg-surface p-2">
      {/* LEFT */}
      <section className="flex flex-row gap-2 justify-self-start items-center">
        <Button
          className="size-8"
          size="icon"
          variant="secondary"
          onClick={() => {
            onSidebar();
          }}
          disabled={!snapshot}
        >
          {sidebar ? <SidebarClose className="size-4" /> : <SidebarOpen className="size-4" />}
        </Button>

        {/* ORGANIZER */}
        <div className="hidden md:flex flex-row h-8 w-fit bg-background border border-border gap-1 pr-1 items-center text-center rounded-ui">
          <ImageComponent
            src="/podpivasgaming.png"
            alt="Organizer"
            className="h-full aspect-square"
          />
          <span className="text-md text-text-muted">{ORGANIZATOR_NAME}</span>
        </div>
      </section>

      {/* MIDDLE */}
      <section className="flex flex-row gap-2 justify-self-center items-center">
        <SelectHeader />
        <Button
          size="icon"
          variant="secondary"
          className="size-9"
          onClick={refresh}
          disabled={!snapshot || isRefreshing}
          title={refreshErrorMessage ?? "Обновить турнир с Challonge"}
        >
          <RefreshCw className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </section>

      {/* RIGHT */}
      <section className="flex flex-row gap-2 justify-self-end items-center">
        {snapshot && hiddenCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={openHidden}
            title="Скрытые матчи и раунды"
            aria-label={`Скрытые матчи и раунды: ${hiddenCount}`}
          >
            <EyeOff className="size-3.5" />
            <span className="tabular-nums">{hiddenCount}</span>
          </Button>
        )}

        <Button size="icon" variant="default" className="size-9" onClick={menuModal.manager}>
          <List className="size-4" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className="size-9"
          onClick={() => {
            window.open("/overlay", "_blank");
          }}
        >
          <ExternalLink className="size-4" />
        </Button>

        <Button
          size="icon"
          variant="secondary"
          className="size-9"
          onClick={onOverlayPanel}
          aria-pressed={overlayPanel}
          aria-controls="overlay-settings-panel"
          aria-label={overlayPanel ? "Скрыть настройки оверлея" : "Показать настройки оверлея"}
          title={overlayPanel ? "Скрыть настройки оверлея" : "Показать настройки оверлея"}
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </section>
    </header>
  );
}

export default HeaderMenu;
