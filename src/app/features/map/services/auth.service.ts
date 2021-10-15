import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UrlsService } from '../../../core/services/urls.service';
import { LoginResponseModel } from '../../../core/models/authModels';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private urlsService: UrlsService,
    private http: HttpClient
  ) { }

  isLoggedIn(){
    return this.getToken() != null;
  }

  setToken(token: string){
    localStorage.setItem("jwt", token);
  }

  removeToken(){
    localStorage.removeItem("jwt");
  }

  getToken() : string|null {
    return localStorage.getItem("jwt");
  }

  setRefresh(refresh: string){
    localStorage.setItem("refresh", refresh);
  }

  removeRefresh(){
    localStorage.removeItem("refresh");
  }

  getRefresh(): string|null {
    return localStorage.getItem("refresh");
  }

  login(username: string, password: string){
    let URL = this.urlsService.buildUrl("login");
    let body = {
      "username": username,
      "password": password
    }
    return this.http.post<LoginResponseModel>(URL, body);
  }

  logout(){
    this.removeRefresh();
    this.removeToken();
  }

  
}
