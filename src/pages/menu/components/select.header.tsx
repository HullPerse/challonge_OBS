import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.component";
import { NO_TOURNAMENT_VALUE } from "@/configs/tournament.config";
import {
  activeTournamentSelectors,
  useActiveTournamentActions,
  useActiveTournamentSelector,
} from "@/hooks/useActiveTournament.hook";
import { usePrefetchTournament } from "@/hooks/useTournament.hook";
import { errorMessage } from "@/lib/error.utils";
import SelectStatus from "./selectStatus.header";

function SelectHeader() {
  const savedTournaments = useActiveTournamentSelector(activeTournamentSelectors.savedTournaments);
  const overlayState = useActiveTournamentSelector(activeTournamentSelectors.overlayState);
  const selecting = useActiveTournamentSelector(activeTournamentSelectors.selecting);
  const key = useActiveTournamentSelector(activeTournamentSelectors.key);
  const error = useActiveTournamentSelector(activeTournamentSelectors.error);
  const isLoading = useActiveTournamentSelector(activeTournamentSelectors.isLoading);
  const { selectTournament } = useActiveTournamentActions();
  const prefetchTournament = usePrefetchTournament();

  const selectItems = [
    { label: "Без турнира", value: NO_TOURNAMENT_VALUE },
    ...savedTournaments.map((item) => ({
      label: item.name,
      value: item.key,
    })),
  ];
  const selectValue = key ?? NO_TOURNAMENT_VALUE;

  const selectTournamentValue = (value: string | null) => {
    if (value === null) return;
    selectTournament(value === NO_TOURNAMENT_VALUE ? null : value);
  };

  const errorText = errorMessage(error, "Не удалось загрузить данные турнира");

  if (isLoading) return <SelectStatus variant="loading" />;

  if (errorText) return <SelectStatus variant="error" />;

  if (savedTournaments.length === 0) return <SelectStatus variant="empty" />;

  return (
    <Select
      items={selectItems}
      value={selectValue}
      onValueChange={selectTournamentValue}
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
          {savedTournaments.map((item) => (
            <SelectItem
              key={item.key}
              value={item.key}
              onPointerEnter={() => {
                prefetchTournament(item.key);
              }}
              onFocus={() => {
                prefetchTournament(item.key);
              }}
            >
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default SelectHeader;
