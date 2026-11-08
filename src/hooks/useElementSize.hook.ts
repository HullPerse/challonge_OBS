import { useEffect, useRef, useState } from "react";

/** Tracks the rendered size of an element via ResizeObserver. */
export const useElementSize = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries.at(0);
      if (!entry) return;

      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    if (element) observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, size };
};
