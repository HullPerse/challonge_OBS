import { Clock, MapPin } from "lucide-react";

import { STATION_PREFIX } from "@/configs/bracket.config";
import type { MatchCardView } from "@/types/bracket";
import type { Match } from "@/types/tournament";

function MatchMeta({ match, view }: { match: Match; view: MatchCardView }) {
  if (match.scheduledTime === null && match.station === null) return null;

  return (
    <span
      className="absolute inset-x-0 flex items-center justify-center gap-2 text-[10px] whitespace-nowrap text-text-secondary"
      style={{ bottom: "calc(100% + 4px)" }}
    >
      {view.stations && match.station && (
        <span className="flex items-center gap-1">
          <MapPin className="size-2.5" />
          {STATION_PREFIX} {match.station}
        </span>
      )}
      {view.schedule && match.scheduledTime && (
        <span className="flex items-center gap-1">
          <Clock className="size-2.5" />
          {match.scheduledTime}
        </span>
      )}
    </span>
  );
}

export default MatchMeta;
