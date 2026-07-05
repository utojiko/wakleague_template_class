import { Component, inject } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { ToastService } from '../../services/toast.service';
import { GameClass, GameMap } from '../../models/game-class.model';

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
  showResetDialog = false;

  async copyOverlayLink(): Promise<void> {
    // If a session is active, generate a session-based URL; otherwise create one and set it.
    const origin = window.location.origin;
    const base = '/wakleague_template_class';
    let sid = this.state.sessionId();
    const created = !sid;
    if (!sid) {
      // create a short unique id
      sid = Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
      // set the session locally (this will attempt to initialize remote sync if configured)
      this.state.setSession(sid);
    }
    // Use a query parameter so GitHub Pages does not return a 404 for the session URL.
    const overlayUrl = `${origin}${base}?session=${encodeURIComponent(sid)}&scoreboard=true`;

    try {
      await navigator.clipboard.writeText(overlayUrl);
      if (!created) {
        this.toast.show('Lien scoreboard copié dans le presse-papiers. Collez-le dans OBS / Streamlabs.');
      }
    } catch {
      // Fallback: show the URL for manual copy
      prompt('Copiez ce lien pour OBS / Streamlabs (Ctrl+C):', overlayUrl);
    }

    // If we just created the session, redirect the current page to that clean session URL
    if (created) {
      try {
        window.location.href = `${origin}${base}?session=${encodeURIComponent(sid)}`;
      } catch {
        // ignore navigation errors
      }
    }
  }

  tryAddClass(cls: GameClass): void {
    const team = this.state.selectedTeam();

    if (!this.state.canAddToSelectedTeam()) {
      this.toast.show(`L'équipe ${team === 'left' ? 'gauche' : 'droite'} est déjà complète.`);
      return;
    }

    const alreadyUsed = team === 'left'
      ? this.state.leftTeamIds().includes(cls.id)
      : this.state.rightTeamIds().includes(cls.id);

    if (alreadyUsed) {
      this.toast.show(`${cls.name} est déjà dans l'équipe sélectionnée.`);
      return;
    }

    const added = this.state.addClass(cls);
    if (added) {
      this.toast.show(`${cls.name} ajoutée à l'équipe ${team === 'left' ? 'gauche' : 'droite'}.`);
    } else {
      this.toast.show(`Impossible d'ajouter ${cls.name}.`);
    }
  }

  setTargetTeam(team: 'left' | 'right'): void {
    this.state.selectedTeam.set(team);
  }

  reset(): void {
    this.showResetDialog = true;
  }

  cancelReset(): void {
    this.showResetDialog = false;
  }

  confirmReset(): void {
    this.state.resetAll();
    this.showResetDialog = false;
    this.toast.show('Les deux équipes et leurs noms ont été réinitialisés.');
  }

  async copyFullScreenLink(): Promise<void> {
    const origin = window.location.origin;
    const base = '/wakleague_template_class';
    let sid = this.state.sessionId();
    if (!sid) {
      sid = Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
      this.state.setSession(sid);
    }
    const fullscreenUrl = `${origin}${base}?session=${encodeURIComponent(sid)}&full-screen=true`;

    try {
      await navigator.clipboard.writeText(fullscreenUrl);
      this.toast.show('Lien full-screen copié dans le presse-papiers.');
    } catch {
      prompt('Copiez ce lien pour OBS / Streamlabs (Ctrl+C):', fullscreenUrl);
    }
  }

  toggleScore(): void {
    this.state.toggleShowScore();
  }

  selectMap(map: GameMap): void {
    const isSelected = this.state.selectedMap()?.id === map.id;
    this.state.setMap(isSelected ? null : map.id);
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
