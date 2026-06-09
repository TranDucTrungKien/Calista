import { Component, Input } from '@angular/core';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';
@Component({
  selector: 'app-icon-chevron-down',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class ChevronDownIconComponent {
  readonly icon = ChevronDown;
  @Input() size = 18;
}
