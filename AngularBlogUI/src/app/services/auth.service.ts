import { TokenApiModel } from '../models/token-api.model';
import { Router } from '@angular/router';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { TransferState, makeStateKey } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

const TOKEN_KEY = makeStateKey<string>('token');

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl: string = 'https://localhost:7150/api/User/';
  private userPayLoad: any;
  constructor(
    private http: HttpClient,
    private router: Router,
    private state: TransferState,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.userPayLoad = this.decodedToken();
  }

  signup(userObj: any) {
    return this.http.post<any>(`${this.baseUrl}register`, userObj);
  }

  login(userObj: any) {
    return this.http.post<any>(`${this.baseUrl}authenticate`, userObj);
  }

  storeRefreshToken(tokenValue: string) {
    localStorage.setItem('refreshToken', tokenValue);
  }

  storeToken(tokenValue: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', tokenValue);
    } else {
      this.state.set(TOKEN_KEY, tokenValue);
    }
  }

  getToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return this.state.get(TOKEN_KEY, null);
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  signOut() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
    }
    this.router.navigate(['login']);
  }

  // Phương thức giải mã token
  decodedToken() {
    if (isPlatformBrowser(this.platformId)) {
      const jwtHelper = new JwtHelperService();
      const token = this.getToken();
      return token ? jwtHelper.decodeToken(token) : null;
    }
    return null;
  }

  getDisplayNameFromToken() {
    if (this.userPayLoad)
      return this.userPayLoad.unique_name;
  }

  getRoleFromToken() {
    if (this.userPayLoad)
      return this.userPayLoad.role;
  }

  renewToken(tokenApi: TokenApiModel) {
    return this.http.post<any>(`${this.baseUrl}refresh`, tokenApi)
  }
}
