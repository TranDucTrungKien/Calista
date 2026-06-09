import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../core/services/users.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="text-headline-md mb-lg">Người dùng</h1>
    <div class="card p-md">
      <table class="w-full text-body-sm">
        <thead>
          <tr class="border-b border-outline-variant text-on-surface-variant">
            <th class="text-left py-sm">Tên</th>
            <th class="text-left py-sm">Email</th>
            <th class="text-left py-sm">Vai trò</th>
          </tr>
        </thead>
        <tbody>
          @for (u of users(); track u.email) {
            <tr class="border-b border-outline-variant">
              <td class="py-sm font-semibold">{{ u.name }}</td>
              <td class="py-sm">{{ u.email }}</td>
              <td class="py-sm">
                <span class="chip-attr text-[10px]" [class.bg-primary-container]="u.role === 'admin'" [class.text-on-primary-container]="u.role === 'admin'">{{ u.role === 'admin' ? 'Quản trị' : 'Khách hàng' }}</span>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private users$ = inject(UsersService);
  users = signal<User[]>([]);

  ngOnInit() {
    this.users$.adminList().subscribe({ next: (r) => this.users.set(r.items) });
  }
}
