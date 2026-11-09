import { useState } from "react";
import { cn } from "cn";

import { Slider } from "@/components/ui/slider.component";
import { OVERLAY_CURSOR_SIZE } from "@/configs/overlay.config";

function CursorSizeRow({
  persistedSize,
  disabled,
  onCommit,
}: {
  persistedSize: number;
  disabled: boolean;
  onCommit: (value: number) => void;
}) {
  const [value, setValue] = useState<number>(persistedSize);

  return (
    <div className="rounded-ui px-2 py-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-secondary">Размер курсора</span>
        <button
          type="button"
          onClick={() => {
            if (value === OVERLAY_CURSOR_SIZE.default) return;
            setValue(OVERLAY_CURSOR_SIZE.default);
            onCommit(OVERLAY_CURSOR_SIZE.default);
          }}
          className={cn(
            "text-[10px] tabular-nums",
            value === OVERLAY_CURSOR_SIZE.default
              ? "text-text-muted"
              : "text-accent hover:cursor-pointer hover:underline",
          )}
        >
          {value} px
        </button>
      </div>
      <Slider
        value={value}
        min={OVERLAY_CURSOR_SIZE.min}
        max={OVERLAY_CURSOR_SIZE.max}
        step={OVERLAY_CURSOR_SIZE.step}
        label="Размер курсора"
        disabled={disabled}
        onValueChange={(next) => {
          setValue(next);
        }}
        onValueCommitted={onCommit}
      />
    </div>
  );
}

export default CursorSizeRow;
