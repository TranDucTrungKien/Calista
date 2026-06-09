import { Component, Input } from '@angular/core';
import { LucideAngularModule, User } from 'lucide-angular';
@Component({
  selector: 'app-icon-user',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class UserIconComponent {
  readonly icon = User;
  @Input() size = 20;
}
