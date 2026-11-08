export type SseClient = {
  write: (chunk: string) => boolean;
  close: () => void;
};

export type SseHubOptions = {
  heartbeatMs?: number;
};
