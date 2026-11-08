/** Motion is optional feedback, so every animation checks the user preference first. */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
