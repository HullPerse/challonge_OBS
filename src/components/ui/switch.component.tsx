import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-ui border p-0.5 transition-colors duration-100 outline-none select-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:outline-2 focus-visible:outline-accent data-checked:border-accent data-checked:bg-accent data-unchecked:border-border-strong data-unchecked:bg-surface-sunken data-disabled:cursor-not-allowed data-disabled:opacity-45 aria-invalid:border-accent data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 hover:cursor-pointer",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-[1px] bg-text-secondary transition-transform duration-100 group-data-checked/switch:bg-accent-ink group-data-[size=default]/switch:size-3.5 group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:size-2.5 group-data-[size=sm]/switch:data-checked:translate-x-3"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
