import { Injectable, signal, computed, effect } from '@angular/core';
import { GameClass, GameMap, GameState, TeamSlot, WAKFU_CLASSES, WAKFU_MAPS } from '../models/game-class.model';
import { initFirebase, getDatabaseInstance } from '../firebase';
import { ref as dbRef, set as dbSet, onValue, off } from 'firebase/database';

const STORAGE_KEY = 'wakfu-overlay-state';
const MAX_TEAM_SIZE = 6;

@Injectable({ providedIn: 'root' })
export class GameStateService {
  /** All available Wakfu classes */
  readonly availableClasses = signal<GameClass[]>(WAKFU_CLASSES);

  /** Left team slots */
  readonly leftTeam = signal<TeamSlot[]>([]);

  /** Right team slots */
  readonly rightTeam = signal<TeamSlot[]>([]);

  /** Team display names */
  readonly leftTeamName = signal<string>('Équipe A');
  readonly rightTeamName = signal<string>('Équipe B');

  /** Match scores (manches gagnées) */
  readonly leftScore = signal<number>(0);
  readonly rightScore = signal<number>(0);

  /** Whether overlay edit mode is enabled (shows full selector inside overlay) */
  readonly overlayEditEnabled = signal<boolean>(false);

  /** Current session id for remote sync (null = no remote session) */
  readonly sessionId = signal<string | null>(null);

  /** Currently selected map (null = no map) */
  readonly selectedMap = signal<GameMap | null>(null);

  /** All available maps */
  readonly availableMaps = signal<GameMap[]>(WAKFU_MAPS);

  /** Current sync mode: 'firebase' | 'broadcast' | 'local' */
  readonly syncMode = signal<'firebase' | 'broadcast' | 'local'>('local');

  /** Whether this instance writes to Firebase (editor) or only reads (viewer) */
  private firebaseMode: 'read-write' | 'read-only' = 'read-write';

  // Remote DB subscription handle
  private remoteUnsubscribe: (() => void) | null = null;
  // Optional BroadcastChannel for same-origin real-time updates (fallback when Firebase absent)
  private bc: BroadcastChannel | null = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('wakfu-overlay') : null;

  /** Currently selected target team ('left' | 'right') */
  readonly selectedTeam = signal<'left' | 'right'>('left');

  /** Computed: IDs already used by left team */
  readonly leftTeamIds = computed(() => this.leftTeam().map(s => s.gameClass.id));

  /** Computed: IDs already used by right team */
  readonly rightTeamIds = computed(() => this.rightTeam().map(s => s.gameClass.id));

  /** Computed: classes not yet in either team */
  readonly unusedClasses = computed(() =>
    this.availableClasses().filter(
      c => !this.leftTeamIds().includes(c.id) && !this.rightTeamIds().includes(c.id)
    )
  );

  /** Computed: whether adding to the currently selected team is allowed */
  readonly canAddToSelectedTeam = computed(() => {
    const target = this.selectedTeam();
    const team = target === 'left' ? this.leftTeam() : this.rightTeam();
    return team.length < MAX_TEAM_SIZE;
  });

  constructor() {
    this.loadFromStorage();

    // default sync mode: prefer BroadcastChannel if available until firebase init
    if (this.bc) this.syncMode.set('broadcast');
    else this.syncMode.set('local');

    // Persist state to localStorage whenever teams change
    effect(() => {
      const state: any = {
        leftTeam: this.leftTeam(),
        rightTeam: this.rightTeam(),
        leftTeamName: this.leftTeamName(),
        rightTeamName: this.rightTeamName(),
        leftScore: this.leftScore(),
        rightScore: this.rightScore(),
        overlayEditEnabled: this.overlayEditEnabled(),
        mapId: this.selectedMap()?.id ?? null,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        // Broadcast to other same-origin contexts (tabs, overlays) — only from editor
        try {
          if (this.bc && this.firebaseMode === 'read-write') this.bc.postMessage(JSON.stringify(state));
        } catch {
          // ignore bc errors
        }
        // Push to remote session if set and this instance is an editor (read-write)
        const sid = this.sessionId();
        if (sid && this.firebaseMode === 'read-write') {
          const db = getDatabaseInstance() ?? initFirebase();
          if (db) {
            try {
              const exported = this.serializeForExport();
              dbSet(dbRef(db, `sessions/${sid}`), exported);
            } catch {
              // ignore write errors
            }
          }
        }
      } catch {
        // ignore storage errors (e.g. private browsing)
      }
    });

    // Listen for storage events from other windows/tabs (e.g., overlay)
    // Only apply in viewer (read-only) mode to avoid echoing back to the editor.
    window.addEventListener('storage', (ev: StorageEvent) => {
      if (this.firebaseMode !== 'read-only') return;
      if (!ev.key || ev.key !== STORAGE_KEY) return;
      if (!ev.newValue) return;
      try {
        const parsed = JSON.parse(ev.newValue) as Partial<GameState>;

        // Normalize to the export shape expected by applyExportedState
        const toExport = (teamSlots?: any[]) =>
          (teamSlots || []).map(s => {
            // stored slot might be full TeamSlot with gameClass object, or exported {id,isDead}
            const id = s?.gameClass?.id ?? s?.id;
            return id ? { id, isDead: !!s.isDead } : null;
          }).filter((v: any) => v !== null);

        const payload: any = {
          leftTeam: toExport(parsed.leftTeam as any[]),
          rightTeam: toExport(parsed.rightTeam as any[]),
        };
        if (parsed.leftTeamName !== undefined) payload.leftTeamName = parsed.leftTeamName;
        if (parsed.rightTeamName !== undefined) payload.rightTeamName = parsed.rightTeamName;
        if ((parsed as any).leftScore !== undefined) payload.leftScore = (parsed as any).leftScore;
        if ((parsed as any).rightScore !== undefined) payload.rightScore = (parsed as any).rightScore;
        if ((parsed as any).overlayEditEnabled !== undefined) payload.overlayEditEnabled = (parsed as any).overlayEditEnabled;
        if ((parsed as any).mapId !== undefined) payload.mapId = (parsed as any).mapId;

        this.applyExportedState(payload);
      } catch {
        // ignore malformed storage payloads
      }
    });

    // Listen for BroadcastChannel messages — only apply in viewer (read-only) mode
    if (this.bc) {
      this.bc.onmessage = (ev: MessageEvent) => {
        if (this.firebaseMode !== 'read-only') return;
        try {
          const parsed = JSON.parse(ev.data) as Partial<GameState> | any;

          // helper to normalize incoming team slot arrays to {id,isDead} export shape
          const toExport = (teamSlots?: any[]) =>
            (teamSlots || [])
              .map(s => {
                const id = s?.gameClass?.id ?? s?.id;
                return id ? { id, isDead: !!s.isDead } : null;
              })
              .filter((v: any) => v !== null);

          const payload: any = {};
          if (parsed.leftTeamName !== undefined) payload.leftTeamName = parsed.leftTeamName;
          if (parsed.rightTeamName !== undefined) payload.rightTeamName = parsed.rightTeamName;
          if (parsed.leftTeam !== undefined) payload.leftTeam = toExport(parsed.leftTeam as any[]);
          if (parsed.rightTeam !== undefined) payload.rightTeam = toExport(parsed.rightTeam as any[]);
          if ((parsed as any).leftScore !== undefined) payload.leftScore = (parsed as any).leftScore;
          if ((parsed as any).rightScore !== undefined) payload.rightScore = (parsed as any).rightScore;
          if ((parsed as any).overlayEditEnabled !== undefined) payload.overlayEditEnabled = (parsed as any).overlayEditEnabled;
          if ((parsed as any).mapId !== undefined) payload.mapId = (parsed as any).mapId;

          // Apply but avoid echoing back on the BroadcastChannel
          this.applyExportedState(payload);
        } catch {
          // ignore
        }
      };
    }
  }

  /** Set the active shared session id. Pass `null` to disable remote sync.
   *  `mode` controls whether this instance writes (editor) or only reads (viewer).
   *  - `read-write` (default): writes to Firebase, does NOT subscribe to remote changes.
   *  - `read-only`: subscribes to Firebase `onValue`, does NOT write back.
   */
  setSession(id: string | null, mode: 'read-write' | 'read-only' = 'read-write'): void {
    // detach previous listener if any
    if (this.remoteUnsubscribe) {
      try { this.remoteUnsubscribe(); } catch {}
      this.remoteUnsubscribe = null;
    }

    this.firebaseMode = mode;
    this.sessionId.set(id);
    if (!id) return;

    // Initialize firebase (if config present on window)
    const db = getDatabaseInstance() ?? initFirebase();
    // set sync mode based on availability
    if (db) this.syncMode.set('firebase');
    else if (this.bc) this.syncMode.set('broadcast');
    else this.syncMode.set('local');

    if (mode === 'read-only') {
      // Viewer mode: subscribe to remote changes
      if (!db) return;
      const remoteRef = dbRef(db, `sessions/${id}`);
      const listener = (snap: any) => {
        const raw = snap.val?.() ?? snap.val();
        if (!raw) return;
        try {
          const toExport = (teamSlots?: any[]) =>
            (teamSlots || [])
              .map(s => {
                const id = s?.id ?? s?.gameClass?.id;
                return id ? { id, isDead: !!s.isDead } : null;
              })
              .filter((v: any) => v !== null);

          const payload: any = {
            leftTeam: toExport(raw.leftTeam),
            rightTeam: toExport(raw.rightTeam),
          };
          if (raw.leftTeamName !== undefined) payload.leftTeamName = raw.leftTeamName;
          if (raw.rightTeamName !== undefined) payload.rightTeamName = raw.rightTeamName;
          if (raw.leftScore !== undefined) payload.leftScore = raw.leftScore;
          if (raw.rightScore !== undefined) payload.rightScore = raw.rightScore;
          if (raw.overlayEditEnabled !== undefined) payload.overlayEditEnabled = !!raw.overlayEditEnabled;
          if (raw.mapId !== undefined) payload.mapId = raw.mapId;

          this.applyExportedState(payload);
        } catch {
          // ignore remote state parse errors
        }
      };
      onValue(remoteRef, listener);
      this.remoteUnsubscribe = () => off(remoteRef, 'value', listener);
    }
  }

  /**
   * Return a serializable snapshot suitable for sharing with an overlay URL.
   */
  serializeForExport(): { leftTeam: { id: string; isDead: boolean }[]; rightTeam: { id: string; isDead: boolean }[]; leftTeamName?: string; rightTeamName?: string; leftScore?: number; rightScore?: number; overlayEditEnabled?: boolean; mapId?: string | null } {
    return {
      leftTeam: this.leftTeam().map(s => ({ id: s.gameClass.id, isDead: s.isDead })),
      rightTeam: this.rightTeam().map(s => ({ id: s.gameClass.id, isDead: s.isDead })),
      leftTeamName: this.leftTeamName(),
      rightTeamName: this.rightTeamName(),
      leftScore: this.leftScore(),
      rightScore: this.rightScore(),
      overlayEditEnabled: this.overlayEditEnabled(),
      mapId: this.selectedMap()?.id ?? null,
    };
  }

  /** Set the active map by id */
  setMap(mapId: string | null): void {
    if (!mapId) { this.selectedMap.set(null); return; }
    const map = WAKFU_MAPS.find(m => m.id === mapId);
    if (map) this.selectedMap.set(map);
  }

  /**
  /**
   * Set score directly to a specific value (clamped 0–99).
   */
  setScore(team: 'left' | 'right', value: number): void {
    const clamped = Math.max(0, Math.min(99, Math.round(value)));
    if (team === 'left') {
      this.leftScore.set(clamped);
    } else {
      this.rightScore.set(clamped);
    }
  }

  /**
   * Apply an exported snapshot (from `serializeForExport`) into the current state.
   * Unknown class ids are ignored.
   */
  applyExportedState(payload: { leftTeam?: { id: string; isDead: boolean }[]; rightTeam?: { id: string; isDead: boolean }[]; leftTeamName?: string; rightTeamName?: string; leftScore?: number; rightScore?: number; overlayEditEnabled?: boolean; mapId?: string | null }) {
    const hydrate = (slots?: { id: string; isDead: boolean }[]) =>
      (slots || [])
        .map(s => {
          const cls = WAKFU_CLASSES.find(c => c.id === s.id);
          return cls ? { gameClass: cls, isDead: !!s.isDead } : null;
        })
        .filter((v): v is TeamSlot => v !== null);

    const left = hydrate(payload.leftTeam);
    const right = hydrate(payload.rightTeam);

    // Apply only if any valid classes were found; otherwise keep existing state.
    if (left.length) this.leftTeam.set(left);
    if (right.length) this.rightTeam.set(right);
    // Apply team names if provided
    if (payload.leftTeamName !== undefined) this.leftTeamName.set(payload.leftTeamName || '');
    if (payload.rightTeamName !== undefined) this.rightTeamName.set(payload.rightTeamName || '');
    // Apply scores if provided
    if (payload.leftScore !== undefined) this.leftScore.set(payload.leftScore);
    if (payload.rightScore !== undefined) this.rightScore.set(payload.rightScore);
    // overlay edit flag
    if ((payload as any).overlayEditEnabled !== undefined) this.overlayEditEnabled.set(!!(payload as any).overlayEditEnabled);
    // map
    if (payload.mapId !== undefined) this.setMap(payload.mapId);
  }

  /** Update the saved team name */
  setTeamName(team: 'left' | 'right', name: string): void {
    if (team === 'left') this.leftTeamName.set(name || '');
    else this.rightTeamName.set(name || '');
  }

  /** Toggle or set overlay edit mode */
  setOverlayEdit(enabled: boolean): void {
    this.overlayEditEnabled.set(!!enabled);
  }

  /**
   * Add a class to the selected team.
   * Validates max size and prevents duplicates across both teams.
   */
  addClass(gameClass: GameClass): boolean {
    const target = this.selectedTeam();
    const team = target === 'left' ? this.leftTeam() : this.rightTeam();

    if (team.length >= MAX_TEAM_SIZE) return false;
    // Prevent duplicates only within the same team; allow same class in opposite team.
    const targetIds = team.map(s => s.gameClass.id);
    if (targetIds.includes(gameClass.id)) return false;

    const newSlot: TeamSlot = { gameClass, isDead: false };
    if (target === 'left') {
      this.leftTeam.update(t => [...t, newSlot]);
    } else {
      this.rightTeam.update(t => [...t, newSlot]);
    }
    return true;
  }

  /**
   * Remove a class from a team by index.
   */
  removeClass(team: 'left' | 'right', index: number): void {
    if (team === 'left') {
      this.leftTeam.update(t => t.filter((_, i) => i !== index));
    } else {
      this.rightTeam.update(t => t.filter((_, i) => i !== index));
    }
  }

  /**
   * Toggle the dead state for a class slot.
   */
  toggleDead(team: 'left' | 'right', index: number): void {
    const update = (slots: TeamSlot[]) =>
      slots.map((slot, i) => i === index ? { ...slot, isDead: !slot.isDead } : slot);

    if (team === 'left') {
      this.leftTeam.update(update);
    } else {
      this.rightTeam.update(update);
    }
  }

  /**
   * Reorder a class within a team (drag & drop support).
   */
  reorderTeam(team: 'left' | 'right', fromIndex: number, toIndex: number): void {
    const move = (slots: TeamSlot[]) => {
      const arr = [...slots];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    };
    if (team === 'left') {
      this.leftTeam.update(move);
    } else {
      this.rightTeam.update(move);
    }
  }

  /** Reset both teams to empty */
  resetTeams(): void {
    this.leftTeam.set([]);
    this.rightTeam.set([]);
  }

  /** Reset teams and team display names to defaults */
  resetAll(): void {
    this.resetTeams();
    this.leftTeamName.set('Équipe A');
    this.rightTeamName.set('Équipe B');
  }

  /** Load state from localStorage */
  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const state: GameState = JSON.parse(raw);

      // Validate and re-hydrate class references from WAKFU_CLASSES
      const hydrate = (slots: TeamSlot[]): TeamSlot[] =>
        slots
          .map(slot => {
            const cls = WAKFU_CLASSES.find(c => c.id === slot.gameClass.id);
            return cls ? { gameClass: cls, isDead: slot.isDead } : null;
          })
          .filter((s): s is TeamSlot => s !== null);

      this.leftTeam.set(hydrate(state.leftTeam || []));
      this.rightTeam.set(hydrate(state.rightTeam || []));
      if (state.leftTeamName) this.leftTeamName.set(state.leftTeamName);
      if (state.rightTeamName) this.rightTeamName.set(state.rightTeamName);
      if ((state as any).leftScore !== undefined) this.leftScore.set((state as any).leftScore);
      if ((state as any).rightScore !== undefined) this.rightScore.set((state as any).rightScore);
      if ((state as any).overlayEditEnabled) this.overlayEditEnabled.set(!!(state as any).overlayEditEnabled);
      if ((state as any).mapId) this.setMap((state as any).mapId);
    } catch {
      // corrupted storage — ignore
    }
  }
}
