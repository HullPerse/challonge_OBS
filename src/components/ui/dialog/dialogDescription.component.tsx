import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm leading-relaxed text-text-muted *:[a]:text-accent *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-accent-hover",
        className,
      )}
      {...props}
    />
  );
}

export default DialogDescription;
