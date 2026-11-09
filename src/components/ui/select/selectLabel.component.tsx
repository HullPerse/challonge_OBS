import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        "px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-text-muted",
        className,
      )}
      {...props}
    />
  );
}

export default SelectLabel;
