import { Injectable, signal, computed, effect } from '@angular/core';
import { GameClass, GameState, TeamSlot, WAKFU_CLASSES } from '../models/game-class.model';
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

  /** Whether overlay edit mode is enabled (shows full selector inside overlay) */
  readonly overlayEditEnabled = signal<boolean>(false);

  /** Current session id for remote sync (null = no remote session) */
  readonly sessionId = signal<string | null>(null);

  /** Current sync mode: 'firebase' | 'broadcast' | 'local' */
  readonly syncMode = signal<'firebase' | 'broadcast' | 'local'>('local');

  // Remote DB subscription handle
  private remoteUnsubscribe: (() => void) | null = null;
  private suppressNextWrite = false;
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
      const state: GameState = {
        leftTeam: this.leftTeam(),
        rightTeam: this.rightTeam(),
        leftTeamName: this.leftTeamName(),
        rightTeamName: this.rightTeamName(),
        overlayEditEnabled: this.overlayEditEnabled(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        // Broadcast to other same-origin contexts (tabs, overlays)
        try {
          if (this.bc) this.bc.postMessage(JSON.stringify(state));
        } catch {
          // ignore bc errors
        }
        // Also push to remote session if set (write canonical exported shape)
        const sid = this.sessionId();
        if (sid && !this.suppressNextWrite) {
          const db = getDatabaseInstance() ?? initFirebase();
          if (db) {
            try {
              const exported = this.serializeForExport();
              dbSet(dbRef(db, `sessions/${sid}`), { ...exported, updatedAt: Date.now() });
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
    // When the main site updates localStorage, other windows receive the
    // `storage` event and we apply the new state so overlays update live.
    window.addEventListener('storage', (ev: StorageEvent) => {
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
        if ((parsed as any).overlayEditEnabled !== undefined) payload.overlayEditEnabled = (parsed as any).overlayEditEnabled;

        this.applyExportedState(payload);
      } catch {
        // ignore malformed storage payloads
      }
    });

    // Listen for BroadcastChannel messages (same-origin real-time fallback)
    if (this.bc) {
      this.bc.onmessage = (ev: MessageEvent) => {
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
          if ((parsed as any).overlayEditEnabled !== undefined) payload.overlayEditEnabled = (parsed as any).overlayEditEnabled;

          // Apply but avoid echoing back immediately
          try {
            this.suppressNextWrite = true;
            this.applyExportedState(payload);
          } finally {
            setTimeout(() => (this.suppressNextWrite = false), 50);
          }
        } catch {
          // ignore
        }
      };
    }
  }

  /** Set the active shared session id. Pass `null` to disable remote sync. */
  setSession(id: string | null): void {
    // detach previous listener if any
    if (this.remoteUnsubscribe) {
      try { this.remoteUnsubscribe(); } catch {}
      this.remoteUnsubscribe = null;
    }

    this.sessionId.set(id);
    if (!id) return;

    // Initialize firebase (if config present on window) and attach listener
    const db = getDatabaseInstance() ?? initFirebase();
    // set sync mode based on availability
    if (db) this.syncMode.set('firebase');
    else if (this.bc) this.syncMode.set('broadcast');
    else this.syncMode.set('local');
    if (!db) return; // no remote available

    const remoteRef = dbRef(db, `sessions/${id}`);
    const listener = (snap: any) => {
      const raw = snap.val?.() ?? snap.val();
      if (!raw) return;
      try {
        // Normalize remote payload to the exported shape {id,isDead}[] expected by applyExportedState
        const toExport = (teamSlots?: any[]) =>
          (teamSlots || [])
            .map(s => {
              // remote may contain either { id, isDead } or full TeamSlot with gameClass
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
        if (raw.overlayEditEnabled !== undefined) payload.overlayEditEnabled = !!raw.overlayEditEnabled;

        this.suppressNextWrite = true;
        this.applyExportedState(payload);
      } finally {
        // allow local writes after a microtask delay
        setTimeout(() => (this.suppressNextWrite = false), 50);
      }
    };
    onValue(remoteRef, listener);
    this.remoteUnsubscribe = () => off(remoteRef, 'value', listener);
  }

  /**
   * Return a serializable snapshot suitable for sharing with an overlay URL.
   */
  serializeForExport(): { leftTeam: { id: string; isDead: boolean }[]; rightTeam: { id: string; isDead: boolean }[]; leftTeamName?: string; rightTeamName?: string; overlayEditEnabled?: boolean } {
    return {
      leftTeam: this.leftTeam().map(s => ({ id: s.gameClass.id, isDead: s.isDead })),
      rightTeam: this.rightTeam().map(s => ({ id: s.gameClass.id, isDead: s.isDead })),
      leftTeamName: this.leftTeamName(),
      rightTeamName: this.rightTeamName(),
      overlayEditEnabled: this.overlayEditEnabled(),
    };
  }

  /**
   * Apply an exported snapshot (from `serializeForExport`) into the current state.
   * Unknown class ids are ignored.
   */
  applyExportedState(payload: { leftTeam?: { id: string; isDead: boolean }[]; rightTeam?: { id: string; isDead: boolean }[]; leftTeamName?: string; rightTeamName?: string; overlayEditEnabled?: boolean }) {
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
    // overlay edit flag
    if ((payload as any).overlayEditEnabled !== undefined) this.overlayEditEnabled.set(!!(payload as any).overlayEditEnabled);
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
      if ((state as any).overlayEditEnabled) this.overlayEditEnabled.set(!!(state as any).overlayEditEnabled);
    } catch {
      // corrupted storage — ignore
    }
  }
}
