import { Component, Input } from '@angular/core';
import { FlowerIconComponent } from '../../icons/flower-icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [FlowerIconComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-xxl text-center">
      <div class="w-[80px] h-[80px] rounded-full bg-surface-mid flex items-center justify-center text-primary mb-md">
        <app-icon-flower [size]="40" />
      </div>
      <h3 class="text-headline-sm mb-sm">{{ title }}</h3>
      <p class="text-body-md text-on-surface-variant max-w-[420px]">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = 'Chưa có dữ liệu';
  @Input() message = 'Hiện chưa có nội dung để hiển thị.';
}
