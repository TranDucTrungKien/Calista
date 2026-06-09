import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { EyeIconComponent } from '../../shared/icons/eye-icon.component';
import { EyeOffIconComponent } from '../../shared/icons/eye-off-icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    EyeIconComponent,
    EyeOffIconComponent,
  ],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2">
      <div class="hidden lg:block relative">
        <img src="https://picsum.photos/seed/calista-register/900/1200" alt="" class="absolute inset-0 w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-tr from-primary/50 via-transparent to-secondary-container/40"></div>
        <div class="absolute bottom-xxl left-xxl text-white max-w-[420px]">
          <p class="text-label-md uppercase mb-md opacity-80">Calista</p>
          <h2 class="font-display text-display-lg-mob leading-tight">Tham gia hành trình chăm sóc da bền vững</h2>
        </div>
      </div>

      <div class="flex flex-col justify-center px-md py-xxl">
        <div class="w-full max-w-[440px] mx-auto">
          <a routerLink="/" class="flex justify-center mb-xl">
            <img src="assets/images/logo.png" alt="Calista" style="height:56px" />
          </a>

          <h1 class="font-display text-headline-md text-center mb-xs">Tạo tài khoản mới</h1>
          <p class="text-body-md text-on-surface-variant text-center mb-xl">Nhận ưu đãi độc quyền dành cho thành viên Calista.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-md">
            <div>
              <label class="label">Họ và tên</label>
              <input formControlName="name" class="input" [class.input-error]="invalid('name')" placeholder="Nguyễn Văn A" />
              @if (invalid('name')) { <p class="text-body-sm text-error mt-xs animate-fade-in">Vui lòng nhập họ tên.</p> }
            </div>
            <div>
              <label class="label">Email</label>
              <input formControlName="email" type="email" class="input" [class.input-error]="invalid('email')" placeholder="ban@calista.vn" />
              @if (invalid('email')) { <p class="text-body-sm text-error mt-xs animate-fade-in">Vui lòng nhập email hợp lệ.</p> }
            </div>
            <div>
              <label class="label">Số điện thoại</label>
              <input formControlName="phone" class="input" placeholder="0901 234 567" />
            </div>
            <div>
              <label class="label">Mật khẩu</label>
              <div class="relative">
                <input formControlName="password" [type]="showPwd() ? 'text' : 'password'" class="input pr-[44px]" [class.input-error]="invalid('password')" placeholder="Tối thiểu 6 ký tự" />
                <button type="button" (click)="showPwd.set(!showPwd())" class="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
                  @if (showPwd()) { <app-icon-eye-off [size]="18" /> } @else { <app-icon-eye [size]="18" /> }
                </button>
              </div>
              @if (invalid('password')) { <p class="text-body-sm text-error mt-xs animate-fade-in">Mật khẩu tối thiểu 6 ký tự.</p> }
            </div>

            <button type="submit" [disabled]="loading()" class="btn-primary btn-block">
              {{ loading() ? 'Đang xử lý...' : 'Đăng ký' }}
            </button>
          </form>

          <p class="text-center mt-lg text-body-md text-on-surface-variant">
            Đã có tài khoản? <a routerLink="/dang-nhap" class="text-primary font-semibold hover:underline">Đăng nhập</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);

  showPwd = signal(false);
  loading = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return c && c.invalid && (c.touched || c.dirty);
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.cart.mergeOnLogin();
        this.toast.success('Đăng ký thành công. Chào mừng đến với Calista!');
        this.router.navigateByUrl('/');
      },
      error: () => this.loading.set(false),
    });
  }
}
