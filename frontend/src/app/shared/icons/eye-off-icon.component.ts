import { Component, Input } from '@angular/core';
import { LucideAngularModule, EyeOff } from 'lucide-angular';
@Component({
  selector: 'app-icon-eye-off',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class EyeOffIconComponent {
  readonly icon = EyeOff;
  @Input() size = 20;
}
