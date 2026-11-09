import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-ui border border-border-strong bg-surface-panel pr-3 pl-3 text-sm text-text-primary whitespace-nowrap transition-colors duration-100 outline-none select-none hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-accent data-placeholder:text-text-muted data-[size=default]:h-9.5 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 disabled:hover:cursor-not-allowed hover:cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={<ChevronDownIcon className="pointer-events-none size-4 text-text-muted" />}
      />
    </SelectPrimitive.Trigger>
  );
}

export default SelectTrigger;
