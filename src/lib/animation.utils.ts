import { OPEN_DURATION_MS } from "@/configs/animation.config";
import { animate, type JSAnimation } from "animejs";
import { prefersReducedMotion } from "./motion.utils";

export const playOpenAnimation = (popup: HTMLElement | null, isOpen: boolean): (() => void) => {
  let animation: JSAnimation | null = null;

  const cleanup = () => {
    animation?.cancel();
    animation = null;
  };

  const reducedMotion = prefersReducedMotion();

  if (popup === null || !isOpen || reducedMotion) return cleanup;

  popup.style.opacity = "0";
  animation = animate(popup, {
    opacity: [0, 1],
    scale: [0.97, 1],
    translateY: [6, 0],
    duration: OPEN_DURATION_MS,
    ease: "out(3)",
  });

  return cleanup;
};
