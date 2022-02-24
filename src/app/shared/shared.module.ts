import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModalModule, NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';

PlotlyModule.plotlyjs = PlotlyJS;

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
    PlotlyModule
  ],
  exports: [
    FontAwesomeModule,
    NgbModalModule,
    NgbPopoverModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    PlotlyModule
  ]
})
export class SharedModule { }
