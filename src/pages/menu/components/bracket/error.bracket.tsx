import { AlertTriangle, RefreshCw } from "lucide-react";

import Button from "@/components/ui/button.component";
import StatePanel from "./state.bracket";

function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <StatePanel>
      <AlertTriangle className="size-7 text-accent" />
      <h2 className="text-sm font-medium text-text-primary">{title}</h2>
      <p className="max-w-md text-xs leading-relaxed text-text-muted">{message}</p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        <RefreshCw className="size-3.5" />
        Повторить
      </Button>
    </StatePanel>
  );
}

export default ErrorState;
