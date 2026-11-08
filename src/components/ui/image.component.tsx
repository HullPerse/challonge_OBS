import { cn } from "cn";
import { memo, useCallback, useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

import { scheduleTask } from "@hullperse/hp_utils/shared";
import type { ScheduledTask } from "@hullperse/hp_utils/types";

import { RETRY_DELAYS } from "@/configs/ui.config";
import type { ImageState } from "@/types/ui";

const Image = ({
  src,
  alt,
  className,
  width,
  height,
  type = "cover",
  onLoad,
  onError,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  type?: "cover" | "contain";
}) => {
  const [state, setState] = useState<ImageState>({
    src,
    finalSrc: src,
    isLoaded: false,
    retryKey: 0,
  });

  const currentState =
    state.src === src
      ? state
      : {
          src,
          finalSrc: src,
          isLoaded: false,
          retryKey: 0,
        };

  const attemptRef = useRef<number>(0);
  const srcRef = useRef<string>(src);
  const timerRef = useRef<ScheduledTask | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    srcRef.current = src;
    attemptRef.current = 0;

    return () => {
      timerRef.current?.cancel();
      timerRef.current = null;
    };
  }, [src]);

  const handleLoad = useCallback(() => {
    setState((previous) => {
      if (previous.src !== src) return previous;

      return {
        ...previous,
        isLoaded: true,
      };
    });
  }, [src]);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (e.currentTarget.getAttribute("src") !== srcRef.current) return;

      const attempt = attemptRef.current + 1;
      attemptRef.current = attempt;

      if (attempt <= RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[attempt - 1] ?? 1000;

        timerRef.current?.cancel();
        timerRef.current = scheduleTask("timeout", delay, () => {
          setState((previous) => {
            if (previous.src !== src) return previous;

            return {
              ...previous,
              retryKey: previous.retryKey + 1,
            };
          });
        });
      } else {
        setState((previous) => {
          if (previous.src !== src) return previous;

          return {
            ...previous,
            finalSrc: "",
          };
        });
      }
    },
    [src],
  );

  const { finalSrc, isLoaded, retryKey } = currentState;

  return (
    <div
      className={cn("relative flex w-full items-center overflow-hidden", className)}
      aria-busy={!isLoaded && Boolean(finalSrc)}
      style={{
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      {finalSrc ? (
        <>
          {!isLoaded && (
            <div
              className="bg-surface-elevated absolute inset-0 animate-pulse motion-reduce:animate-none"
              aria-hidden
            />
          )}

          <img
            key={retryKey}
            ref={imgRef}
            src={finalSrc}
            alt={alt}
            width={width}
            height={height}
            referrerPolicy="no-referrer"
            className={cn(
              "absolute inset-0 h-full w-full transition-opacity duration-200",
              type === "cover" ? "object-cover" : "object-contain",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
            loading="lazy"
            decoding="async"
            {...props}
            onLoad={(event) => {
              handleLoad();
              onLoad?.(event);
            }}
            onError={(event) => {
              handleError(event);
              onError?.(event);
            }}
          />
        </>
      ) : (
        <div
          className="border-border bg-surface-sunken flex h-full w-full items-center justify-center border"
          aria-label={alt}
        >
          <span className="text-xs text-text-muted">{alt.toUpperCase()}</span>
        </div>
      )}
    </div>
  );
};

export default memo(Image);
