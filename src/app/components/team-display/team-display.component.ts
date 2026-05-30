import { Component, inject, input, ViewChild, ElementRef, signal } from '@angular/core';
import { GameStateService } from '../../services/game-state.service';

@Component({
  selector: 'app-team-display',
  standalone: true,
  imports: [],
  templateUrl: './team-display.component.html',
  styleUrl: './team-display.component.scss',
})
export class TeamDisplayComponent {
  readonly state = inject(GameStateService);

  /** When true, hides the remove buttons (overlay mode) */
  overlayMode = input<boolean>(false);

  // inline editing flags as signals for reactivity
  editingLeft = signal<boolean>(false);
  editingRight = signal<boolean>(false);

  @ViewChild('leftInput') leftInput?: ElementRef<HTMLInputElement>;
  @ViewChild('rightInput') rightInput?: ElementRef<HTMLInputElement>;

  toggleDead(team: 'left' | 'right', index: number): void {
    console.log(`Toggling dead for ${team} at index ${index}`);
    this.state.toggleDead(team, index);
  }

  removeClass(team: 'left' | 'right', index: number): void {
    console.log(`Removing class from ${team} at index ${index}`);
    this.state.removeClass(team, index);
  }

  startEditing(team: 'left' | 'right'): void {
    console.log(`Starting to edit team name for ${team}`);
    if (team === 'left') {
      this.editingLeft.set(true);
      setTimeout(() => {
        const el = document.querySelector('.left-title-box .team-title-input') as HTMLInputElement | null;
        if (el) { el.focus(); el.select(); }
      }, 0);
    } else {
      this.editingRight.set(true);
      setTimeout(() => {
        const el = document.querySelector('.right-title-box .team-title-input') as HTMLInputElement | null;
        if (el) { el.focus(); el.select(); }
      }, 0);
    }
  }

  stopEditing(team: 'left' | 'right'): void {
    console.log(`Stopping edit for team name for ${team}`);
    if (team === 'left') this.editingLeft.set(false);
    else this.editingRight.set(false);
  }

  /** Remove a class when user right-clicks (context menu) on a slot */
  onContextRemove(team: 'left' | 'right', index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.removeClass(team, index);
  }

  // ─── Drag & Drop ──────────────────────────────────────────────────────────

  private dragTeam: 'left' | 'right' | null = null;
  private dragIndex: number | null = null;

  onDragStart(team: 'left' | 'right', index: number, event: DragEvent): void {
    this.dragTeam = team;
    this.dragIndex = index;
    event.dataTransfer?.setData('text/plain', `${team}:${index}`);
    (event.currentTarget as HTMLElement).classList.add('dragging');
  }

  onDragEnd(event: DragEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('dragging');
  }

  onDrop(team: 'left' | 'right', toIndex: number, event: DragEvent): void {
    event.preventDefault();
    if (this.dragTeam === team && this.dragIndex !== null && this.dragIndex !== toIndex) {
      this.state.reorderTeam(team, this.dragIndex, toIndex);
    }
    console.log(`Dropped on ${team} at index ${toIndex}`);
    this.dragTeam = null;
    this.dragIndex = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  /** Compute title image width based on team name length (px) */
  getTitleWidth(team: 'left' | 'right'): number {
    const name = team === 'left' ? this.state.leftTeamName() : this.state.rightTeamName();
    const len = Math.max(0, (name || '').length);
    // base width 100px, increase with length, clamp between 100 and 360
    return Math.max(100, Math.min(360, 80 + len * 12));
  }
}
