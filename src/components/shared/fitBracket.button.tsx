import { Maximize2 } from "lucide-react";

import Button from "@/components/ui/button.component";
import { CARD_GAP, FIT_BRACKET_LABEL, FIT_BRACKET_TITLE } from "@/configs/bracket.config";

function FitBracketButton({ onFit }: { onFit: () => void }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onFit}
      className="absolute top-0 right-0 h-full gap-1.5 rounded-none border-y-0 border-r-0 border-l border-border-strong bg-surface-panel px-2 text-[11px] text-text-primary hover:bg-surface-hover"
      style={{ width: CARD_GAP }}
      title={FIT_BRACKET_TITLE}
    >
      <Maximize2 className="size-3.5" />
      {FIT_BRACKET_LABEL}
    </Button>
  );
}

export default FitBracketButton;
