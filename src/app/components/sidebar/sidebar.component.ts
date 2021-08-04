import { Component, OnInit } from '@angular/core';
import { faBars } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  faBars = faBars;

  sidebarOpen: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  toggleSidebar(){
    this.sidebarOpen = !this.sidebarOpen;
  }

}
