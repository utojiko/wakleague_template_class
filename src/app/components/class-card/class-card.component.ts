import { Component, input, output } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { TeamSlot } from '../../models/game-class.model';

@Component({
  selector: 'app-class-card',
  standalone: true,
  imports: [NgClass, NgStyle],
  templateUrl: './class-card.component.html',
  styleUrl: './class-card.component.scss',
})
export class ClassCardComponent {
  /** The team slot to display */
  slot = input.required<TeamSlot>();

  /** Show remove button (used in selector mode) */
  showRemove = input<boolean>(false);

  /** Emitted when the card is clicked (toggle dead in team view) */
  cardClick = output<void>();

  /** Emitted when remove button is clicked */
  removeClick = output<void>();

  onCardClick(): void {
    this.cardClick.emit();
  }

  onRemoveClick(event: MouseEvent): void {
    event.stopPropagation();
    this.removeClick.emit();
  }
}
