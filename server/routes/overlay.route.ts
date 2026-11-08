import HttpUtils from "@/lib/server/http.utils";
import {
  overlayFocusPatchSchema,
  overlayModulesPatchSchema,
  overlayPointerSchema,
  overlayPointerSizeSchema,
  overlaySetViewSchema,
} from "@/lib/schemas/server/overlay.schema";
import { Elysia } from "elysia";
import type OverlayService from "../services/overlay.service";

export default class OverlayRoutes {
  private readonly overlay: OverlayService;

  constructor(overlay: OverlayService) {
    this.overlay = overlay;
  }

  plugin() {
    return new Elysia({ name: "overlay" })
      .get("/api/overlay/events", ({ request }) => this.overlay.connect(request))
      .get("/api/overlay/state", () => HttpUtils.jsonRes(this.overlay.getState()))
      .get("/api/overlay/modules", () => HttpUtils.jsonRes(this.overlay.getModules()))
      .put("/api/overlay/state", ({ body }) => this.setView(body))
      .put("/api/overlay/pointer", ({ body }) => this.setPointer(body))
      .put("/api/overlay/pointer-size", ({ body }) => this.setPointerSize(body))
      .put("/api/overlay/modules", ({ body }) => this.setModules(body))
      .put("/api/overlay/focus", ({ body }) => this.setFocus(body))
      .post("/api/overlay/events", () => HttpUtils.methodNotAllowed())
      .post("/api/overlay/state", () => HttpUtils.methodNotAllowed())
      .post("/api/overlay/pointer", () => HttpUtils.methodNotAllowed())
      .post("/api/overlay/pointer-size", () => HttpUtils.methodNotAllowed())
      .post("/api/overlay/modules", () => HttpUtils.methodNotAllowed())
      .post("/api/overlay/focus", () => HttpUtils.methodNotAllowed());
  }

  private setView(body: unknown): Response {
    const parsed = overlaySetViewSchema.safeParse(body);
    if (!parsed.success) {
      return HttpUtils.jsonRes(
        { error: "Invalid overlay state", issues: parsed.error.issues },
        400,
      );
    }

    const result = this.overlay.setView(parsed.data);

    if (!result.ok) return HttpUtils.errorRes(result.error, result.status);
    return HttpUtils.jsonRes(result.state);
  }

  private setPointer(body: unknown): Response {
    const parsed = overlayPointerSchema.safeParse(body);
    if (!parsed.success) {
      return HttpUtils.jsonRes({ error: "Invalid pointer", issues: parsed.error.issues }, 400);
    }

    return HttpUtils.jsonRes(this.overlay.setPointer(parsed.data));
  }

  private setPointerSize(body: unknown): Response {
    const parsed = overlayPointerSizeSchema.safeParse(body);
    if (!parsed.success) {
      return HttpUtils.jsonRes({ error: "Invalid pointer size", issues: parsed.error.issues }, 400);
    }

    return HttpUtils.jsonRes(this.overlay.setPointerSize(parsed.data));
  }

  private setFocus(body: unknown): Response {
    const parsed = overlayFocusPatchSchema.safeParse(body);
    if (!parsed.success) {
      return HttpUtils.jsonRes(
        { error: "Invalid overlay focus", issues: parsed.error.issues },
        400,
      );
    }

    return HttpUtils.jsonRes(this.overlay.setFocus(parsed.data));
  }

  private setModules(body: unknown): Response {
    const parsed = overlayModulesPatchSchema.safeParse(body);
    if (!parsed.success) {
      return HttpUtils.jsonRes(
        { error: "Invalid overlay modules", issues: parsed.error.issues },
        400,
      );
    }

    return HttpUtils.jsonRes(this.overlay.setModules(parsed.data));
  }
}
