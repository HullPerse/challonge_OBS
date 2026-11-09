import {
  DEFAULT_MODULES,
  DEFAULT_POINTER,
  DEFAULT_VIEW,
  OVERLAY_CURSOR_SIZE,
  OVERLAY_MODULE_KEYS,
  OVERLAY_PERSIST_DELAY_MS,
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
import { readOverlayState, writeOverlayState } from "../db/overlay.db";
import type TournamentService from "./tournament.service";

/** Owns overlay state, SQLite persistence, and SSE subscribers. */
export default class OverlayService {
  private readonly tournaments: TournamentService;
  private readonly database: DatabaseClient;
  private readonly hub = createSseHub<OverlayEvent>();

  private activeKey: string | null = null;
  private view: OverlayView = { ...DEFAULT_VIEW };
  private pointer: OverlayPointer = { ...DEFAULT_POINTER };
  private pointerSize: number = OVERLAY_CURSOR_SIZE.default;
  private modules: OverlayModules = { ...DEFAULT_MODULES };
  private highlightedPlayerId: number | null = null;
  private modal: OverlayState["modal"] = null;
  private revision = 0;
  private updatedAt = Date.now();
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;

  constructor(tournaments: TournamentService, database: DatabaseClient) {
    this.tournaments = tournaments;
    this.database = database;
    this.restore();
  }

  getState(): OverlayState {
    return {
      activeKey: this.activeKey,
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
    const keyChanged = input.activeKey !== this.activeKey;
    const tournament = this.resolveTournament(input.activeKey, keyChanged);

    if (keyChanged && input.activeKey && !tournament) {
      return { ok: false, status: 404, error: "Tournament not found" };
    }

    this.activeKey = input.activeKey;
    this.view = { ...input.view };
    if (keyChanged) {
      this.highlightedPlayerId = null;
      this.modal = null;
    }
    this.touch();
    this.persist(keyChanged);

    if (keyChanged || this.modules.camera) {
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
    this.persist(true);
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
    this.persist(true);

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
  updateVisibility(key: string, visibility: TournamentVisibility) {
    if (!this.isActive(key)) return;

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
    if (!this.isActive(snapshot.key)) return;

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
  removeTournament(key: string) {
    if (!this.isActive(key)) return;

    this.activeKey = null;
    this.view = { ...DEFAULT_VIEW };
    this.pointer = { ...DEFAULT_POINTER, visible: false };
    this.highlightedPlayerId = null;
    this.modal = null;
    this.touch();
    this.persist(true);

    this.hub.publish({
      type: "state",
      state: this.getState(),
      tournament: null,
      visibility: VisibilityUtils.empty(),
    });
  }

  close() {
    this.flushPersist();
    this.hub.close();
  }

  private modalExists(modal: OverlayModal, snapshot: TournamentSnapshot | null): boolean {
    if (!snapshot) return false;

    if (modal.kind === "match") {
      return snapshot.matches.some((match) => match.id === modal.matchId);
    }

    return snapshot.participants.some((player) => player.id === modal.playerId);
  }

  private resolveTournament(key: string | null, keyChanged: boolean): TournamentSnapshot | null {
    if (!keyChanged || !key) return null;

    return this.tournaments.get(key);
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
    if (!this.activeKey) return null;
    return this.tournaments.get(this.activeKey);
  }

  private getVisibility(): TournamentVisibility {
    if (!this.activeKey) return VisibilityUtils.empty();
    return VisibilityUtils.clone(this.tournaments.getVisibility(this.activeKey));
  }

  private isActive(key: string): boolean {
    return key === this.activeKey;
  }

  private restore() {
    const state = readOverlayState(this.database);

    if (!state) return;

    this.activeKey = state.activeKey;
    this.view = { ...state.view };
    this.pointer = { ...state.pointer };
    this.pointerSize = state.pointerSize;
    this.modules = { ...state.modules };
    this.revision = state.revision;
    this.updatedAt = state.updatedAt;

    if (this.activeKey && !this.tournaments.exists(this.activeKey)) {
      this.activeKey = null;
      this.persist(true);
    }
  }

  /** Schedules a SQLite write; camera ticks would otherwise hit the disk on every frame. */
  private persist(immediate = false) {
    this.dirty = true;

    if (immediate) {
      this.flushPersist();
      return;
    }

    if (this.persistTimer !== null) return;

    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this.flushPersist();
    }, OVERLAY_PERSIST_DELAY_MS);
  }

  private flushPersist() {
    if (this.persistTimer !== null) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }

    if (!this.dirty) return;
    this.dirty = false;

    const state = this.getState();

    writeOverlayState(this.database, {
      activeKey: state.activeKey,
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
