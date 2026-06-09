import { Component, Input } from '@angular/core';
import { LucideAngularModule, SlidersHorizontal } from 'lucide-angular';
@Component({
  selector: 'app-icon-filter',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class FilterIconComponent {
  readonly icon = SlidersHorizontal;
  @Input() size = 18;
}
