import { Component, Input } from '@angular/core';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
@Component({
  selector: 'app-icon-trash',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class TrashIconComponent {
  readonly icon = Trash2;
  @Input() size = 18;
}
