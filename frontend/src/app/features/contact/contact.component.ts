import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, MapPin, Phone, Mail, CircleCheck } from 'lucide-angular';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <!-- Header -->
    <section class="border-b border-outline-variant bg-surface-low">
      <div class="container-app py-xl">
        <h1 class="text-headline-md">Liên hệ với chúng tôi</h1>
        <p class="text-body-md text-on-surface-variant mt-xs">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn</p>
      </div>
    </section>

    <section class="container-app py-xxl">
      <div class="grid md:grid-cols-[1fr_400px] gap-xxl">

        <!-- Contact form -->
        <div>
          <h2 class="text-headline-sm mb-lg">Gửi tin nhắn</h2>

          @if (sent()) {
            <div class="rounded-[14px] border border-outline-variant bg-surface-low p-lg text-center">
              <div class="flex justify-center mb-sm text-primary">
                <lucide-icon [img]="circleCheckIcon" [size]="48" [strokeWidth]="1.5" />
              </div>
              <p class="font-semibold text-body-lg mb-xs">Đã nhận được tin nhắn!</p>
              <p class="text-body-sm text-on-surface-variant">Chúng tôi sẽ phản hồi trong vòng 1-2 ngày làm việc.</p>
            </div>
          } @else {
            <form (ngSubmit)="submit()" class="space-y-md">
              <div class="grid md:grid-cols-2 gap-md">
                <div>
                  <label class="label">Họ và tên *</label>
                  <input [(ngModel)]="form.name" name="name" class="input" placeholder="Nguyễn Văn A" required />
                </div>
                <div>
                  <label class="label">Email *</label>
                  <input [(ngModel)]="form.email" name="email" type="email" class="input" placeholder="email@example.com" required />
                </div>
              </div>
              <div>
                <label class="label">Số điện thoại</label>
                <input [(ngModel)]="form.phone" name="phone" class="input" placeholder="0901 234 567" />
              </div>
              <div>
                <label class="label">Chủ đề *</label>
                <select [(ngModel)]="form.subject" name="subject" class="input" required>
                  <option value="">Chọn chủ đề...</option>
                  <option>Hỗ trợ đơn hàng</option>
                  <option>Tư vấn sản phẩm</option>
                  <option>Đổi trả & hoàn tiền</option>
                  <option>Hợp tác kinh doanh</option>
                  <option>Khác</option>
                </select>
              </div>
              <div>
                <label class="label">Nội dung *</label>
                <textarea
                  [(ngModel)]="form.message"
                  name="message"
                  class="input resize-none"
                  rows="5"
                  placeholder="Hãy cho chúng tôi biết chúng tôi có thể giúp gì cho bạn..."
                  required
                ></textarea>
              </div>
              <button type="submit" class="btn-primary rounded-full px-xl w-full md:w-auto">Gửi tin nhắn</button>
            </form>
          }
        </div>

        <!-- Contact info -->
        <aside class="space-y-md">
          <h2 class="text-headline-sm mb-lg">Thông tin liên hệ</h2>

          <div class="card p-lg space-y-md">
            <div class="flex items-start gap-md">
              <div class="w-[36px] h-[36px] bg-primary-container rounded-full flex items-center justify-center shrink-0 text-primary">
                <lucide-icon [img]="mapPinIcon" [size]="16" [strokeWidth]="1.5" />
              </div>
              <div>
                <p class="font-semibold text-body-md mb-xs">Địa chỉ</p>
                <p class="text-body-sm text-on-surface-variant">123 Đường Nguyễn Huệ,<br />Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>
            <div class="flex items-start gap-md">
              <div class="w-[36px] h-[36px] bg-primary-container rounded-full flex items-center justify-center shrink-0 text-primary">
                <lucide-icon [img]="phoneIcon" [size]="16" [strokeWidth]="1.5" />
              </div>
              <div>
                <p class="font-semibold text-body-md mb-xs">Điện thoại</p>
                <p class="text-body-sm text-on-surface-variant">1800 9090 (miễn phí)</p>
                <p class="text-body-sm text-on-surface-variant">Thứ 2–6: 8:00 – 18:00</p>
              </div>
            </div>
            <div class="flex items-start gap-md">
              <div class="w-[36px] h-[36px] bg-primary-container rounded-full flex items-center justify-center shrink-0 text-primary">
                <lucide-icon [img]="mailIcon" [size]="16" [strokeWidth]="1.5" />
              </div>
              <div>
                <p class="font-semibold text-body-md mb-xs">Email</p>
                <p class="text-body-sm text-on-surface-variant">hello&#64;calista.vn</p>
                <p class="text-body-sm text-on-surface-variant">Phản hồi trong 24 giờ</p>
              </div>
            </div>
          </div>

          <div class="card p-lg">
            <h3 class="font-semibold text-body-md mb-md">Giờ làm việc</h3>
            <table class="w-full text-body-sm">
              <tbody>
                <tr class="flex justify-between py-xs border-b border-outline-variant">
                  <td class="text-on-surface-variant">Thứ 2 – Thứ 6</td>
                  <td class="font-medium">8:00 – 18:00</td>
                </tr>
                <tr class="flex justify-between py-xs border-b border-outline-variant">
                  <td class="text-on-surface-variant">Thứ 7</td>
                  <td class="font-medium">9:00 – 16:00</td>
                </tr>
                <tr class="flex justify-between py-xs">
                  <td class="text-on-surface-variant">Chủ nhật</td>
                  <td class="text-on-surface-variant">Nghỉ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </section>
  `,
})
export class ContactComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Liên hệ | Calista',
      description: 'Liên hệ với Calista — chúng tôi luôn sẵn sàng tư vấn sản phẩm mỹ phẩm thuần chay và hỗ trợ đơn hàng của bạn.',
      canonical: 'https://calista.vn/lien-he',
    });
  }
  readonly mapPinIcon = MapPin;
  readonly phoneIcon = Phone;
  readonly mailIcon = Mail;
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
}
