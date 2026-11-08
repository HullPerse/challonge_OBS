import type { ReactNode } from "react";

import type { OverlayModal } from "@/types/overlay";

export type ModalContent = {
  /** Overlay mirror of this dialog; omitted for control-panel-only dialogs. */
  overlay?: OverlayModal;
  title: string;
  description?: string;
  leading?: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};
