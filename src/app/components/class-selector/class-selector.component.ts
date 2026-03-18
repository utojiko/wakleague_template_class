import { Component, inject } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { GameClass } from '../../models/game-class.model';

@Component({
  selector: 'app-class-selector',
  standalone: true,
  imports: [NgClass, NgStyle],
  templateUrl: './class-selector.component.html',
  styleUrl: './class-selector.component.scss',
})
export class ClassSelectorComponent {
  readonly state = inject(GameStateService);

  selectClass(cls: GameClass): void {
    this.state.addClass(cls);
  }

  setTargetTeam(team: 'left' | 'right'): void {
    this.state.selectedTeam.set(team);
  }

  reset(): void {
    if (confirm('Réinitialiser les deux équipes ?')) {
      this.state.resetTeams();
    }
  }

  /** Returns true if a class is already used in either team */
  isUsed(cls: GameClass): boolean {
    return (
      this.state.leftTeamIds().includes(cls.id) ||
      this.state.rightTeamIds().includes(cls.id)
    );
  }
}
