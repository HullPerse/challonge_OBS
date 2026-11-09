import { useActiveTournamentSync } from "@/hooks/useActiveTournament.hook";
import MenuContent from "./menu/content.menu";

function MenuPage() {
  useActiveTournamentSync();

  return <MenuContent />;
}

export default MenuPage;
