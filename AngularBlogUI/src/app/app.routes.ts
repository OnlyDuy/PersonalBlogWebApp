import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { ResetComponent } from './components/reset/reset.component';
import { HomeUserComponent } from './components/home-user/home-user.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home-user', pathMatch: 'full' },

  {path: 'login', component: LoginComponent},
  {path: 'signup', component: SignupComponent},
  {path: 'reset', component: ResetComponent},
  {path: 'home-user', component: HomeUserComponent},
  {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
];
