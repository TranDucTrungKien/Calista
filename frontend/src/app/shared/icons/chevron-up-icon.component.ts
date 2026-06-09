import { Component, Input } from '@angular/core';
import { LucideAngularModule, ChevronUp } from 'lucide-angular';
@Component({
  selector: 'app-icon-chevron-up',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class ChevronUpIconComponent {
  readonly icon = ChevronUp;
  @Input() size = 18;
}
