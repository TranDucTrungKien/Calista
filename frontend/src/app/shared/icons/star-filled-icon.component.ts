import { Component, Input } from '@angular/core';
@Component({
  selector: 'app-icon-star-filled',
  standalone: true,
  template: `<svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.5 2.9 1.1-6.1L3.3 9.5l6.1-.9L12 3Z"/></svg>`,
})
export class StarFilledIconComponent { @Input() size = 16; }
