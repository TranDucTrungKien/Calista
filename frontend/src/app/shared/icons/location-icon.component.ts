import { Component, Input } from '@angular/core';
import { LucideAngularModule, MapPin } from 'lucide-angular';
@Component({
  selector: 'app-icon-location',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class LocationIconComponent {
  readonly icon = MapPin;
  @Input() size = 18;
}
