import { Component, Input } from '@angular/core';
import { LucideAngularModule, Flower2 } from 'lucide-angular';
@Component({
  selector: 'app-icon-flower',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class FlowerIconComponent {
  readonly icon = Flower2;
  @Input() size = 18;
}
