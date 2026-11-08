import { Eye, EyeOff } from "lucide-react";

import MatchDetails from "@/components/match/details.match";
import Button from "@/components/ui/button.component";
import { useAppDialogView } from "@/hooks/useOverlayPreview.hook";
import { useVisibility } from "@/hooks/useVisibility.hook";
import type { Match, TournamentSnapshot } from "@/types/tournament";

function DetailsBracket({ snapshot, match }: { snapshot: TournamentSnapshot; match: Match }) {
  const { hiddenMatches, toggleMatch } = useVisibility(snapshot.slug);
  const view = useAppDialogView(snapshot);
  const hidden = hiddenMatches.has(match.id);

  return (
    <div className="flex flex-col gap-3">
      <MatchDetails match={match} view={view} />

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <Button
          variant="secondary"
          className="ml-auto"
          onClick={() => {
            toggleMatch(match.id);
          }}
        >
          {hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          {hidden ? "Показать матч" : "Скрыть матч"}
        </Button>
      </div>
    </div>
  );
}

export default DetailsBracket;
