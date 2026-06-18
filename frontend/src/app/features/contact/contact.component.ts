import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, CircleCheck } from 'lucide-angular';
import { Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SeoService } from '../../core/services/seo.service';
import { ChevronRightIconComponent } from '../../shared/icons/chevron-right-icon.component';
import { StarButtonDirective } from '../../shared/directives/star-button.directive';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, ChevronRightIconComponent, StarButtonDirective],
  styleUrls: ['./contact.component.css'],
  template: `
    <!-- ── HERO ─────────────────────────────────────────────── -->
    <section class="contact-hero">
      <div class="contact-container">
        <nav class="flex items-center gap-xs text-body-sm text-on-surface-variant mb-md">
          <a routerLink="/" class="hover:text-primary">Trang chủ</a>
          <app-icon-chevron-right [size]="12" />
          <span class="text-on-surface">Liên hệ</span>
        </nav>
        <div class="hero-content">
          <h1 class="hero-title">Liên hệ với Calista</h1>
          <p class="hero-subtitle">
            Calista luôn sẵn sàng hỗ trợ bạn về sản phẩm mỹ phẩm thuần chay, đơn hàng và tư vấn chăm sóc da. Phản hồi trong vòng 24 giờ làm việc.
          </p>
        </div>
      </div>
    </section>

    <!-- ── MAIN CONTENT ──────────────────────────────────────── -->
    <section class="contact-main">
      <div class="contact-container">
        <div class="main-grid">

          <!-- LEFT — FORM -->
          <div>
            <h2 class="form-title">Gửi tin nhắn cho chúng tôi</h2>
            <p class="form-subtitle">Điền thông tin bên dưới, đội ngũ Calista sẽ phản hồi bạn trong vòng 24 giờ.</p>

            @if (sent()) {
              <div class="success-card">
                <div class="success-icon">
                  <lucide-icon [img]="circleCheckIcon" [size]="48" [strokeWidth]="1.5" />
                </div>
                <p class="success-title">Đã nhận được tin nhắn!</p>
                <p class="success-body">Chúng tôi sẽ phản hồi bạn trong vòng 24 giờ làm việc.</p>
              </div>
            } @else {
              <form (ngSubmit)="submit()">

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Họ và tên <span class="required">*</span></label>
                    <input
                      [(ngModel)]="form.name"
                      name="name"
                      class="form-input"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email <span class="required">*</span></label>
                    <input
                      [(ngModel)]="form.email"
                      name="email"
                      type="email"
                      class="form-input"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Số điện thoại</label>
                  <input
                    [(ngModel)]="form.phone"
                    name="phone"
                    class="form-input"
                    placeholder="0901 234 567"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Chủ đề <span class="required">*</span></label>
                  <select [(ngModel)]="form.subject" name="subject" class="form-select" required>
                    <option value="">Chọn chủ đề...</option>
                    <option>Tư vấn sản phẩm</option>
                    <option>Theo dõi đơn hàng</option>
                    <option>Đổi trả & Hoàn tiền</option>
                    <option>Hợp tác & Phân phối</option>
                    <option>Khác</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Nội dung <span class="required">*</span></label>
                  <textarea
                    [(ngModel)]="form.message"
                    name="message"
                    class="form-textarea"
                    placeholder="Hãy cho chúng tôi biết chúng tôi có thể giúp gì cho bạn..."
                    required
                  ></textarea>
                </div>

                <button type="submit" class="btn-submit" appStarBtn>Gửi tin nhắn</button>

              </form>
            }
          </div>

          <!-- RIGHT — INFO -->
          <aside>
            <h2 class="info-heading">Thông tin liên hệ</h2>

            <div class="info-card">

              <!-- Địa chỉ -->
              <div class="info-item">
                <div class="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#546349" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div>
                  <p class="info-label">Địa chỉ</p>
                  <p class="info-value">123 Đường Nguyễn Huệ, Quận 1,<br />TP. Hồ Chí Minh</p>
                </div>
              </div>

              <!-- Điện thoại -->
              <div class="info-item">
                <div class="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#546349" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.9 12a19.79 19.79 0 0 1-3-8.68A2 2 0 0 1 3.88 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div>
                  <p class="info-label">Điện thoại</p>
                  <p class="info-value">1800 9090 (miễn phí)</p>
                  <p class="info-value">Thứ 2–6: 8:00 – 18:00</p>
                </div>
              </div>

              <!-- Email -->
              <div class="info-item">
                <div class="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#546349" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <div>
                  <p class="info-label">Email</p>
                  <p class="info-value">hello&#64;calista.vn</p>
                  <p class="info-value">Phản hồi trong 24 giờ</p>
                </div>
              </div>

              <!-- Mạng xã hội -->
              <div class="info-item">
                <div class="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#546349" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/>
                    <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                  </svg>
                </div>
                <div>
                  <p class="info-label">Mạng xã hội</p>
                  <p class="info-value">Shopee: [SHOPEE_URL]</p>
                  <p class="info-value">TikTok Shop: [TIKTOK_URL]</p>
                </div>
              </div>

            </div>

            <!-- Giờ làm việc -->
            <div class="hours-card">
              <h3 class="hours-title">Giờ làm việc</h3>
              <div class="hours-row">
                <span>Thứ 2 – Thứ 6</span>
                <span>8:00 – 18:00</span>
              </div>
              <div class="hours-row">
                <span>Thứ 7</span>
                <span>9:00 – 16:00</span>
              </div>
              <div class="hours-row">
                <span>Chủ nhật</span>
                <span class="hours-closed">Nghỉ</span>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </section>

    <!-- ── MAP ───────────────────────────────────────────────── -->
    <section class="contact-map">
      <div class="contact-container">
        <div class="map-label-wrap">
          <span class="map-label">Tìm chúng tôi</span>
        </div>
      </div>
      <div class="map-embed">
        <!-- [MAP_EMBED_URL]: Thay bằng Google Maps Embed URL thực tế -->
        <!-- Cách lấy: Google Maps → Chia sẻ → Nhúng bản đồ → Sao chép HTML -->
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5177647457637!2d106.6997781!3d10.7727547!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3a9d8a7b37%3A0x37f59a72d1e0e28c!2zMTIzIMSQLiBOZ3V54buFbiBIdeG7hywgUXXhuq1uIDEsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1699000000000!5m2!1svi!2s"
          width="100%"
          height="360"
          allowfullscreen
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          title="Calista Skincare Boutique — 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
        ></iframe>
      </div>
    </section>
  `,
})
export class ContactComponent implements OnInit, OnDestroy {
  private seo = inject(SeoService);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  readonly circleCheckIcon = CircleCheck;

  sent = signal(false);

  form = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  };

  submit() {
    this.sent.set(true);
  }

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Liên Hệ | Calista Skincare Boutique - Mỹ Phẩm Thuần Chay',
      description: 'Liên hệ với Calista Skincare Boutique — thương hiệu mỹ phẩm thuần chay Việt Nam. Hỗ trợ đơn hàng, tư vấn sản phẩm và hợp tác. Phản hồi trong 24 giờ.',
      canonical: 'https://calista.vn/lien-he',
    });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.injectJsonLd();
  }

  ngOnDestroy(): void {
    this.removeJsonLd();
  }

  private injectJsonLd(): void {
    this.removeJsonLd();
    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': 'Calista Skincare Boutique',
        'image': 'https://calista.vn/assets/images/logo.png',
        'url': 'https://calista.vn',
        'telephone': '1800-9090',
        'email': 'hello@calista.vn',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': '123 Đường Nguyễn Huệ',
          'addressLocality': 'Quận 1',
          'addressRegion': 'TP. Hồ Chí Minh',
          'addressCountry': 'VN',
        },
        'openingHoursSpecification': [
          {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'opens': '08:00',
            'closes': '18:00',
          },
          {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': ['Saturday'],
            'opens': '09:00',
            'closes': '16:00',
          },
        ],
        'sameAs': ['[SHOPEE_URL]', '[TIKTOK_URL]'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Trang chủ', 'item': 'https://calista.vn' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Liên hệ', 'item': 'https://calista.vn/lien-he' },
        ],
      },
    ];
    schemas.forEach((schema, i) => {
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-contact-schema', String(i));
      script.textContent = JSON.stringify(schema);
      this.doc.head.appendChild(script);
    });
  }

  private removeJsonLd(): void {
    this.doc.querySelectorAll('script[data-contact-schema]').forEach(el => el.remove());
  }
}
