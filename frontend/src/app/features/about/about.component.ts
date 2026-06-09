import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Leaf, Microscope, Recycle } from 'lucide-angular';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  template: `
    <!-- Hero -->
    <section class="relative overflow-hidden" style="background: linear-gradient(135deg, #fff1f3 0%, #fff8f0 100%);">
      <div class="container-app py-xxl md:py-xxxl">
        <div class="max-w-[680px]">
          <span class="bg-primary text-on-primary text-[11px] font-semibold rounded-full px-sm py-[3px] uppercase tracking-wider">Về chúng tôi</span>
          <h1 class="text-display-lg-mob md:text-headline-md mt-md mb-md" style="font-size:40px;line-height:48px;letter-spacing:-0.03em">
            Chúng tôi tin vào<br />vẻ đẹp thuần khiết
          </h1>
          <p class="text-body-lg text-on-surface-variant max-w-[560px]">
            Calista được thành lập với sứ mệnh đơn giản: mang đến những sản phẩm chăm sóc da hiệu quả,
            an toàn và hoàn toàn thân thiện với môi trường.
          </p>
        </div>
      </div>
    </section>

    <!-- Mission -->
    <section class="container-app py-xxl">
      <div class="grid md:grid-cols-2 gap-xxl items-center">
        <div>
          <h2 class="text-headline-md mb-md">Sứ mệnh của chúng tôi</h2>
          <p class="text-body-md text-on-surface-variant mb-md">
            Tại Calista, chúng tôi cam kết xây dựng một thế giới làm đẹp bền vững hơn.
            Mỗi sản phẩm đều được nghiên cứu và phát triển từ những nguyên liệu thực vật tự nhiên,
            không thử nghiệm trên động vật và hoàn toàn thuần chay.
          </p>
          <p class="text-body-md text-on-surface-variant mb-lg">
            Chúng tôi tin rằng chăm sóc da không cần phải đánh đổi bằng sức khỏe của bạn
            hay sức khỏe của hành tinh. Đó là lý do mọi thứ chúng tôi tạo ra đều nhẹ nhàng,
            hiệu quả và có trách nhiệm.
          </p>
          <a routerLink="/san-pham" class="btn-primary rounded-full px-xl">Khám phá sản phẩm</a>
        </div>
        <div class="rounded-[20px] overflow-hidden aspect-[4/3]">
          <img src="https://picsum.photos/seed/about-mission/900/700" alt="Mission" class="w-full h-full object-cover" />
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="bg-surface-low border-y border-outline-variant py-xxl">
      <div class="container-app">
        <h2 class="text-headline-md text-center mb-xl">Giá trị cốt lõi</h2>
        <div class="grid md:grid-cols-3 gap-lg">
          <div class="bg-surface rounded-[14px] p-lg border border-outline-variant">
            <div class="w-[48px] h-[48px] bg-primary-container rounded-full flex items-center justify-center mb-md text-primary">
              <lucide-icon [img]="leafIcon" [size]="22" [strokeWidth]="1.5" />
            </div>
            <h3 class="text-[18px] font-bold mb-sm">100% Thuần chay</h3>
            <p class="text-body-sm text-on-surface-variant">Không thành phần động vật, không thử nghiệm trên động vật — cam kết tuyệt đối.</p>
          </div>
          <div class="bg-surface rounded-[14px] p-lg border border-outline-variant">
            <div class="w-[48px] h-[48px] bg-primary-container rounded-full flex items-center justify-center mb-md text-primary">
              <lucide-icon [img]="microscopeIcon" [size]="22" [strokeWidth]="1.5" />
            </div>
            <h3 class="text-[18px] font-bold mb-sm">Khoa học & Thiên nhiên</h3>
            <p class="text-body-sm text-on-surface-variant">Mỗi công thức kết hợp tinh chất thực vật với nghiên cứu da liễu hiện đại.</p>
          </div>
          <div class="bg-surface rounded-[14px] p-lg border border-outline-variant">
            <div class="w-[48px] h-[48px] bg-primary-container rounded-full flex items-center justify-center mb-md text-primary">
              <lucide-icon [img]="recycleIcon" [size]="22" [strokeWidth]="1.5" />
            </div>
            <h3 class="text-[18px] font-bold mb-sm">Bao bì bền vững</h3>
            <p class="text-body-sm text-on-surface-variant">Bao bì tái chế 100%, in mực gốc nước, không nhựa dùng một lần.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Team -->
    <section class="container-app py-xxl">
      <h2 class="text-headline-md mb-xl">Đội ngũ sáng lập</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
        @for (m of team; track m.name) {
          <div class="text-center">
            <div class="rounded-full overflow-hidden aspect-square w-[120px] mx-auto mb-sm">
              <img [src]="m.img" [alt]="m.name" class="w-full h-full object-cover" />
            </div>
            <p class="font-semibold text-body-md">{{ m.name }}</p>
            <p class="text-body-sm text-on-surface-variant">{{ m.role }}</p>
          </div>
        }
      </div>
    </section>

    <!-- CTA -->
    <section class="container-app py-xxl">
      <div class="bg-primary rounded-[20px] p-xl md:p-xxl text-center text-on-primary">
        <h2 class="text-headline-md mb-md text-white">Bắt đầu hành trình làm đẹp</h2>
        <p class="text-body-md mb-lg opacity-90">Khám phá hơn 50 sản phẩm thuần chay được yêu thích nhất</p>
        <a routerLink="/san-pham" class="inline-flex btn bg-surface text-primary rounded-full px-xl hover:opacity-90">Mua ngay</a>
      </div>
    </section>
  `,
})
export class AboutComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Về chúng tôi | Calista',
      description: 'Calista được thành lập với sứ mệnh mang đến sản phẩm chăm sóc da hiệu quả, an toàn và thân thiện môi trường từ chiết xuất thiên nhiên thuần chay.',
      canonical: 'https://calista.vn/ve-chung-toi',
    });
  }
  readonly leafIcon = Leaf;
  readonly microscopeIcon = Microscope;
  readonly recycleIcon = Recycle;

  team = [
    { name: 'Linh Nguyễn', role: 'CEO & Co-founder', img: 'https://picsum.photos/seed/team1/200/200' },
    { name: 'Minh Trần', role: 'Head of R&D', img: 'https://picsum.photos/seed/team2/200/200' },
    { name: 'Hà Lê', role: 'Creative Director', img: 'https://picsum.photos/seed/team3/200/200' },
    { name: 'An Phạm', role: 'Sustainability Lead', img: 'https://picsum.photos/seed/team4/200/200' },
  ];
}
