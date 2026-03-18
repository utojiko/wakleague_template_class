import { Component, OnInit, signal } from '@angular/core';
import { TeamDisplayComponent } from './components/team-display/team-display.component';
import { ClassSelectorComponent } from './components/class-selector/class-selector.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TeamDisplayComponent, ClassSelectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  /** True when ?overlay=true is present in the URL */
  readonly isOverlayMode = signal<boolean>(false);

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    this.isOverlayMode.set(params.get('overlay') === 'true');
  }
}
