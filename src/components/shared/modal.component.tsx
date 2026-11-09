import { useLayoutEffect, useRef } from "react";
import { useCell } from "@hullperse/hp_utils/react";
import { XIcon } from "lucide-react";

import Button from "@/components/ui/button.component";
import DialogPanel from "@/components/shared/panel.component";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog.component";
import { useModalResize } from "@/hooks/useModalResize.hook";
import { modalStore } from "@/stores/modal.store";
import { playOpenAnimation } from "@/lib/animation.utils";

const Modal = () => {
  const content = useCell(modalStore.content);
  const isOpen = useCell(modalStore.isOpen);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useModalResize(popupRef, isOpen);

  useLayoutEffect(() => playOpenAnimation(popupRef.current, isOpen), [isOpen]);

  if (!content) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) modalStore.close();
      }}
    >
      <DialogContent
        ref={popupRef}
        showCloseButton={false}
        aria-label={content.title}
        className="w-fit"
      >
        <DialogPanel
          title={content.title}
          description={content.description}
          leading={content.leading}
          className={content.className}
          contentClassName={content.contentClassName}
          footer={content.footer}
          close={
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  className="size-8 text-text-muted hover:text-text-primary"
                  size="icon"
                >
                  <XIcon />
                  <span className="sr-only">Закрыть</span>
                </Button>
              }
            />
          }
        >
          {content.body}
        </DialogPanel>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
