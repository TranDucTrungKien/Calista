import { Component, Input } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';
@Component({
  selector: 'app-icon-close',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class CloseIconComponent {
  readonly icon = X;
  @Input() size = 18;
}
