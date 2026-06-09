import { Component, Input } from '@angular/core';
import { LucideAngularModule, Search } from 'lucide-angular';
@Component({
  selector: 'app-icon-search',
  standalone: true,
  imports: [LucideAngularModule],
  template: `<lucide-icon [img]="icon" [size]="size" [strokeWidth]="1.5" />`,
})
export class SearchIconComponent {
  readonly icon = Search;
  @Input() size = 20;
}
