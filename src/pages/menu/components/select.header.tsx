import Loader from "@/components/ui/loader.component";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.component";
import { NO_TOURNAMENT_VALUE } from "@/configs/tournament.config";
import { useActiveTournamentContext } from "@/components/shared/activeTournament.provider";
import { errorMessage } from "@/lib/error.utils";
import type { TournamentSummary } from "@/types/tournament";
import { useMemo } from "react";

function SelectHeader() {
  const {
    savedTournaments,
    selectTournament,
    overlayState,
    selecting,
    slug,
    error,
    isLoading,
    isRefreshing,
    isEmpty,
  } = useActiveTournamentContext();

  const selectItems = useMemo(
    () => [
      { label: "Без турнира", value: NO_TOURNAMENT_VALUE },
      ...savedTournaments.map((item: TournamentSummary) => ({
        label: item.name,
        value: item.slug,
      })),
    ],
    [savedTournaments],
  );
  const selectValue = slug ?? NO_TOURNAMENT_VALUE;

  const selectedTournament = (value: string | null) => {
    if (!value) return;
    selectTournament(value === NO_TOURNAMENT_VALUE ? null : value);
  };

  const errorText = errorMessage(error, "Не удалось загрузить данные турнира");

  if (isLoading || isRefreshing)
    return (
      <div className="border border-border h-10 items-center flex flex-row px-2 truncate md:text-[16px] text-xs text-accent font-bol gap-2">
        <Loader className="size-4" /> Загрузка турниров…
      </div>
    );

  if (errorText)
    return (
      <span className="border border-border h-10 items-center flex flex-row px-2 truncate md:text-xl text-xs text-accent font-bold">
        Нет связи с сервером
      </span>
    );

  if (savedTournaments.length === 0 || isEmpty)
    return (
      <span className="border border-border h-10 items-center flex flex-row px-2 truncate md:text-xl text-xs text-accent font-bold">
        Нет турниров
      </span>
    );

  return (
    <Select
      items={selectItems}
      value={selectValue}
      onValueChange={selectedTournament}
      disabled={!overlayState || selecting}
    >
      <SelectTrigger
        className="h-8 w-[min(420px,42vw)] min-w-0 px-3 text-xs"
        aria-label="Активный турнир"
      >
        <SelectValue placeholder="Выберите турнир" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={NO_TOURNAMENT_VALUE}>
            <span className="min-w-0 flex-1 truncate text-text-muted">Без турнира</span>
          </SelectItem>
          {savedTournaments.map((item: TournamentSummary) => (
            <SelectItem key={item.slug} value={item.slug}>
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default SelectHeader;
