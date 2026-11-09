import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";
import { ChevronUpIcon } from "lucide-react";
import type { ComponentProps } from "react";

function SelectScrollUpButton({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center border-b border-border bg-surface-menu py-1 text-text-muted [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  );
}

export default SelectScrollUpButton;
