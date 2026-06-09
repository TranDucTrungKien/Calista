import { Component, Input } from '@angular/core';
import { LucideAngularModule, Heart } from 'lucide-angular';
@Component({
  selector: 'app-icon-heart',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class HeartIconComponent {
  readonly icon = Heart;
  @Input() size = 20;
}
