import { Component, OnInit } from '@angular/core';
import ValidateForm from '../../helpers/validate-form';
import { ConfirmPasswordValidator } from '../../helpers/confirm-password.validator';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { ResetPassword } from '../../models/reset-password.model';
import { ResetPasswordService } from '../../services/reset-password.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './reset.component.html',
  styleUrl: './reset.component.scss',
})
export class ResetComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  emailToReset!: string;
  emailToken!: string;
  ResetPasswordObj = new ResetPassword();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private resetPasswordService: ResetPasswordService,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group(
      {
        password: [null, Validators.required],
        confirmPassword: [null, Validators.required],
      },
      {
        validator: ConfirmPasswordValidator('password', 'confirmPassword'),
      }
    );

    this.activatedRoute.queryParams.subscribe((val) => {
      this.emailToReset = val['email'];
      let uriToken = val['code'];
      this.emailToken = uriToken.replace(/ /g, '+');
      console.log(this.emailToReset);
      console.log(this.emailToken);
    });
  }

  reset() {
    if (this.resetPasswordForm.valid) {
      this.ResetPasswordObj.email = this.emailToReset;
      this.ResetPasswordObj.newPassword = this.resetPasswordForm.value.password;
      this.ResetPasswordObj.confirmPassword =
        this.resetPasswordForm.value.confirmPassword;
      this.ResetPasswordObj.emailToken = this.emailToken;

      this.resetPasswordService.resetPassword(this.ResetPasswordObj).subscribe({
        next: (res) => {
          this.toast.success('Password Reset Successfully!', 'SUCCESS', 3000);
          this.router.navigate(['/']);
        },
        error: (err) => {},
      });
    } else {
      ValidateForm.validateAllFormFields(this.resetPasswordForm);
    }
  }
}
