import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { CheckCircleIconComponent } from '../../icons/check-circle-icon.component';
import { CloseIconComponent } from '../../icons/close-icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, CheckCircleIconComponent, CloseIconComponent],
  template: `
    <div class="fixed top-md right-md z-[100] flex flex-col gap-sm pointer-events-none">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="pointer-events-auto flex items-start gap-sm rounded-md px-md py-sm shadow-card animate-slide-down min-w-[260px] max-w-[360px]"
          [class.bg-primary]="t.type === 'success'"
          [class.text-on-primary]="t.type === 'success'"
          [class.bg-error-container]="t.type === 'error'"
          [class.text-on-surface]="t.type !== 'success'"
          [class.bg-surface-mid]="t.type === 'info'"
        >
          @if (t.type === 'success') {
            <app-icon-check-circle [size]="20" class="mt-[2px] shrink-0" />
          }
          <p class="flex-1 text-body-sm leading-snug">{{ t.message }}</p>
          <button
            type="button"
            class="opacity-70 hover:opacity-100 shrink-0"
            (click)="toast.remove(t.id)"
            aria-label="Đóng thông báo"
          >
            <app-icon-close [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  toast = inject(ToastService);
}
