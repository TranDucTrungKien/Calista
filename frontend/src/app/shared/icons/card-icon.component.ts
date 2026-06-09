import { Component, Input } from '@angular/core';
import { LucideAngularModule, CreditCard } from 'lucide-angular';
@Component({
  selector: 'app-icon-card',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class CardIconComponent {
  readonly icon = CreditCard;
  @Input() size = 18;
}
