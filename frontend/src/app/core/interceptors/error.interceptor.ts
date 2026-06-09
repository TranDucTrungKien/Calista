import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const msg = err.error?.message || 'Đã xảy ra lỗi, vui lòng thử lại';
      if (err.status === 401 && !req.url.includes('/auth/')) {
        auth.logout();
        router.navigateByUrl('/dang-nhap');
      } else if (err.status >= 400 && err.status < 500) {
        toast.error(msg);
      } else if (err.status >= 500) {
        toast.error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
      return throwError(() => err);
    })
  );
};
