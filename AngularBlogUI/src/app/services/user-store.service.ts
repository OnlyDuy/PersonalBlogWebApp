import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserStoreService {

  private displayName$ = new BehaviorSubject<string>("");
  private role$ = new BehaviorSubject<string>("");

  constructor() { }

  public getRoleFromStore() {
    //cho phép các thành phần đăng ký theo dõi thay đổi của vai trò.
    return this.role$.asObservable();
  }

  public setRoleForStore(role: string) {
    // ập nhật giá trị của observable role$ bằng phương thức .next(role)
    this.role$.next(role);
  }

  public getDisplayNameFromStore() {
    return this.displayName$.asObservable();
  }

  public setDisplayNameForStore(displayName: string) {
    this.displayName$.next(displayName);
  }
}
