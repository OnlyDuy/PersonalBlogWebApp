import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import ValidateForm from '../../helpers/validate-form';
import { AuthService } from '../../services/auth.service';
import { UserStoreService } from '../../services/user-store.service';
import { ResetPasswordService } from '../../services/reset-password.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  type: string = "password";
  isText: boolean = false;
  eyeIcon: string = "fa-eye-slash";
  loginForm!: FormGroup;
  resetPasswordEmail!: string;
  isValidEmail!: boolean;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: NgToastService,
    private userStore: UserStoreService,
    private resetService: ResetPasswordService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      passwordHash: ['', Validators.required]
    })
  }

  hideShowPass() {
    this.isText = !this.isText;
    this.isText ? this.eyeIcon = "fa-eye" : this.eyeIcon = "fa-eye-slash";
    this.isText ? this.type = "text" : this.type = "password";
  }

  onSubmit() {
    if(this.loginForm.valid) {
      console.log(this.loginForm.value);
      //Send tho obj to DB
      this.auth.login(this.loginForm.value)
      .subscribe({
        next: res => {
          this.loginForm.reset();
          this.auth.storeToken(res.accessToken);
          this.auth.storeRefreshToken(res.refreshToken);
          const tokenPayload = this.auth.decodedToken();
          this.userStore.setDisplayNameForStore(tokenPayload.unique_name);
          this.userStore.setRoleForStore(tokenPayload.role);
          this.toast.success(res.message, "SUCCESS", 3000);
          this.router.navigate(['dashboard']);
        },
        error: err => {
          this.toast.danger(err.message, "ERROR",3000 );
          console.log(err);
        }
      })
    } else {
      ValidateForm.validateAllFormFields(this.loginForm);
      this.toast.danger("Your form is invalid","ERROR", 3000);

    }
  }

  checkValidEmail(value: any) {
    const pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,3}$/;
    this.isValidEmail = pattern.test(value);
    return this.isValidEmail;
  }

  confirmToSend() {
    if (this.checkValidEmail(this.resetPasswordEmail)) {
      console.log(this.resetPasswordEmail);
      this.resetService.sendResetPasswordLink(this.resetPasswordEmail).subscribe({
        next: (res) => {
          this.toast.success('Reset Success!', 'SUCCESS', 5000);
          this.resetPasswordEmail = "";
          const buttomRef = document.getElementById("closeBtn");
          buttomRef?.click();
        },
        error: (err) => {
          this.toast.danger('Something went wrong!', 'ERROR', 5000);
        }
      })
    }
  }
}
