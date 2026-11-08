import { winnerSide } from "@/lib/bracket/match.utils";
import type { MatchDialogView } from "@/types/bracket";
import type { Match } from "@/types/tournament";
import MatchPlayer from "./player.match";
import { Clock, MapPin } from "lucide-react";

function MatchDetails({ match, view }: { match: Match; view: MatchDialogView }) {
  const winner = winnerSide(match);
  const showSchedule = view.schedule && match.scheduledTime !== null;
  const showStation = view.stations && match.station !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <MatchPlayer
          player={match.player1}
          placeholder={match.placeholder1}
          score={match.score1}
          winner={winner === "first"}
          view={view}
        />
        <MatchPlayer
          player={match.player2}
          placeholder={match.placeholder2}
          score={match.score2}
          winner={winner === "second"}
          view={view}
        />
      </div>

      {(showSchedule || showStation) && (
        <div className="flex flex-wrap gap-3 text-[11px] text-text-muted">
          {showSchedule && match.scheduledTime && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              {match.scheduledTime}
            </span>
          )}
          {showStation && match.station && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" aria-hidden="true" />
              Стол {match.station}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default MatchDetails;
