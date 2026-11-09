import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { XIcon } from "lucide-react";

import Button from "@/components/ui/button.component";
import DialogOverlay from "@/components/ui/dialog/dialogOverlay.component";
import DialogPortal from "@/components/ui/dialog/dialogPortal.component";

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn("pointer-events-auto relative z-50 w-fit outline-none", className)}
          {...props}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              render={
                <Button
                  variant="ghost"
                  className="absolute top-4 right-4 size-8 text-text-muted hover:text-text-primary"
                  size="icon"
                >
                  <XIcon />
                  <span className="sr-only">Закрыть</span>
                </Button>
              }
            />
          )}
        </DialogPrimitive.Popup>
      </div>
    </DialogPortal>
  );
}

export default DialogContent;
