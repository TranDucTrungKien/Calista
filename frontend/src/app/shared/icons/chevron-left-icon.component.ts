import { Component, Input } from '@angular/core';
import { LucideAngularModule, ChevronLeft } from 'lucide-angular';
@Component({
  selector: 'app-icon-chevron-left',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class ChevronLeftIconComponent {
  readonly icon = ChevronLeft;
  @Input() size = 18;
}
