import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NgToastService } from 'ng-angular-popup';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(NgToastService);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    toast.warning('Please login first', "WARN", 3000);
    router.navigate(['login']);
    return false;
  }
};
