import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModalModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FontAwesomeModule,
    NgbModalModule,
    NgbPopoverModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
  ],
  exports: [
    FontAwesomeModule,
    NgbModalModule,
    NgbPopoverModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
  ]
})
export class SharedModule { }
