import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import type { ComponentProps } from "react";

import Button from "@/components/ui/button.component";

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-6 -mb-6 mt-6 flex flex-col-reverse gap-2 border-t border-black/20 px-6 py-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          render={
            <Button variant="ghost" className="rounded-ui">
              Закрыть
            </Button>
          }
        />
      )}
    </div>
  );
}

export default DialogFooter;
