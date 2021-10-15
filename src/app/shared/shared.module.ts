import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FontAwesomeModule,
    NgbModalModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
  ],
  exports: [
    FontAwesomeModule,
    NgbModalModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
  ]
})
export class SharedModule { }
