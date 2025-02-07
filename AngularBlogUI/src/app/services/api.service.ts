import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl: string = 'https://localhost:7150/api/User/'
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  getUsers() {
    return this.http.get<any>(this.baseUrl);
  }
}
