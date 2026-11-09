import { useCell } from "@hullperse/hp_utils/react";

import Modal from "@/components/shared/modal.component";
import {
  activeTournamentSelectors,
  useActiveTournamentSelector,
} from "@/hooks/useActiveTournament.hook";
import { menuStore } from "@/stores/menu.store";
import RenderBracket from "./components/bracket/render.bracket";
import OverlayPanel from "./components/overlay/panel.overlay";
import HeaderMenu from "./header.menu";
import SidebarMenu from "./sidebar.menu";

function MenuContent() {
  const snapshot = useActiveTournamentSelector(activeTournamentSelectors.snapshot);
  const overlayState = useActiveTournamentSelector(activeTournamentSelectors.overlayState);
  const isLoading = useActiveTournamentSelector(activeTournamentSelectors.isLoading);
  const error = useActiveTournamentSelector(activeTournamentSelectors.error);
  const sidebarOpen = useCell(menuStore.sidebarOpen);
  const overlayPanelOpen = useCell(menuStore.overlayPanelOpen);

  return (
    <main className="flex h-full w-full flex-col overflow-hidden">
      {/* HEADER */}
      <HeaderMenu />

      <section className="flex min-h-0 w-full flex-1 flex-row">
        {/* PLAYERS */}
        <div className="flex h-full">
          {snapshot && sidebarOpen && <SidebarMenu snapshot={snapshot} />}
        </div>

        {/* BRACKET */}
        <section className="flex min-w-0 flex-1 items-center justify-center">
          <RenderBracket />
        </section>

        {/* OVERLAY MODULES */}
        {overlayPanelOpen && (
          <OverlayPanel state={overlayState} isLoading={isLoading} error={error} />
        )}
      </section>

      {/* MODAL */}
      <Modal />
    </main>
  );
}

export default MenuContent;
