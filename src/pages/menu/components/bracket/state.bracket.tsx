import type { ReactNode } from "react";

function StatePanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      {children}
    </div>
  );
}

export default StatePanel;
