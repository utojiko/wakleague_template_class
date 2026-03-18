import { Component, inject, input } from '@angular/core';
import { GameStateService } from '../../services/game-state.service';
import { ClassCardComponent } from '../class-card/class-card.component';

@Component({
  selector: 'app-team-display',
  standalone: true,
  imports: [ClassCardComponent],
  templateUrl: './team-display.component.html',
  styleUrl: './team-display.component.scss',
})
export class TeamDisplayComponent {
  readonly state = inject(GameStateService);

  /** When true, hides the remove buttons (overlay mode) */
  overlayMode = input<boolean>(false);

  toggleDead(team: 'left' | 'right', index: number): void {
    this.state.toggleDead(team, index);
  }

  removeClass(team: 'left' | 'right', index: number): void {
    this.state.removeClass(team, index);
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
    this.dragTeam = null;
    this.dragIndex = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }
}
