import { Injectable, signal, computed, effect } from '@angular/core';
import { GameClass, GameState, TeamSlot, WAKFU_CLASSES } from '../models/game-class.model';

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

    // Persist state to localStorage whenever teams change
    effect(() => {
      const state: GameState = {
        leftTeam: this.leftTeam(),
        rightTeam: this.rightTeam(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore storage errors (e.g. private browsing)
      }
    });
  }

  /**
   * Add a class to the selected team.
   * Validates max size and prevents duplicates across both teams.
   */
  addClass(gameClass: GameClass): void {
    const target = this.selectedTeam();
    const team = target === 'left' ? this.leftTeam() : this.rightTeam();

    if (team.length >= MAX_TEAM_SIZE) return;
    if (this.leftTeamIds().includes(gameClass.id) || this.rightTeamIds().includes(gameClass.id)) return;

    const newSlot: TeamSlot = { gameClass, isDead: false };
    if (target === 'left') {
      this.leftTeam.update(t => [...t, newSlot]);
    } else {
      this.rightTeam.update(t => [...t, newSlot]);
    }
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
    } catch {
      // corrupted storage — ignore
    }
  }
}
