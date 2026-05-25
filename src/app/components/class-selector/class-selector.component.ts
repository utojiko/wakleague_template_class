import { Component, inject } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { ToastService } from '../../services/toast.service';
import { GameClass } from '../../models/game-class.model';

@Component({
  selector: 'app-class-selector',
  standalone: true,
  imports: [NgClass],
  templateUrl: './class-selector.component.html',
  styleUrl: './class-selector.component.scss',
})
export class ClassSelectorComponent {
  readonly state = inject(GameStateService);
  readonly toast = inject(ToastService);

  async copyOverlayLink(): Promise<void> {
    // If a session is active, generate a session-based URL; otherwise create one and set it.
    const origin = window.location.origin;
    const base = '/wakleague_template_class/';
    let sid = this.state.sessionId();
    const created = !sid;
    if (!sid) {
      // create a short unique id
      sid = Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
      // set the session locally (this will attempt to initialize remote sync if configured)
      this.state.setSession(sid);
    }
    // Generate a clean session URL without query parameters as requested
    const overlayUrl = `${origin}${base}${sid}`;

    try {
      await navigator.clipboard.writeText(overlayUrl);
      if (!created) {
        this.toast.show('Lien overlay copié dans le presse-papiers. Collez-le dans OBS / Streamlabs.');
      }
    } catch {
      // Fallback: show the URL for manual copy
      prompt('Copiez ce lien pour OBS / Streamlabs (Ctrl+C):', overlayUrl);
    }

    // If we just created the session, redirect the current page to that clean session URL
    if (created) {
      try {
        window.location.href = overlayUrl;
      } catch {
        // ignore navigation errors
      }
    }
  }

  selectClass(cls: GameClass): void {
    this.state.addClass(cls);
  }

  setTargetTeam(team: 'left' | 'right'): void {
    this.state.selectedTeam.set(team);
  }

  reset(): void {
    if (confirm('Réinitialiser les deux équipes et leurs noms ?')) {
      this.state.resetAll();
    }
  }

  /** Returns true if a class is already used in either team */
  isUsed(cls: GameClass): boolean {
    // Consider a class "used" only for the currently selected target team.
    const target = this.state.selectedTeam();
    return target === 'left'
      ? this.state.leftTeamIds().includes(cls.id)
      : this.state.rightTeamIds().includes(cls.id);
  }
}
