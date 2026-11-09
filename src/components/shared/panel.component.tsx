import { DialogFooter, DialogHeader } from "@/components/ui/dialog.component";
import { cn } from "cn";
import type { ReactNode } from "react";

function DialogPanel({
  title,
  description,
  leading,
  children,
  footer,
  close,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  leading?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  close?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid w-full max-w-[calc(100vw-2rem)] gap-0 rounded-ui border border-black/25 bg-surface-panel p-6 text-sm text-text-secondary",
        className,
      )}
    >
      <DialogHeader>
        <div className="flex items-center gap-3">
          {leading && <div className="shrink-0">{leading}</div>}
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="truncate text-lg leading-tight font-semibold text-text-primary">
              {title}
            </h2>
            {description && (
              <p className="text-sm leading-relaxed text-text-muted">{description}</p>
            )}
          </div>
        </div>
      </DialogHeader>

      <div
        className={cn("max-h-[min(40rem,calc(100vh-2rem))] overflow-y-auto pt-5", contentClassName)}
      >
        {children}
      </div>

      {footer && <DialogFooter>{footer}</DialogFooter>}
      {close && <div className="absolute top-4 right-4">{close}</div>}
    </div>
  );
}

export default DialogPanel;
