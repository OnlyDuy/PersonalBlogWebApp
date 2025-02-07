import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { UserStoreService } from '../../services/user-store.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  public users: any = [];
  public displayName : string = "";
  public role!:string;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private userStore: UserStoreService
  ) { }

  ngOnInit() {
    this.api.getUsers().subscribe(res => {
      this.users = res;
    });

    this.userStore.getDisplayNameFromStore().subscribe(val => {
      let displayNameFromToken = this.auth.getDisplayNameFromToken();
      this.displayName = val || displayNameFromToken
    })

    this.userStore.getRoleFromStore().subscribe(val=>{
      const roleFromToken = this.auth.getRoleFromToken();
      this.role = val || roleFromToken;
    })
  }

  logout() {
    this.auth.signOut();
  }

}

