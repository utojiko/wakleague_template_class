import { Component, OnInit, signal, inject } from '@angular/core';
import { TeamDisplayComponent } from './components/team-display/team-display.component';
import { ClassSelectorComponent } from './components/class-selector/class-selector.component';
import { ToastComponent } from './components/toast/toast.component';
import { GameStateService } from './services/game-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TeamDisplayComponent, ClassSelectorComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  /** Always run in overlay mode for a single-page overlay UI */
  readonly isOverlayMode = signal<boolean>(true);
  readonly state = inject(GameStateService);

  toggleOverlayEdit(): void {
    this.state.setOverlayEdit(!this.state.overlayEditEnabled());
  }

  ngOnInit(): void {
    // Single-page overlay: always add overlay-mode on <body> so the top can
    // act as a transparent overlay (Streamlabs / OBS usage).
    document.body.classList.add('overlay-mode');

    const params = new URLSearchParams(window.location.search);

    // If an encoded `state` parameter is present, try to apply it (useful when
    // embedding the overlay with a pre-filled teams snapshot).
    const encoded = params.get('state');
    if (encoded) {
      try {
        const decoded = decodeURIComponent(encoded);
        const parsed = JSON.parse(decoded);
        this.state.applyExportedState(parsed);
      } catch {
        // ignore malformed state
      }
    }

    // Detect session id from the path (e.g. /wakleague_template_class/SESSIONID)
    // but do not infer overlay/remote mode from the path anymore.
    const path = window.location.pathname || '/';
    const parts = path.replace(/\/+$/g, '').replace(/^\/+/, '').split('/');
    const baseName = 'wakleague_template_class';
    let detectedSid: string | null = null;

    // If the URL contains the base name followed by a segment, use that segment as SID
    const baseIndex = parts.indexOf(baseName);
    if (baseIndex >= 0 && parts.length > baseIndex + 1) {
      const candidate = parts[baseIndex + 1];
      if (candidate && candidate.length > 2) detectedSid = candidate;
    }

    // Fallback: use the last path segment if it's not the baseName
    const last = parts[parts.length - 1];
    if (!detectedSid && last && last !== baseName && last.length > 2) detectedSid = last;

    // Only explicit ?overlay=true or being inside an iframe should hide the
    // editing chrome. Path-based session links remain editable on GitHub Pages.
    const explicitOverlay = params.get('overlay') === 'true';

    if (detectedSid) {
      this.state.setSession(detectedSid);
    } else if (explicitOverlay) {
      // No SID but overlay flag present: mark as remote to hide chrome
      try { document.body.classList.add('overlay-remote'); } catch {}
    } else {
      try { document.body.classList.remove('overlay-remote'); } catch {}
    }

    // Also treat being embedded in an iframe (Streamlabs/OBS) as a remote overlay
    try {
      if (window.self !== window.top) {
        document.body.classList.add('overlay-remote');
      }
    } catch {
      // ignore cross-origin access errors
    }
  }
}
