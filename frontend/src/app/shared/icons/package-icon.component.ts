import { Component, Input } from '@angular/core';
import { LucideAngularModule, Package } from 'lucide-angular';
@Component({
  selector: 'app-icon-package',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class PackageIconComponent {
  readonly icon = Package;
  @Input() size = 20;
}
