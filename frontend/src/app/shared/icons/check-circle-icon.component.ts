import { Component, Input } from '@angular/core';
import { LucideAngularModule, CircleCheck } from 'lucide-angular';
@Component({
  selector: 'app-icon-check-circle',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class CheckCircleIconComponent {
  readonly icon = CircleCheck;
  @Input() size = 20;
}
