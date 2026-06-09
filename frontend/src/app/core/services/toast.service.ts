import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  private seq = 0;
  toasts = this._toasts.asReadonly();

  success(message: string) { this.push('success', message); }
  error(message: string)   { this.push('error', message); }
  info(message: string)    { this.push('info', message); }

  private push(type: Toast['type'], message: string) {
    const id = ++this.seq;
    this._toasts.update((arr) => [...arr, { id, type, message }]);
    setTimeout(() => this.remove(id), 3500);
  }

  remove(id: number) {
    this._toasts.update((arr) => arr.filter((t) => t.id !== id));
  }
}
