import { Component, Input } from '@angular/core';
import { LucideAngularModule, Star } from 'lucide-angular';
@Component({
  selector: 'app-icon-star',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class StarIconComponent {
  readonly icon = Star;
  @Input() size = 16;
}
