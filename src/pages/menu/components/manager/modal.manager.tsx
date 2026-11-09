import HiddenHeader from "@/pages/menu/components/hidden.header";
import ImportHeader from "@/pages/menu/components/manager/import.manager";
import ManagerHeader from "@/pages/menu/components/manager/header.manager";
import { modalStore } from "@/stores/modal.store";
import type { TournamentSnapshot } from "@/types/tournament";

function openTournamentModal(mode: "manager" | "import"): void {
  if (mode === "manager") {
    modalStore.open({
      title: "Турниры",
      description: "Управление турнирами",
      className: "w-xl",
      body: (
        <ManagerHeader
          onAdd={() => {
            openTournamentModal("import");
          }}
        />
      ),
    });
    return;
  }

  modalStore.open({
    title: "Добавить турнир",
    description: "Ссылка Challonge или HTML страницы турнира",
    className: "w-xl",
    body: (
      <ImportHeader
        onBack={() => {
          openTournamentModal("manager");
        }}
      />
    ),
  });
}

const openManagerModal = (): void => {
  openTournamentModal("manager");
};

const openHiddenModal = (snapshot: TournamentSnapshot): void => {
  modalStore.open({
    title: "Скрытые матчи и раунды",
    className: "w-lg",
    body: <HiddenHeader snapshot={snapshot} />,
  });
};

export { openHiddenModal, openManagerModal };
