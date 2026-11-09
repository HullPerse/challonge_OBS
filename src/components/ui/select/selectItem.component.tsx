import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "cn";
import { CheckIcon } from "lucide-react";

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-none py-2 pr-8 pl-3 text-sm text-text-secondary outline-none select-none focus:bg-surface-panel data-highlighted:bg-surface-panel data-highlighted:text-text-primary data-selected:font-medium data-selected:text-text-primary data-disabled:pointer-events-none data-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 disabled:hover:cursor-not-allowed hover:cursor-pointer",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-3 flex size-4 items-center justify-center text-accent">
            <CheckIcon className="pointer-events-none" />
          </span>
        }
      />
    </SelectPrimitive.Item>
  );
}

export default SelectItem;
