import type { MatchCardView } from "@/types/bracket";
import type { Match } from "@/types/tournament";

function MatchNumber({ match, view }: { match: Match; view: MatchCardView }) {
  if (!view.matchNumbers || match.identifier === null) return null;

  return (
    <span className="absolute top-1.5 -left-6 w-6 text-center text-[10px] leading-none tabular-nums text-bracket-muted">
      {match.identifier}
    </span>
  );
}

export default MatchNumber;
