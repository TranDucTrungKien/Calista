import { Component, Input } from '@angular/core';
import { LucideAngularModule, Plus } from 'lucide-angular';
@Component({
  selector: 'app-icon-plus',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class PlusIconComponent {
  readonly icon = Plus;
  @Input() size = 18;
}
