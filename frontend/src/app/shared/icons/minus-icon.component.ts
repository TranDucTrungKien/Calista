import { Component, Input } from '@angular/core';
import { LucideAngularModule, Minus } from 'lucide-angular';
@Component({
  selector: 'app-icon-minus',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class MinusIconComponent {
  readonly icon = Minus;
  @Input() size = 18;
}
