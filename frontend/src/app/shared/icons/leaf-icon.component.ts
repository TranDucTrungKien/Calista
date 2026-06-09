import { Component, Input } from '@angular/core';
import { LucideAngularModule, Leaf } from 'lucide-angular';
@Component({
  selector: 'app-icon-leaf',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class LeafIconComponent {
  readonly icon = Leaf;
  @Input() size = 18;
}
