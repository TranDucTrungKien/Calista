import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SeoService } from '../../core/services/seo.service';
import { ChevronRightIconComponent } from '../../shared/icons/chevron-right-icon.component';
import { StarButtonDirective } from '../../shared/directives/star-button.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, ChevronRightIconComponent, StarButtonDirective],
  styleUrls: ['./about.component.css'],
  template: `
    <!-- ── HERO ─────────────────────────────────────────────── -->
    <section class="about-hero">
      <div class="about-container">
        <nav class="flex items-center gap-xs text-body-sm text-on-surface-variant mb-md">
          <a routerLink="/" class="hover:text-primary">Trang chủ</a>
          <app-icon-chevron-right [size]="12" />
          <span class="text-on-surface">Về chúng tôi</span>
        </nav>
        <div class="hero-content">
          <h1 class="hero-title">
            Chúng tôi tin vào<br />vẻ đẹp <em>thuần khiết</em>
          </h1>
          <p class="hero-body">
            Calista là thương hiệu mỹ phẩm thuần chay (vegan) được thành lập tại Việt Nam, với sứ mệnh mang đến các sản phẩm chăm sóc da hiệu quả, an toàn và hoàn toàn thân thiện với môi trường. Mọi sản phẩm Calista đều không chứa thành phần động vật, không thử nghiệm trên động vật và sử dụng bao bì tái chế 100%.
          </p>
        </div>
      </div>
    </section>

    <!-- ── SỨ MỆNH ───────────────────────────────────────────── -->
    <section id="su-menh" class="about-mission">
      <div class="about-container">
        <div class="mission-grid">
          <div class="mission-text">
            <h2 class="section-title">Sứ mệnh của chúng tôi</h2>
            <p class="mission-body">
              Tại Calista, chúng tôi cam kết xây dựng một thế giới làm đẹp bền vững hơn. Mỗi sản phẩm được nghiên cứu và phát triển từ nguyên liệu thực vật thiên nhiên, không thử nghiệm trên động vật và hoàn toàn thuần chay — đạt tiêu chuẩn vegan quốc tế.
            </p>
            <p class="mission-body">
              Calista tin rằng chăm sóc da hiệu quả không cần đánh đổi sức khỏe hay đạo đức. Đó là lý do mọi thứ chúng tôi tạo ra đều nhẹ nhàng với làn da, minh bạch về thành phần và có trách nhiệm với hành tinh.
            </p>
            <a routerLink="/san-pham" class="btn-luxury" appStarBtn>Khám phá sản phẩm</a>
          </div>
          <div class="mission-image-outer">
            <div class="mission-image-wrap">
              <img
                src="https://picsum.photos/seed/calista-skincare-boutique/900/700"
                alt="Sản phẩm mỹ phẩm thuần chay Calista Skincare Boutique"
                class="mission-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── GIÁ TRỊ CỐT LÕI ──────────────────────────────────── -->
    <section id="gia-tri-cot-loi" class="about-values">
      <div class="about-container">
        <h2 class="section-title section-title--centered">Giá trị cốt lõi</h2>
        <div class="values-grid">

          <div class="value-card" aria-label="Giá trị cốt lõi: 100% Thuần chay">
            <div class="value-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#546349" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <h3 class="value-card-title">100% Thuần chay</h3>
            <p class="value-card-body">Calista không sử dụng bất kỳ thành phần có nguồn gốc động vật nào. Tất cả sản phẩm đều cruelty-free và không thử nghiệm trên động vật.</p>
          </div>

          <div class="value-card" aria-label="Giá trị cốt lõi: Khoa học & Thiên nhiên">
            <div class="value-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#546349" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M10 2v8L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8V2"/>
                <path d="M8.5 2h7"/>
                <path d="M7 16h10"/>
              </svg>
            </div>
            <h3 class="value-card-title">Khoa học & Thiên nhiên</h3>
            <p class="value-card-body">Mỗi công thức kết hợp hoạt chất thực vật được chứng minh lâm sàng với nghiên cứu da liễu hiện đại, phù hợp đặc biệt cho làn da người Việt Nam.</p>
          </div>

          <div class="value-card" aria-label="Giá trị cốt lõi: Bao bì bền vững">
            <div class="value-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#546349" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
                <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
                <path d="m14 16-3 3 3 3"/>
                <path d="M8.293 13.596 7.196 9.5 3.1 10.598"/>
                <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/>
                <path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
              </svg>
            </div>
            <h3 class="value-card-title">Bao bì bền vững</h3>
            <p class="value-card-body">Calista sử dụng bao bì tái chế 100%, in mực gốc nước, không nhựa dùng một lần — giảm thiểu tác động môi trường ở mọi khâu.</p>
          </div>

        </div>
      </div>
    </section>

    <!-- ── ĐỘI NGŨ SÁNG LẬP ──────────────────────────────────── -->
    <section id="doi-ngu" class="about-team">
      <div class="about-container">
        <h2 class="section-title">Đội ngũ sáng lập</h2>
        <div class="team-grid">
          @for (m of team; track m.name) {
            <div class="team-member">
              <div class="member-avatar-wrap">
                <img
                  [src]="m.img"
                  [alt]="'Ảnh ' + m.name + ' - ' + m.role + ' tại Calista Skincare Boutique'"
                  class="member-avatar"
                />
              </div>
              <p class="member-name">{{ m.name }}</p>
              <p class="member-role">{{ m.role }}</p>
              <p class="member-bio">{{ m.bio }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── FAQ ───────────────────────────────────────────────── -->
    <section id="faq" class="about-faq">
      <div class="about-container about-container--narrow">
        <h2 class="section-title section-title--centered">Câu hỏi thường gặp</h2>
        <div class="faq-list">
          @for (item of faqs; track item.q; let i = $index) {
            <div class="faq-item" [class.faq-item--open]="openFaq === i">
              <button
                class="faq-btn"
                [attr.aria-expanded]="openFaq === i"
                [attr.aria-controls]="'faq-answer-' + i"
                (click)="toggleFaq(i)"
              >
                <span>{{ item.q }}</span>
                <span class="faq-icon" aria-hidden="true">
                  <span class="faq-icon-h"></span>
                  <span class="faq-icon-v"></span>
                </span>
              </button>
              <div
                [id]="'faq-answer-' + i"
                class="faq-answer"
                [style.maxHeight]="openFaq === i ? '400px' : '0px'"
                [style.paddingBottom]="openFaq === i ? '20px' : '0'"
              >
                {{ item.a }}
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── CTA ───────────────────────────────────────────────── -->
    <section class="about-cta">
      <div class="about-container">
        <div class="cta-inner">
          <h2 class="cta-title">Bắt đầu hành trình làm đẹp</h2>
          <p class="cta-body">Khám phá hơn 50 sản phẩm mỹ phẩm thuần chay Calista được hàng nghìn khách hàng Việt Nam tin dùng.</p>
          <a routerLink="/san-pham" class="btn-cta" appStarBtn>Mua ngay</a>
        </div>
      </div>
    </section>
  `,
})
export class AboutComponent implements OnInit, OnDestroy {
  private seo = inject(SeoService);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  openFaq: number | null = null;

  toggleFaq(index: number): void {
    this.openFaq = this.openFaq === index ? null : index;
  }

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Về Chúng Tôi | Calista Skincare Boutique - Mỹ Phẩm Thuần Chay Việt Nam',
      description: 'Calista là thương hiệu mỹ phẩm thuần chay Việt Nam. Sản phẩm vegan, cruelty-free, bao bì tái chế. Khám phá câu chuyện và giá trị cốt lõi của Calista.',
      canonical: 'https://calista.vn/ve-chung-toi',
    });
    this.meta.updateTag({ name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large' });
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
        '@type': 'Organization',
        'name': 'Calista Skincare Boutique',
        'url': 'https://calista.vn',
        'logo': 'https://calista.vn/assets/images/logo.png',
        'description': 'Thương hiệu mỹ phẩm thuần chay Việt Nam, cruelty-free và bền vững.',
        'foundingDate': '[FOUNDING_YEAR]',
        'sameAs': ['[SHOPEE_URL]', '[TIKTOK_SHOP_URL]'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Trang chủ', 'item': 'https://calista.vn' },
          { '@type': 'ListItem', 'position': 2, 'name': 'Về chúng tôi', 'item': 'https://calista.vn/ve-chung-toi' },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': this.faqs.map(f => ({
          '@type': 'Question',
          'name': f.q,
          'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
        })),
      },
    ];
    schemas.forEach((schema, i) => {
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-about-schema', String(i));
      script.textContent = JSON.stringify(schema);
      this.doc.head.appendChild(script);
    });
  }

  private removeJsonLd(): void {
    this.doc.querySelectorAll('script[data-about-schema]').forEach(el => el.remove());
  }

  team = [
    {
      name: 'Kjn Tran',
      role: 'CEO & Co-founder',
      img: 'https://picsum.photos/seed/kjn-tran/200/200',
      bio: 'Kjn sáng lập Calista với tầm nhìn xây dựng thương hiệu skincare thuần chay hàng đầu Việt Nam.',
    },
    {
      name: 'Nhat Do',
      role: 'Head of R&D',
      img: 'https://picsum.photos/seed/nhat-do/200/200',
      bio: 'Nhat dẫn dắt nghiên cứu phát triển sản phẩm, đảm bảo mọi công thức đều an toàn, hiệu quả và thuần chay.',
    },
    {
      name: 'Sang Nguyen',
      role: 'Operations Lead',
      img: 'https://picsum.photos/seed/sang-nguyen/200/200',
      bio: 'Sang phụ trách vận hành và chuỗi cung ứng, đảm bảo sản phẩm đến tay khách hàng nhanh chóng và chất lượng.',
    },
    {
      name: 'Bich Nga',
      role: 'Creative Director',
      img: 'https://picsum.photos/seed/bich-nga/200/200',
      bio: 'Bich Nga định hình bản sắc thương hiệu Calista, truyền tải vẻ đẹp thuần khiết qua từng hình ảnh và trải nghiệm.',
    },
    {
      name: 'Anh Ngoc',
      role: 'Brand & Community',
      img: 'https://picsum.photos/seed/anh-ngoc/200/200',
      bio: 'Anh Ngoc xây dựng cộng đồng và kết nối thương hiệu Calista với hàng nghìn khách hàng trên khắp Việt Nam.',
    },
  ];

  faqs = [
    {
      q: 'Calista có phải thương hiệu mỹ phẩm thuần chay không?',
      a: 'Có. Calista là thương hiệu mỹ phẩm thuần chay (100% vegan) được thành lập tại Việt Nam. Tất cả sản phẩm không chứa thành phần động vật, không thử nghiệm trên động vật và được chứng nhận cruelty-free.',
    },
    {
      q: 'Sản phẩm Calista có phù hợp với da nhạy cảm không?',
      a: 'Có. Calista được phát triển đặc biệt cho làn da người Việt Nam, bao gồm da nhạy cảm. Các công thức sử dụng hoạt chất lành tính, không chứa paraben, sulfate hay hương liệu tổng hợp gây kích ứng.',
    },
    {
      q: 'Mua sản phẩm Calista ở đâu?',
      a: 'Sản phẩm Calista có thể mua trực tiếp tại website chính thức, gian hàng Shopee và TikTok Shop của thương hiệu. Calista giao hàng toàn quốc với chính sách đổi trả trong 7 ngày.',
    },
    {
      q: 'Thành phần sản phẩm Calista có an toàn không?',
      a: 'Có. Calista cam kết minh bạch 100% về thành phần. Mọi nguyên liệu đều có nguồn gốc thực vật thiên nhiên, được kiểm định an toàn và không chứa các chất độc hại theo tiêu chuẩn quốc tế.',
    },
    {
      q: 'Bao bì Calista có thân thiện với môi trường không?',
      a: 'Có. Calista sử dụng bao bì tái chế 100%, in mực gốc nước và không dùng nhựa một lần. Thương hiệu cam kết giảm thiểu rác thải nhựa trong toàn bộ chuỗi cung ứng.',
    },
  ];
}
