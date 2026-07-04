import { Component, inject, computed } from '@angular/core';
import { GameStateService } from '../../services/game-state.service';

@Component({
  selector: 'app-full-screen-announcement',
  standalone: true,
  imports: [],
  templateUrl: './full-screen-announcement.component.html',
  styleUrl: './full-screen-announcement.component.scss',
})
export class FullScreenAnnouncementComponent {
  readonly state = inject(GameStateService);

  /** Number of items per row: 1 for 1v1, 2 for 2v2, 3 for 3v3/5v5/6v6, 2 for 4v4 */
  readonly itemsPerRow = computed(() => {
    const max = Math.max(this.state.leftTeam().length, this.state.rightTeam().length, 1);
    if (max <= 2) return max;
    if (max === 4) return 2;
    return 3;
  });
}
