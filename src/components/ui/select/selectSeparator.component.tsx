import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export default SelectSeparator;
