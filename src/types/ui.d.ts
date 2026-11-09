export type SelectStatusVariant = "loading" | "error" | "empty";

export type ImageState = {
  src: string;
  finalSrc: string;
  isLoaded: boolean;
  retryKey: number;
};

export type BoxSize = {
  width: number;
  height: number;
};
