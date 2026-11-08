import { createContext, useContext, type ReactNode } from "react";

import { useActiveTournament } from "@/hooks/useActiveTournament.hook";

type ActiveTournamentValue = ReturnType<typeof useActiveTournament>;

const ActiveTournamentContext = createContext<ActiveTournamentValue | null>(null);

export const ActiveTournamentProvider = ({ children }: { children: ReactNode }) => {
  const value = useActiveTournament();

  return (
    <ActiveTournamentContext.Provider value={value}>{children}</ActiveTournamentContext.Provider>
  );
};

export const useActiveTournamentContext = (): ActiveTournamentValue => {
  const value = useContext(ActiveTournamentContext);

  if (!value) {
    throw new Error("useActiveTournamentContext requires ActiveTournamentProvider");
  }

  return value;
};
