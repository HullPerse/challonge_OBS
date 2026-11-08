import { API_BASE_PATH } from "@/configs/api.config";
import HttpApi from "@/lib/http.utils";
import { overlayEventSchema, overlayModulesSchema, overlayStateSchema } from "@/lib/schemas/overlay.schema";
import type { OverlayStreamHandlers } from "@/types/api";
import type {
  OverlayFocusPatch,
  OverlayModules,
  OverlayModulesPatch,
  OverlayPointer,
  OverlayPointerSizeInput,
  OverlaySetViewInput,
  OverlayState,
} from "@/types/overlay";
import { attemptSync } from "@hullperse/hp_utils/attempt";

const parseOverlayState = (value: unknown): OverlayState => overlayStateSchema.parse(value);
const parseOverlayModules = (value: unknown): OverlayModules => overlayModulesSchema.parse(value);

export default class OverlayApi {
  private readonly http: HttpApi;

  constructor(http: HttpApi = new HttpApi()) {
    this.http = http;
  }

  getState(): Promise<OverlayState> {
    return this.http.get("/overlay/state", "Не удалось загрузить состояние оверлея", parseOverlayState);
  }

  getModules(): Promise<OverlayModules> {
    return this.http.get("/overlay/modules", "Не удалось загрузить модули оверлея", parseOverlayModules);
  }

  setView(input: OverlaySetViewInput): Promise<OverlayState> {
    return this.http.put(
      "/overlay/state",
      input,
      "Не удалось обновить состояние оверлея",
      parseOverlayState,
    );
  }

  setPointer(pointer: OverlayPointer): Promise<OverlayState> {
    return this.http.put(
      "/overlay/pointer",
      pointer,
      "Не удалось обновить курсор оверлея",
      parseOverlayState,
    );
  }

  setPointerSize(input: OverlayPointerSizeInput): Promise<OverlayState> {
    return this.http.put(
      "/overlay/pointer-size",
      input,
      "Не удалось обновить размер курсора",
      parseOverlayState,
    );
  }

  setModules(patch: OverlayModulesPatch): Promise<OverlayState> {
    return this.http.put(
      "/overlay/modules",
      patch,
      "Не удалось обновить модули оверлея",
      parseOverlayState,
    );
  }

  setFocus(patch: OverlayFocusPatch): Promise<OverlayState> {
    return this.http.put(
      "/overlay/focus",
      patch,
      "Не удалось обновить фокус оверлея",
      parseOverlayState,
    );
  }

  /** Subscribes to /api/overlay/events; returns unsubscribe. */
  subscribe(handlers: OverlayStreamHandlers): () => void {
    const source = new EventSource(`${API_BASE_PATH}/overlay/events`);

    source.onopen = () => handlers.onOpen?.();
    source.onerror = (event) => handlers.onError?.(event);
    source.onmessage = (message: MessageEvent<string>) => {
      const [data, error] = attemptSync(() => JSON.parse(message.data) as unknown);

      if (error) return handlers.onError?.(error);

      const parsed = overlayEventSchema.safeParse(data);
      if (!parsed.success) return handlers.onError?.(parsed.error);

      handlers.onEvent(parsed.data);
    };

    return () => {
      source.close();
    };
  }
}
