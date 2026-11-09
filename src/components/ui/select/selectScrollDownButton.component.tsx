import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";

function SelectScrollDownButton({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center border-t border-border bg-surface-menu py-1 text-text-muted [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export default SelectScrollDownButton;
