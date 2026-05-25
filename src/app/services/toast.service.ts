import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts.asObservable();
  private nextId = 1;

  show(message: string, duration = 3000): void {
    const id = this.nextId++;
    const current = this._toasts.value;
    this._toasts.next([...current, { id, message }]);

    setTimeout(() => {
      const after = this._toasts.value.filter((t) => t.id !== id);
      this._toasts.next(after);
    }, duration);
  }
}
