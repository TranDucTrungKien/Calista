import { Component, Input } from '@angular/core';
import { LucideAngularModule, ShoppingBag } from 'lucide-angular';
@Component({
  selector: 'app-icon-bag',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class BagIconComponent {
  readonly icon = ShoppingBag;
  @Input() size = 20;
}
