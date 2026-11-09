import { cn } from "cn";
import type { ComponentProps } from "react";

function DialogHeader({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "-mx-6 -mt-6 flex flex-col gap-1.5 border-b border-black/20 px-6 pt-6 pr-14 pb-5",
        className,
      )}
      {...props}
    >
      {children}
      <span aria-hidden="true" className="mt-1.5 h-0.5 w-36 bg-accent" />
    </div>
  );
}

export default DialogHeader;
