import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";

const Slider = ({
  defaultValue,
  min,
  max,
  step,
  label,
  disabled = false,
  className,
  onValueChange,
  onValueCommitted,
}: {
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  label: string;
  disabled?: boolean;
  className?: string;
  onValueChange: (value: number) => void;
  onValueCommitted: (value: number) => void;
}) => (
  <SliderPrimitive.Root
    defaultValue={defaultValue}
    min={min}
    max={max}
    step={step}
    disabled={disabled}
    onValueChange={onValueChange}
    onValueCommitted={onValueCommitted}
    className={cn("relative flex w-full touch-none items-center", className)}
  >
    <SliderPrimitive.Control className="flex w-full items-center py-1.5">
      <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full border border-border bg-surface-sunken">
        <SliderPrimitive.Indicator className="absolute h-full rounded-full bg-accent" />
        <SliderPrimitive.Thumb
          getAriaLabel={() => label}
          className="block size-3.5 rounded-ui border border-border-strong bg-surface-elevated outline-none focus-visible:outline-2 focus-visible:outline-accent data-dragging:border-accent"
        />
      </SliderPrimitive.Track>
    </SliderPrimitive.Control>
  </SliderPrimitive.Root>
);

export { Slider };
