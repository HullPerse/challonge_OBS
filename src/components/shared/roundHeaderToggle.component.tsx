import { cn } from "cn";
import type { CSSProperties } from "react";

import { ROUND_ACTION_LABELS } from "@/configs/bracket.config";

function RoundHeaderToggle({
  title,
  hidden,
  className,
  style,
  onToggle,
}: {
  title: string;
  hidden: boolean;
  className: string;
  style: CSSProperties;
  onToggle?: () => void;
}) {
  const actionLabel = hidden ? ROUND_ACTION_LABELS.show : ROUND_ACTION_LABELS.hide;
  const classes = cn(
    className,
    hidden && "line-through opacity-40",
    onToggle &&
      "transition-colors hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent",
  );

  if (!onToggle) {
    return (
      <span className={classes} style={style}>
        {title}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={!hidden}
      aria-label={`${title}. ${actionLabel}`}
      onClick={onToggle}
      className={classes}
      style={style}
      title={actionLabel}
    >
      {title}
    </button>
  );
}

export default RoundHeaderToggle;
