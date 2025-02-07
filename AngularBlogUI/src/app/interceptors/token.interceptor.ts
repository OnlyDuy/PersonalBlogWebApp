import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgToastService } from 'ng-angular-popup';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenApiModel } from '../models/token-api.model';

export const tokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(NgToastService);

  const myToken = auth.getToken();

  if (myToken) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${myToken}` },
    });
  }

  return next(req).pipe(
    catchError((err: any) => {
      if (err.status === 401) {
        return handleUnAuthorizedError(req, next, auth, router, toast);
      }
      return throwError(() => new Error('Some other error occurred'));
    })
  );
};

// Xử lý lỗi trái phép và làm mới token
const handleUnAuthorizedError = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router,
  toast: NgToastService
) => {
  const tokenApiModel = new TokenApiModel();
  tokenApiModel.accessToken = auth.getToken()!;
  tokenApiModel.refreshToken = auth.getRefreshToken()!;

  return auth.renewToken(tokenApiModel).pipe(
    switchMap((data: TokenApiModel) => {
      auth.storeRefreshToken(data.refreshToken);
      auth.storeToken(data.accessToken);
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${data.accessToken}` },
      });
      return next(req);
    }),
    catchError(() => {
      toast.warning('Token is expired, Please Login again', 'Warning');
      router.navigate(['login']);
      return throwError(() => new Error('Unauthorized error'));
    })
  );
};
