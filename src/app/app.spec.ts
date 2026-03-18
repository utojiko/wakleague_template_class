import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the brand name', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-name')?.textContent).toContain('Wakfu PvP Overlay');
  });

  it('should be in overlay mode when URL has overlay=true', () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, search: '?overlay=true' },
    });
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    expect(fixture.componentInstance.isOverlayMode()).toBe(true);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });
});

