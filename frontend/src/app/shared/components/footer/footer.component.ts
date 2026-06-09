import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="mt-xxxl border-t border-outline-variant bg-surface-low">
      <div class="container-app py-xxl">
        <div class="flex flex-col items-start gap-sm mb-xl">
          <img src="assets/images/logo.png" alt="Calista" style="height:40px" />
          <p class="text-body-sm text-on-surface-variant max-w-[400px]">
            Mỹ phẩm thuần chay từ chiết xuất thiên nhiên — an toàn, dịu nhẹ và bền vững.
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-lg mb-xl">
          <div>
            <h4 class="text-label-md text-on-surface mb-md">Khám phá</h4>
            <ul class="space-y-sm text-body-sm text-on-surface-variant">
              <li><a routerLink="/san-pham" class="hover:text-on-surface transition-colors">Tất cả sản phẩm</a></li>
              <li><a [routerLink]="['/san-pham']" [queryParams]="{category:'lam-sach'}" class="hover:text-on-surface transition-colors">Làm sạch</a></li>
              <li><a [routerLink]="['/san-pham']" [queryParams]="{category:'duong-am'}" class="hover:text-on-surface transition-colors">Dưỡng ẩm</a></li>
              <li><a [routerLink]="['/san-pham']" [queryParams]="{category:'treatment'}" class="hover:text-on-surface transition-colors">Treatment</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-label-md text-on-surface mb-md">Hỗ trợ</h4>
            <ul class="space-y-sm text-body-sm text-on-surface-variant">
              <li>Vận chuyển & Giao nhận</li>
              <li>Đổi trả & Hoàn tiền</li>
              <li>Hướng dẫn đặt hàng</li>
              <li>Câu hỏi thường gặp</li>
            </ul>
          </div>
          <div>
            <h4 class="text-label-md text-on-surface mb-md">Công ty</h4>
            <ul class="space-y-sm text-body-sm text-on-surface-variant">
              <li><a routerLink="/ve-chung-toi" class="hover:text-on-surface transition-colors">Về chúng tôi</a></li>
              <li><a routerLink="/lien-he" class="hover:text-on-surface transition-colors">Liên hệ</a></li>
              <li>Cam kết thuần chay</li>
              <li>Tuyển dụng</li>
            </ul>
          </div>
          <div>
            <h4 class="text-label-md text-on-surface mb-md">Nhận tin mới</h4>
            <p class="text-body-sm text-on-surface-variant mb-sm">
              Cập nhật ưu đãi và sản phẩm mới từ Calista.
            </p>
            <form class="flex gap-xs">
              <input class="input flex-1 !py-[8px] text-[13px]" placeholder="Email của bạn" />
              <button type="button" class="btn-primary !py-[8px] !px-md text-[13px]">Gửi</button>
            </form>
          </div>
        </div>

        <div class="border-t border-outline-variant pt-md flex flex-col md:flex-row md:items-center md:justify-between gap-sm text-body-sm text-on-surface-variant">
          <span>© {{ year }} Calista. Mọi quyền được bảo lưu.</span>
          <span>Made with care ✿ tại Việt Nam</span>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
