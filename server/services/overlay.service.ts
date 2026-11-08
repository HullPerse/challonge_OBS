import {
  DEFAULT_MODULES,
  DEFAULT_POINTER,
  DEFAULT_VIEW,
  OVERLAY_CURSOR_SIZE,
  OVERLAY_MODULE_KEYS,
} from "@/configs/overlay.config";
import { createSseHub } from "@/lib/server/sse.utils";
import VisibilityUtils from "@/lib/server/visibility.utils";
import type {
  OverlayEvent,
  OverlayFocusPatch,
  OverlayModules,
  OverlayModal,
  OverlayModulesPatch,
  OverlayPointer,
  OverlayPointerSizeInput,
  OverlaySetViewInput,
  OverlayState,
  OverlayStateEvent,
  OverlaySyncEvent,
  OverlayView,
  OverlayViewResult,
} from "@/types/overlay";
import type { TournamentSnapshot, TournamentVisibility } from "@/types/tournament";
import type { DatabaseClient } from "../db/client.db";
import { readOverlayState, writeOverlayState } from "../db/overlay-state.db";
import type TournamentService from "./tournament.service";

/** Owns overlay state, SQLite persistence, and SSE subscribers. */
export default class OverlayService {
  private readonly tournaments: TournamentService;
  private readonly database: DatabaseClient;
  private readonly hub = createSseHub<OverlayEvent>();

  private activeSlug: string | null = null;
  private view: OverlayView = { ...DEFAULT_VIEW };
  private pointer: OverlayPointer = { ...DEFAULT_POINTER };
  private pointerSize: number = OVERLAY_CURSOR_SIZE.default;
  private modules: OverlayModules = { ...DEFAULT_MODULES };
  private highlightedPlayerId: number | null = null;
  private modal: OverlayState["modal"] = null;
  private revision = 0;
  private updatedAt = Date.now();

  constructor(tournaments: TournamentService, database: DatabaseClient) {
    this.tournaments = tournaments;
    this.database = database;
    this.restore();
  }

  getState(): OverlayState {
    return {
      activeSlug: this.activeSlug,
      view: { ...this.view },
      pointer: { ...this.pointer },
      pointerSize: this.pointerSize,
      modules: this.getModules(),
      highlightedPlayerId: this.highlightedPlayerId,
      modal: this.modal,
      revision: this.revision,
      updatedAt: this.updatedAt,
    };
  }

  getModules(): OverlayModules {
    return { ...this.modules };
  }

  /** Returns the full state used for the first overlay paint. */
  getBootstrap(): OverlaySyncEvent {
    return this.createSyncEvent();
  }

  /** Opens an SSE stream with a full sync event. */
  connect(request: Request): Response {
    return this.hub.connect(request, this.createSyncEvent());
  }

  /** Updates the active slug and camera view. */
  setView(input: OverlaySetViewInput): OverlayViewResult {
    const slugChanged = input.activeSlug !== this.activeSlug;
    const tournament = this.resolveTournament(input.activeSlug, slugChanged);

    if (slugChanged && input.activeSlug && !tournament) {
      return { ok: false, status: 404, error: "Tournament not found" };
    }

    this.activeSlug = input.activeSlug;
    this.view = { ...input.view };
    if (slugChanged) {
      this.highlightedPlayerId = null;
      this.modal = null;
    }
    this.touch();
    this.persist();

    if (slugChanged || this.modules.camera) {
      this.hub.publish(this.createStateEvent(tournament));
    }

    return { ok: true, state: this.getState() };
  }

  /** Updates the cursor when the pointer module is enabled. */
  setPointer(pointer: OverlayPointer): OverlayState {
    if (!this.modules.pointer) return this.getState();

    this.pointer = { ...pointer };
    this.touch();

    this.hub.publish({
      type: "pointer",
      pointer: { ...this.pointer },
      revision: this.revision,
    });

    return this.getState();
  }

  setPointerSize(input: OverlayPointerSizeInput): OverlayState {
    this.pointerSize = input.pointerSize;
    this.touch();
    this.persist();
    this.hub.publish(this.createStateEvent(null));

    return this.getState();
  }

  setFocus(patch: OverlayFocusPatch): OverlayState {
    const snapshot = this.getActiveTournament();

    if (patch.highlightedPlayerId !== undefined) {
      const isKnown =
        patch.highlightedPlayerId === null ||
        snapshot?.participants.some((player) => player.id === patch.highlightedPlayerId);

      if (isKnown) this.highlightedPlayerId = patch.highlightedPlayerId;
    }

    if (patch.modal !== undefined) {
      const isKnown = patch.modal === null || this.modalExists(patch.modal, snapshot);

      if (isKnown) this.modal = patch.modal;
    }

    this.touch();
    this.hub.publish({
      type: "focus",
      highlightedPlayerId: this.highlightedPlayerId,
      modal: this.modal,
      revision: this.revision,
    });

    return this.getState();
  }

  setModules(patch: OverlayModulesPatch): OverlayState {
    const modules = { ...this.modules };
    for (const key of OVERLAY_MODULE_KEYS) {
      const value = patch[key];
      if (value !== undefined) modules[key] = value;
    }
    this.modules = modules;

    if (!this.modules.pointer) this.pointer = { ...this.pointer, visible: false };

    this.touch();
    this.persist();

    this.hub.publish({
      type: "modules",
      modules: this.getModules(),
      view: { ...this.view },
      pointer: { ...this.pointer },
      revision: this.revision,
    });

    return this.getState();
  }

  /** Broadcasts visibility for the active tournament. */
  updateVisibility(slug: string, visibility: TournamentVisibility) {
    if (!this.isActive(slug)) return;

    this.touch();
    this.persist();

    this.hub.publish({
      type: "visibility",
      visibility: VisibilityUtils.clone(visibility),
      revision: this.revision,
    });
  }

  /** Broadcasts an updated active snapshot. */
  updateTournament(snapshot: TournamentSnapshot) {
    if (!this.isActive(snapshot.slug)) return;

    this.touch();
    this.persist();

    this.hub.publish({
      type: "tournament",
      tournament: snapshot,
      visibility: this.getVisibility(),
      revision: this.revision,
    });
  }

  /** Clears the overlay when its active tournament is deleted. */
  removeTournament(slug: string) {
    if (!this.isActive(slug)) return;

    this.activeSlug = null;
    this.view = { ...DEFAULT_VIEW };
    this.pointer = { ...DEFAULT_POINTER, visible: false };
    this.highlightedPlayerId = null;
    this.modal = null;
    this.touch();
    this.persist();

    this.hub.publish({
      type: "state",
      state: this.getState(),
      tournament: null,
      visibility: VisibilityUtils.empty(),
    });
  }

  close() {
    this.hub.close();
  }

  private modalExists(modal: OverlayModal, snapshot: TournamentSnapshot | null): boolean {
    if (!snapshot) return false;

    if (modal.kind === "match") {
      return snapshot.matches.some((match) => match.id === modal.matchId);
    }

    return snapshot.participants.some((player) => player.id === modal.playerId);
  }

  private resolveTournament(slug: string | null, slugChanged: boolean): TournamentSnapshot | null {
    if (!slugChanged || !slug) return null;

    return this.tournaments.get(slug);
  }

  private createStateEvent(tournament: TournamentSnapshot | null): OverlayStateEvent {
    const event: OverlayStateEvent = {
      type: "state",
      state: this.getState(),
    };

    if (tournament) {
      event.tournament = tournament;
      event.visibility = this.getVisibility();
    }

    return event;
  }

  private createSyncEvent(): OverlaySyncEvent {
    return {
      type: "sync",
      state: this.getState(),
      tournament: this.getActiveTournament(),
      visibility: this.getVisibility(),
    };
  }

  private getActiveTournament(): TournamentSnapshot | null {
    if (!this.activeSlug) return null;
    return this.tournaments.get(this.activeSlug);
  }

  private getVisibility(): TournamentVisibility {
    if (!this.activeSlug) return VisibilityUtils.empty();
    return VisibilityUtils.clone(this.tournaments.getVisibility(this.activeSlug));
  }

  private isActive(slug: string): boolean {
    return slug === this.activeSlug;
  }

  private restore() {
    const state = readOverlayState(this.database);

    if (!state) return;

    this.activeSlug = state.activeSlug;
    this.view = { ...state.view };
    this.pointer = { ...state.pointer };
    this.pointerSize = state.pointerSize;
    this.modules = { ...state.modules };
    this.revision = state.revision;
    this.updatedAt = state.updatedAt;

    if (this.activeSlug && !this.tournaments.exists(this.activeSlug)) {
      this.activeSlug = null;
      this.persist();
    }
  }

  private persist() {
    const state = this.getState();

    writeOverlayState(this.database, {
      activeSlug: state.activeSlug,
      view: state.view,
      pointer: state.pointer,
      pointerSize: state.pointerSize,
      modules: state.modules,
      revision: state.revision,
      updatedAt: state.updatedAt,
    });
  }

  private touch() {
    this.revision += 1;
    this.updatedAt = Date.now();
  }
}
