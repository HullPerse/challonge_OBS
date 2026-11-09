import DialogPanel from "@/components/shared/panel.component";
import type { ReactNode } from "react";

function OverlayDialogFrame({
  title,
  description,
  leading,
  children,
}: {
  title: string;
  description: string;
  leading?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-scrim/85 p-4">
      <DialogPanel title={title} description={description} leading={leading} className="w-lg">
        {children}
      </DialogPanel>
    </div>
  );
}

export default OverlayDialogFrame;
