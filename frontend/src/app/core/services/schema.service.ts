import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SchemaService {
  private doc = inject(DOCUMENT);
  private readonly ID = 'schema-dynamic';

  set(schema: object): void {
    this.remove();
    const script = this.doc.createElement('script');
    script.id = this.ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    this.doc.head.appendChild(script);
  }

  remove(): void {
    this.doc.getElementById(this.ID)?.remove();
  }
}
