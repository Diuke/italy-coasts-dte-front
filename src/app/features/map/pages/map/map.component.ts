import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  constructor(
    private modalService: NgbModal,
    private auth: AuthService
  ) { }

  loginFormUsername: string = "";
  loginFormPassword: string = "";
  
  loggedIn: boolean;

  ngOnInit(){
    this.loggedIn = this.auth.isLoggedIn();
  }

  currentModal: NgbModalRef;

  openLoginModal(loginModal: any){
    this.currentModal = this.modalService.open(loginModal);
  }

  closeCurrentModal(){
    this.currentModal.close();
  }

  tryLogin(loginForm: NgForm){
    let username = loginForm.value.loginFormUsername;
    let password = loginForm.value.loginFormPassword;
    console.log(username, password);    
    this.auth.login(username, password).subscribe(data => {
      this.auth.setToken(data.access);
      this.auth.setRefresh(data.refresh);     
      this.loggedIn = this.auth.isLoggedIn();
      this.closeCurrentModal();
    });
  }

  logout(){
    this.auth.logout();
    window.location.reload();
    this.loggedIn = this.auth.isLoggedIn();
  }

}
