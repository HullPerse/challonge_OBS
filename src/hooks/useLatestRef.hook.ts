import { useEffect, useRef } from "react";

/** Keeps a ref in sync with the latest render value. */
export const useLatestRef = <T>(value: T) => {
  const ref = useRef<T>(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
};
