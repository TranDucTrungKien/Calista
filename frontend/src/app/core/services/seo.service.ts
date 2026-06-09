import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

const BASE_URL = 'https://calista.vn';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private doc = inject(DOCUMENT);
  private router = inject(Router);

  init(): void {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.setCanonical(e.urlAfterRedirects);
      });
  }

  setPage(opts: {
    title: string;
    description: string;
    canonical?: string;
    image?: string;
    type?: string;
  }): void {
    const desc = opts.description.length > 120 ? opts.description.slice(0, 117) + '...' : opts.description;
    const fullTitle = opts.title.includes('Calista') ? opts.title : `${opts.title} | Calista`;
    const canon = opts.canonical ?? `${BASE_URL}${this.router.url.split('?')[0]}`;
    const image = opts.image ?? `${BASE_URL}/assets/images/coverpage.png`;

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: desc });

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: desc });
    this.meta.updateTag({ property: 'og:url', content: canon });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: opts.type ?? 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'vi_VN' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Calista' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: desc });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(canon);
  }

  private setCanonical(url: string): void {
    const href = url.startsWith('http') ? url : `${BASE_URL}${url.split('?')[0]}`;
    let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
