import { Component, Input } from '@angular/core';
import { LucideAngularModule, Eye } from 'lucide-angular';
@Component({
  selector: 'app-icon-eye',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class EyeIconComponent {
  readonly icon = Eye;
  @Input() size = 20;
}
