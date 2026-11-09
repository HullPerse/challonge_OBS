import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-tight font-semibold text-text-primary", className)}
      {...props}
    />
  );
}

export default DialogTitle;
