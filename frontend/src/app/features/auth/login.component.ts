import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { EyeIconComponent } from '../../shared/icons/eye-icon.component';
import { EyeOffIconComponent } from '../../shared/icons/eye-off-icon.component';
import { StarButtonDirective } from '../../shared/directives/star-button.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    EyeIconComponent,
    EyeOffIconComponent,
    StarButtonDirective,
  ],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2">
      <div class="hidden lg:block relative">
        <img src="assets/images/biatrangdangnhap.png" alt="" class="absolute inset-0 w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-tr from-primary/50 via-transparent to-secondary-container/40"></div>
        <div class="absolute bottom-xxl left-xxl text-white max-w-[420px]">
          <p class="text-label-md uppercase mb-md opacity-80">Calista</p>
          <h2 class="font-display text-display-lg-mob leading-tight">Vẻ đẹp được nuôi dưỡng từ thiên nhiên</h2>
        </div>
      </div>

      <div class="flex flex-col justify-center px-md py-xxl">
        <div class="w-full max-w-[440px] mx-auto">
          <a routerLink="/" class="flex justify-center mb-xl">
            <img src="assets/images/logo.png" alt="Calista" style="height:56px" />
          </a>

          <h1 class="font-display text-headline-md text-center mb-xs">Chào mừng trở lại</h1>
          <p class="text-body-md text-on-surface-variant text-center mb-xl">
            Đăng nhập để tiếp tục mua sắm tại Calista.
          </p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-md">
            <div>
              <label class="label">Email</label>
              <input formControlName="email" type="email" class="input" [class.input-error]="invalid('email')" placeholder="ban@calista.vn" />
              @if (invalid('email')) { <p class="text-body-sm text-error mt-xs animate-fade-in">Vui lòng nhập email hợp lệ.</p> }
            </div>

            <div>
              <label class="label">Mật khẩu</label>
              <div class="relative">
                <input formControlName="password" [type]="showPwd() ? 'text' : 'password'" class="input pr-[44px]" [class.input-error]="invalid('password')" placeholder="••••••" />
                <button type="button" (click)="showPwd.set(!showPwd())" class="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary" [attr.aria-label]="showPwd() ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'">
                  @if (showPwd()) { <app-icon-eye-off [size]="18" /> } @else { <app-icon-eye [size]="18" /> }
                </button>
              </div>
              @if (invalid('password')) { <p class="text-body-sm text-error mt-xs animate-fade-in">Vui lòng nhập mật khẩu.</p> }
            </div>

            <button type="submit" [disabled]="loading()" class="btn-primary btn-block" appStarBtn>
              {{ loading() ? 'Đang xử lý...' : 'Đăng nhập' }}
            </button>
          </form>

          <p class="text-center mt-lg text-body-md text-on-surface-variant">
            Chưa có tài khoản? <a routerLink="/dang-ky" class="text-primary font-semibold hover:underline">Đăng ký ngay</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  showPwd = signal(false);
  loading = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return c && c.invalid && (c.touched || c.dirty);
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.cart.mergeOnLogin();
        this.toast.success('Đăng nhập thành công');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => this.loading.set(false),
    });
  }
}
