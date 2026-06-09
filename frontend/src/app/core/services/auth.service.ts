import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';

interface AuthResponse {
  user: User;
  accessToken: string;
}

const TOKEN_KEY = 'calista.token';
const USER_KEY = 'calista.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<User | null>(this.readUser());
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  user = computed(() => this._user());
  token = computed(() => this._token());
  isAuthenticated = computed(() => !!this._user());
  isAdmin = computed(() => this._user()?.role === 'admin');

  private readUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private store(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.accessToken);
    this._user.set(res.user);
  }

  setUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this._token.set(token);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(tap((res) => this.store(res)));
  }

  register(payload: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload, {
        withCredentials: true,
      })
      .pipe(tap((res) => this.store(res)));
  }

  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(tap((res) => this.store(res)));
  }

  logout() {
    this.http
      .post(
        `${environment.apiUrl}/auth/logout`,
        {},
        { withCredentials: true }
      )
      .subscribe({ complete: () => {}, error: () => {} });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigateByUrl('/');
  }
}
