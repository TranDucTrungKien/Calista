import { Component, Input } from '@angular/core';
import { LucideAngularModule, ChevronRight } from 'lucide-angular';
@Component({
  selector: 'app-icon-chevron-right',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class ChevronRightIconComponent {
  readonly icon = ChevronRight;
  @Input() size = 18;
}
