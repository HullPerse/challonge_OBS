import { useCell } from "@hullperse/hp_utils/react";
import {
  ExternalLink,
  EyeOff,
  List,
  SidebarClose,
  SidebarOpen,
  SlidersHorizontal,
} from "lucide-react";

import Button from "@/components/ui/button.component";
import ImageComponent from "@/components/ui/image.component";
import { ORGANIZATOR_NAME } from "@/configs/tournament.config";
import {
  activeTournamentSelectors,
  useActiveTournamentSelector,
} from "@/hooks/useActiveTournament.hook";
import { useVisibility } from "@/hooks/useVisibility.hook";
import { menuStore } from "@/stores/menu.store";
import RefreshButton from "./components/refresh.button";
import SelectHeader from "./components/select.header";
import { openHiddenModal, openManagerModal } from "./components/manager/modal.manager";

function HeaderMenu() {
  const snapshot = useActiveTournamentSelector(activeTournamentSelectors.snapshot);
  const sidebar = useCell(menuStore.sidebarOpen);
  const overlayPanel = useCell(menuStore.overlayPanelOpen);
  const { hiddenCount } = useVisibility(snapshot?.key ?? null);
  const overlayPanelLabel = overlayPanel
    ? "Скрыть настройки оверлея"
    : "Показать настройки оверлея";

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center h-14 border-b border-border bg-surface p-2">
      {/* LEFT */}
      <section className="flex flex-row gap-2 justify-self-start items-center">
        <Button
          className="size-8"
          size="icon"
          variant="secondary"
          onClick={() => {
            menuStore.sidebarOpen.update((open) => !open);
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
        <RefreshButton />
      </section>

      {/* RIGHT */}
      <section className="flex flex-row gap-2 justify-self-end items-center">
        {snapshot && hiddenCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              openHiddenModal(snapshot);
            }}
            title="Скрытые матчи и раунды"
            aria-label={`Скрытые матчи и раунды: ${hiddenCount}`}
          >
            <EyeOff className="size-3.5" />
            <span className="tabular-nums">{hiddenCount}</span>
          </Button>
        )}

        <Button size="icon" variant="default" className="size-9" onClick={openManagerModal}>
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
          onClick={() => {
            menuStore.overlayPanelOpen.update((open) => !open);
          }}
          aria-pressed={overlayPanel}
          aria-controls="overlay-settings-panel"
          aria-label={overlayPanelLabel}
          title={overlayPanelLabel}
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </section>
    </header>
  );
}

export default HeaderMenu;
