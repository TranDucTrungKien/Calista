import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { ToastService } from '../../core/services/toast.service';
import { Address } from '../../core/models';
import { LocationIconComponent } from '../../shared/icons/location-icon.component';
import { TrashIconComponent } from '../../shared/icons/trash-icon.component';
import { PlusIconComponent } from '../../shared/icons/plus-icon.component';
import { StarButtonDirective } from '../../shared/directives/star-button.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LocationIconComponent,
    TrashIconComponent,
    PlusIconComponent,
    StarButtonDirective,
  ],
  template: `
    <div class="container-app py-lg">
      <h1 class="text-headline-md mb-lg">Tài khoản của tôi</h1>

      <div class="grid lg:grid-cols-2 gap-lg">
        <!-- Profile -->
        <section class="card p-lg">
          <h2 class="text-headline-sm mb-md">Thông tin cá nhân</h2>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="space-y-md">
            <div>
              <label class="label">Họ tên</label>
              <input formControlName="name" class="input" />
            </div>
            <div>
              <label class="label">Số điện thoại</label>
              <input formControlName="phone" class="input" />
            </div>
            <button type="submit" class="btn-primary" appStarBtn>Lưu thay đổi</button>
          </form>
        </section>

        <!-- Password -->
        <section class="card p-lg">
          <h2 class="text-headline-sm mb-md">Đổi mật khẩu</h2>
          <form [formGroup]="pwdForm" (ngSubmit)="savePwd()" class="space-y-md">
            <div>
              <label class="label">Mật khẩu hiện tại</label>
              <input formControlName="currentPassword" type="password" class="input" />
            </div>
            <div>
              <label class="label">Mật khẩu mới</label>
              <input formControlName="newPassword" type="password" class="input" />
            </div>
            <button type="submit" class="btn-primary" appStarBtn>Cập nhật mật khẩu</button>
          </form>
        </section>

        <!-- Addresses -->
        <section class="card p-lg lg:col-span-2">
          <div class="flex items-center justify-between mb-md">
            <h2 class="text-headline-sm flex items-center gap-sm">
              <app-icon-location [size]="20" class="text-primary" /> Sổ địa chỉ
            </h2>
            <button type="button" (click)="addingAddr.set(!addingAddr())" class="btn-ghost !py-[6px] !px-md text-[12px]">
              <app-icon-plus [size]="14" /> Thêm địa chỉ
            </button>
          </div>

          @if (addingAddr()) {
            <form [formGroup]="addrForm" (ngSubmit)="saveAddr()" class="grid md:grid-cols-2 gap-md p-md rounded-md bg-surface-low mb-md">
              <div><label class="label">Họ tên</label><input formControlName="fullName" class="input" /></div>
              <div><label class="label">Điện thoại</label><input formControlName="phone" class="input" /></div>
              <div><label class="label">Tỉnh / TP</label><input formControlName="province" class="input" /></div>
              <div><label class="label">Quận / Huyện</label><input formControlName="district" class="input" /></div>
              <div><label class="label">Phường / Xã</label><input formControlName="ward" class="input" /></div>
              <div class="md:col-span-2"><label class="label">Địa chỉ</label><input formControlName="line1" class="input" /></div>
              <label class="flex items-center gap-sm text-body-sm md:col-span-2">
                <input type="checkbox" formControlName="isDefault" /> Đặt làm mặc định
              </label>
              <div class="md:col-span-2 flex gap-sm">
                <button type="submit" class="btn-primary" appStarBtn>Lưu địa chỉ</button>
                <button type="button" (click)="addingAddr.set(false)" class="btn-ghost" appStarBtn>Hủy</button>
              </div>
            </form>
          }

          @if (addresses().length === 0) {
            <p class="text-body-md text-on-surface-variant text-center py-md">Chưa có địa chỉ nào.</p>
          } @else {
            <div class="grid md:grid-cols-2 gap-md">
              @for (a of addresses(); track a._id) {
                <div class="card p-md border border-outline-variant" [class.border-primary]="a.isDefault">
                  <div class="flex items-center justify-between mb-xs">
                    <p class="font-semibold">{{ a.fullName }}</p>
                    @if (a.isDefault) { <span class="chip-attr text-[10px]">Mặc định</span> }
                  </div>
                  <p class="text-body-sm text-on-surface-variant">{{ a.phone }}</p>
                  <p class="text-body-sm mt-xs">{{ formatAddress(a) }}</p>
                  <div class="flex justify-end mt-sm">
                    <button type="button" (click)="removeAddr(a)" class="text-body-sm text-error hover:underline flex items-center gap-xs">
                      <app-icon-trash [size]="14" /> Xóa
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private users = inject(UsersService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  addingAddr = signal(false);
  addresses = signal<Address[]>([]);

  profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: [''],
  });

  pwdForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  addrForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    phone: ['', Validators.required],
    province: ['', Validators.required],
    district: [''],
    ward: [''],
    line1: ['', Validators.required],
    isDefault: [false],
  });

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.profileForm.patchValue({ name: user.name, phone: user.phone || '' });
      this.addresses.set(user.addresses || []);
    }
    this.users.me().subscribe({
      next: (res) => {
        this.auth.setUser(res.user);
        this.profileForm.patchValue({ name: res.user.name, phone: res.user.phone || '' });
        this.addresses.set(res.user.addresses || []);
      },
    });
  }

  formatAddress(a: Address) {
    return [a.line1, a.ward, a.district, a.province].filter(Boolean).join(', ');
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.users.update(this.profileForm.getRawValue()).subscribe({
      next: (res) => {
        this.auth.setUser(res.user);
        this.toast.success('Cập nhật thông tin thành công');
      },
    });
  }

  savePwd() {
    if (this.pwdForm.invalid) return;
    const { currentPassword, newPassword } = this.pwdForm.getRawValue();
    this.users.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.toast.success('Đổi mật khẩu thành công');
        this.pwdForm.reset();
      },
    });
  }

  saveAddr() {
    if (this.addrForm.invalid) return;
    this.users.addAddress(this.addrForm.getRawValue() as any).subscribe({
      next: (res) => {
        this.addresses.set(res.addresses);
        this.toast.success('Đã thêm địa chỉ');
        this.addrForm.reset({ isDefault: false } as any);
        this.addingAddr.set(false);
      },
    });
  }

  removeAddr(a: Address) {
    if (!a._id) return;
    if (!confirm('Xóa địa chỉ này?')) return;
    this.users.removeAddress(a._id).subscribe({
      next: (res) => {
        this.addresses.set(res.addresses);
        this.toast.success('Đã xóa địa chỉ');
      },
    });
  }
}
