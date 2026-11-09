import { cn } from "cn";

import { errorMessage } from "@/lib/error.utils";

function VisibilityError({ error, className }: { error: unknown; className?: string }) {
  const message = errorMessage(error, "Не удалось сохранить скрытые матчи");

  if (!message) return null;

  return (
    <p role="alert" className={cn("text-xs text-accent", className)}>
      {message}
    </p>
  );
}

export default VisibilityError;
