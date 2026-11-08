import HttpApi from "@/lib/http.utils";
import { healthSchema } from "@/lib/schemas/health.schema";
import type { ApiHealth } from "@/types/api";

const parseHealth = (value: unknown): ApiHealth => healthSchema.parse(value);

export default class HealthApi {
  private readonly http: HttpApi;

  constructor(http: HttpApi = new HttpApi()) {
    this.http = http;
  }

  get(): Promise<ApiHealth> {
    return this.http.getRoot("/health", "Не удалось проверить сервер", parseHealth);
  }
}
