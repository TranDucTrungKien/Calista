import { Component, Input } from '@angular/core';
import { LucideAngularModule, Droplet } from 'lucide-angular';
@Component({
  selector: 'app-icon-droplet',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class DropletIconComponent {
  readonly icon = Droplet;
  @Input() size = 18;
}
