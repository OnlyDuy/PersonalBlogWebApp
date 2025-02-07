import { Component, OnInit } from '@angular/core';
import ValidateForm from '../../helpers/validate-form';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  type: string = 'password';
  isText: boolean = false;
  eyeIcon: string = 'fa-eye-slash';
  signupForm!: FormGroup;
  isSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      displayName: ['', Validators.required],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-z0-9]+@[a-z0-9]+\.[a-z]{2,}$/i),
        ],
      ],
      //email: ['', Validators.required],
      username: ['', Validators.required],
      passwordHash: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  hideShowPass() {
    this.isText = !this.isText;
    this.isText ? (this.eyeIcon = 'fa-eye') : (this.eyeIcon = 'fa-eye-slash');
    this.isText ? (this.type = 'text') : (this.type = 'password');
  }

  onSubmit() {
    if (this.signupForm.valid) {
      //Send tho obj to DB
      this.auth.signup(this.signupForm.value).subscribe({
        next: (res) => {
          this.signupForm.reset();
          this.toast.success(res.message, 'SUCCESS', 3000);
          this.router.navigate(['login']);
        },
        error: (err) => {
          alert(err?.error.message);
          //this.toast.danger({detail:"ERROR",summary:err?.error.message, duration:3000 });
        },
      });
    } else {
      ValidateForm.validateAllFormFields(this.signupForm);
      this.isSubmitted = true;
      this.toast.danger('Your form is invalid', 'ERROR', 3000);
    }
  }
}
