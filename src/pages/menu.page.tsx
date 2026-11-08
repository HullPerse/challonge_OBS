import { useState } from "react";

import {
  ActiveTournamentProvider,
  useActiveTournamentContext,
} from "@/components/shared/activeTournament.provider";
import Modal from "@/components/shared/modal.component";
import RenderBracket from "./menu/components/bracket/render.bracket";
import OverlayPanel from "./menu/components/overlay/panel.overlay";
import HeaderMenu from "./menu/header.menu";
import SidebarMenu from "./menu/sidebar.menu";

function MenuContent() {
  const { snapshot, overlayState, isLoading, error } = useActiveTournamentContext();
  const [sidebar, setSidebar] = useState<boolean>(false);
  const [overlayPanel, setOverlayPanel] = useState<boolean>(false);

  return (
    <main className="flex h-full w-full flex-col overflow-hidden">
      {/* HEADER */}
      <HeaderMenu
        sidebar={sidebar}
        onSidebar={() => {
          setSidebar((previous) => !previous);
        }}
        overlayPanel={overlayPanel}
        onOverlayPanel={() => {
          setOverlayPanel((previous) => !previous);
        }}
      />

      <section className="flex min-h-0 w-full flex-1 flex-row">
        {/* PLAYERS */}
        <div className="flex h-full">
          {snapshot && sidebar && <SidebarMenu snapshot={snapshot} />}
        </div>

        {/* BRACKET */}
        <section className="flex min-w-0 flex-1 items-center justify-center">
          <RenderBracket />
        </section>

        {/* OVERLAY MODULES */}
        {overlayPanel && <OverlayPanel state={overlayState} isLoading={isLoading} error={error} />}
      </section>

      {/* MODAL */}
      <Modal />
    </main>
  );
}

function MenuPage() {
  return (
    <ActiveTournamentProvider>
      <MenuContent />
    </ActiveTournamentProvider>
  );
}

export default MenuPage;
